"""Request-scoped AI routing. User credentials are never written to disk."""
import json
import os
from contextvars import ContextVar
from typing import Literal

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, SecretStr

Provider = Literal["auto", "groq", "openai", "anthropic"]
DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-haiku-4-5",
}


class AISettings(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: Provider = "auto"
    groq_key: SecretStr = SecretStr("")
    openai_key: SecretStr = SecretStr("")
    anthropic_key: SecretStr = SecretStr("")
    groq_model: str = Field(default="", max_length=120, pattern=r"^[\w./:-]*$")
    openai_model: str = Field(default="", max_length=120, pattern=r"^[\w./:-]*$")
    anthropic_model: str = Field(default="", max_length=120, pattern=r"^[\w./:-]*$")
    groq_fallback: bool = True


request_ai_settings: ContextVar[AISettings | None] = ContextVar("ai_settings", default=None)


def candidates(settings: AISettings, *, fallback: bool = True):
    # Once a user supplies credentials, never silently use an operator's paid key.
    user_keys = any(getattr(settings, f"{p}_key").get_secret_value().strip() for p in DEFAULT_MODELS)
    configured = {}
    for provider, default_model in DEFAULT_MODELS.items():
        key = getattr(settings, f"{provider}_key").get_secret_value().strip()
        if not user_keys:
            key = os.getenv(f"{provider.upper()}_API_KEY", "").strip()
        model = getattr(settings, f"{provider}_model") or os.getenv(f"{provider.upper()}_MODEL") or default_model
        if key:
            configured[provider] = (provider, key, model)
    if settings.provider == "auto":
        # Prefer Groq so an OpenAI subscription is never required.
        order = ["groq", "openai", "anthropic"]
        if not fallback:
            order = [next((p for p in order if p in configured), "groq")]
    else:
        if settings.provider not in configured:
            raise HTTPException(400, f"Add your {settings.provider.title()} API key in Settings.")
        order = [settings.provider]
        if fallback and settings.groq_fallback and settings.provider != "groq":
            order.append("groq")
    result = [configured[p] for p in order if p in configured]
    if not result:
        raise HTTPException(400, "No AI API key configured. Add a Groq, OpenAI, or Anthropic key in Settings.")
    return result


async def complete_json(prompt: str, *, settings: AISettings | None = None, fallback: bool = True):
    settings = settings or request_ai_settings.get() or AISettings()
    failures = []
    for provider, key, model in candidates(settings, fallback=fallback):
        try:
            messages = [{"role": "user", "content": prompt}]
            async with httpx.AsyncClient(timeout=45) as client:
                if provider == "anthropic":
                    response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
                        json={"model": model, "max_tokens": 4096,
                              "system": "Return only a valid JSON object. Do not use markdown fences.",
                              "messages": messages},
                    )
                else:
                    base = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
                    response = await client.post(
                        f"{base}/chat/completions",
                        headers={"Authorization": f"Bearer {key}"},
                        json={"model": model, "messages": messages,
                              "response_format": {"type": "json_object"}},
                    )
                response.raise_for_status()
                data = response.json()
                raw = ("".join(block["text"] for block in data["content"] if block.get("type") == "text")
                       if provider == "anthropic" else data["choices"][0]["message"]["content"])
                raw = raw.strip()
                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                result = json.loads(raw)
                if not isinstance(result, dict):
                    raise ValueError("Expected a JSON object")
                return result, provider, model
        except httpx.HTTPStatusError as exc:
            # Do not expose upstream responses, prompts, or credentials.
            failures.append(f"{provider.title()} returned HTTP {exc.response.status_code}")
        except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError):
            failures.append(f"{provider.title()} was unavailable or returned invalid JSON")
    raise HTTPException(502, "; ".join(failures) + ". Check the key, model, quota, and connection in Settings.")
