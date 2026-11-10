from repositories.user_visits_repository import UserVisitsRepository

VALID_PAGES = {"home", "notes", "tasks", "schedule", "timer", "garden"}

class UserVisitsService:
    @staticmethod
    async def get_visits(user_id: str):
        print("service called get visits, calling repository")
        return await UserVisitsRepository.get_by_user_id(user_id)

    @staticmethod
    async def mark_visited(user_id: str, page: str):
        if page not in VALID_PAGES:
            raise ValueError(f"Invalid page: {page}")
        col = f"visited_{page}"
        return await UserVisitsRepository.set_visited(user_id, col)