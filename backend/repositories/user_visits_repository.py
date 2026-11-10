# user_visits_repository.py
from database.supabase_client import supabase

class UserVisitsRepository:
    @staticmethod
    async def get_by_user_id(user_id: str):
        print("repository called, calling supabase now")
        response = (
            supabase.table("user_visits")
            .select(
                "visited_home, visited_notes, visited_tasks,"
                "visited_schedule, visited_timer, visited_garden"
            )
            .eq("id", user_id)
            .execute()
        )

        print("supabase response:", response.data)

        # response.data is a list — grab first row or create one
        if not response.data:
            return await UserVisitsRepository.create_default(user_id)

        return response.data[0]  # ✅ return the object, not the list

    @staticmethod
    async def create_default(user_id: str):
        defaults = {
            "id": user_id,
            "visited_home": False,
            "visited_notes": False,
            "visited_tasks": False,
            "visited_schedule": False,
            "visited_timer": False,
            "visited_garden": False,
        }
        response = (
            supabase.table("user_visits")
            .insert(defaults)
            .execute()
        )
        return response.data[0]

    @staticmethod
    async def set_visited(user_id: str, column: str):
        response = (
            supabase.table("user_visits")
            .update({column: True})
            .eq("id", user_id)
            .execute()
        )
        return response.data[0]