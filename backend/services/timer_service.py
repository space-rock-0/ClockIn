# timer_service.py

class TimerService:
    def __init__(self, repo):
        self.repo = repo

    def create_session(self, user_id: str, data: dict):
        data["user_id"] = user_id

        row = self.repo.create_session(data)

        return self._normalize_session(row)

    @staticmethod
    def _normalize_session(row):
        return {
            "id": row.get("id"),
            "task_id": row.get("task_id"),
            "mode": row.get("mode"),
            "started_at": row.get("started_at"),
            "ended_at": row.get("ended_at"),
            "elapsed_seconds": row.get("elapsed_seconds"),
            "active_seconds": row.get("active_seconds"),
            "task_completed": row.get("task_completed"),
        }