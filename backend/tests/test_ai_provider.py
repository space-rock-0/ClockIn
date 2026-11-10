import asyncio
import json
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient

from services.ai_provider import AISettings, candidates, complete_json, request_ai_settings
from services.openai_service import AIService


class AIProviderTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.env = patch.dict("os.environ", {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)

    async def run_mock(self, settings, handler, *, fallback=True):
        original_client = httpx.AsyncClient
        with patch("services.ai_provider.httpx.AsyncClient", side_effect=lambda **kw: original_client(
            transport=httpx.MockTransport(handler), **kw
        )):
            return await complete_json('Return JSON: {"ok":true}', settings=settings, fallback=fallback)

    async def test_no_key_has_actionable_error(self):
        with self.assertRaises(HTTPException) as error:
            candidates(AISettings())
        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("Settings", error.exception.detail)

    async def test_auto_prefers_groq_without_openai(self):
        self.assertEqual(candidates(AISettings(groq_key="test-groq"))[0][0], "groq")

    async def test_personal_keys_do_not_use_server_keys(self):
        with patch.dict("os.environ", {"GROQ_API_KEY": "operator-key"}):
            result = candidates(AISettings(provider="openai", openai_key="personal-key"))
        self.assertEqual([item[0] for item in result], ["openai"])

    async def test_environment_groq_without_openai(self):
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            self.assertEqual(candidates(AISettings())[0][0], "groq")

    async def test_selected_provider_must_be_configured(self):
        with self.assertRaises(HTTPException):
            candidates(AISettings(provider="anthropic", groq_key="test-groq"))

    async def test_openai_failure_falls_back_to_groq(self):
        hosts = []
        def handler(request):
            hosts.append(request.url.host)
            if request.url.host == "api.openai.com":
                return httpx.Response(429, json={"error": "private upstream details"})
            self.assertEqual(request.headers["Authorization"], "Bearer test-groq")
            self.assertEqual(json.loads(request.content)["response_format"], {"type": "json_object"})
            return httpx.Response(200, json={"choices": [{"message": {"content": '{"ok":true}'}}]})
        result, provider, _ = await self.run_mock(
            AISettings(provider="openai", openai_key="test-openai", groq_key="test-groq"), handler
        )
        self.assertEqual(hosts, ["api.openai.com", "api.groq.com"])
        self.assertEqual((result, provider), ({"ok": True}, "groq"))

    async def test_connection_test_does_not_hide_invalid_key(self):
        hosts = []
        def handler(request):
            hosts.append(request.url.host)
            return httpx.Response(401, json={"error": "secret-token"})
        with self.assertRaises(HTTPException) as error:
            await self.run_mock(AISettings(provider="openai", openai_key="test-openai", groq_key="test-groq"), handler, fallback=False)
        self.assertEqual(hosts, ["api.openai.com"])
        self.assertNotIn("secret-token", error.exception.detail)

    async def test_fallback_can_be_disabled(self):
        result = candidates(AISettings(provider="anthropic", anthropic_key="test", groq_key="test", groq_fallback=False))
        self.assertEqual([item[0] for item in result], ["anthropic"])

    async def test_anthropic_messages_and_fenced_json(self):
        def handler(request):
            self.assertEqual(str(request.url), "https://api.anthropic.com/v1/messages")
            self.assertEqual(request.headers["x-api-key"], "test-anthropic")
            self.assertIn("max_tokens", json.loads(request.content))
            return httpx.Response(200, json={"content": [{"type": "text", "text": '```json\n{"steps": []}\n```'}]})
        result, provider, _ = await self.run_mock(AISettings(provider="anthropic", anthropic_key="test-anthropic"), handler)
        self.assertEqual((result, provider), ({"steps": []}, "anthropic"))

    async def test_invalid_json_returns_sanitized_error(self):
        def handler(request):
            return httpx.Response(200, json={"choices": [{"message": {"content": "not json"}}]})
        with self.assertRaises(HTTPException) as error:
            await self.run_mock(AISettings(groq_key="secret-value"), handler)
        self.assertEqual(error.exception.status_code, 502)
        self.assertNotIn("secret-value", error.exception.detail)

    async def test_concurrent_request_credentials_are_isolated(self):
        async def execute(key):
            token = request_ai_settings.set(AISettings(groq_key=key))
            try:
                await asyncio.sleep(0)
                return candidates(request_ai_settings.get())[0][1]
            finally:
                request_ai_settings.reset(token)
        self.assertEqual(await asyncio.gather(execute("user-a"), execute("user-b")), ["user-a", "user-b"])
        self.assertIsNone(request_ai_settings.get())

    async def test_existing_ai_services_use_shared_router(self):
        service = AIService()  # Starting without an OpenAI key must work.
        with patch("services.openai_service.complete_json", return_value=({"tasks": [{"title": "Read"}]}, "groq", "test")):
            tasks = await service.extract_task_fields("Read", "Chapter one", "user-a", "blue")
        self.assertEqual(tasks[0]["user_id"], "user-a")
        self.assertEqual(tasks[0]["color"], "blue")


class AIRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from main import app
        cls.app = app

    def test_health_and_bad_header(self):
        with TestClient(self.app) as client:
            self.assertEqual(client.get("/health").status_code, 200)
            response = client.get("/health", headers={"X-AI-Settings": '{"provider":"invalid","groq_key":"private"}'})
            self.assertEqual(response.status_code, 400)
            self.assertNotIn("private", response.text)

    def test_connection_endpoint_requires_authentication(self):
        with TestClient(self.app) as client:
            self.assertIn(client.post("/api/ai/test", json={}).status_code, [401, 403])

    def test_authenticated_connection_endpoint(self):
        from dependencies.auth import get_current_user
        self.app.dependency_overrides[get_current_user] = lambda: {"id": "user-a"}
        try:
            with TestClient(self.app) as client, patch("controllers.ai_controller.complete_json", return_value=({"ok": True}, "groq", "test-model")):
                response = client.post("/api/ai/test", json={"provider": "groq", "groq_key": "private-key"})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), {"ok": True, "provider": "groq", "model": "test-model"})
                self.assertNotIn("private-key", response.text)
        finally:
            self.app.dependency_overrides.clear()

    def test_workflow_receives_saved_settings_without_leaking_between_requests(self):
        from dependencies.auth import get_current_user
        from services import ai_provider
        self.app.dependency_overrides[get_current_user] = lambda: {"id": "user-a"}
        original_client = httpx.AsyncClient
        seen_keys = []
        def handler(request):
            seen_keys.append(request.headers["Authorization"])
            return httpx.Response(200, json={"choices": [{"message": {"content": '{"steps":[{"label":"Focus","duration_seconds":1500}]}'}}]})
        try:
            with patch.dict("os.environ", {}, clear=True), TestClient(self.app) as client, patch.object(
                ai_provider.httpx, "AsyncClient", side_effect=lambda **kw: original_client(transport=httpx.MockTransport(handler), **kw)
            ):
                for key in ["user-a-key", "user-b-key"]:
                    response = client.post("/api/timer/workflow", json={"title": "Read"}, headers={
                        "X-AI-Settings": json.dumps({"provider": "groq", "groq_key": key})
                    })
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()["steps"][0]["label"], "Focus")
                response = client.post("/api/timer/workflow", json={"title": "Read"})
                self.assertEqual(response.status_code, 400)
                self.assertEqual(seen_keys, ["Bearer user-a-key", "Bearer user-b-key"])
        finally:
            self.app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
