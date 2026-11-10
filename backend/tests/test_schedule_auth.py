import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient
from main import app
from dependencies.auth import get_current_user

OWNER = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"
TASK = "33333333-3333-4333-8333-333333333333"


class ScheduleAuthorizationTests(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()

    def test_schedule_requires_authentication(self):
        with TestClient(app) as client:
            self.assertIn(client.get(f"/api/schedule/user/{OWNER}").status_code, (401, 403))

    def test_schedule_rejects_another_user(self):
        app.dependency_overrides[get_current_user] = lambda: {"id": OWNER}
        with TestClient(app) as client, patch("controllers.schedule_controller.schedule_service.get_schedule") as read:
            self.assertEqual(client.get(f"/api/schedule/user/{OTHER}").status_code, 403)
            read.assert_not_called()
            read.return_value = []
            self.assertEqual(client.get(f"/api/schedule/user/{OWNER}").status_code, 200)

    def test_confirm_does_not_clear_schedule_for_foreign_task(self):
        app.dependency_overrides[get_current_user] = lambda: {"id": OWNER}
        with TestClient(app) as client, patch(
            "controllers.schedule_controller.task_repo.get_task_by_id",
            return_value=SimpleNamespace(user_id=UUID(OTHER)),
        ), patch("controllers.schedule_controller.schedule_service.repo.clear_schedules_for_user") as clear:
            response = client.post(f"/api/schedule/confirm?user_id={OWNER}", json=[{
                "task_id": TASK, "scheduled_start": "2026-11-11T10:00:00",
                "scheduled_end": "2026-11-11T11:00:00",
            }])
            self.assertEqual(response.status_code, 404)
            clear.assert_not_called()
