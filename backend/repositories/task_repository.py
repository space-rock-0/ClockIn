from typing import List

class TaskRepository:
    def __init__(self, supabase):
        self.supabase = supabase

    def create(self, task_data, user_id):
    # Handle case where task_data comes in as a JSON string
        if isinstance(task_data, str):
            import json
            task_data = json.loads(task_data)
        
        task_data["user_id"] = user_id
        result = self.supabase.table('Tasks').insert(task_data).execute()
        print("Supabase insert result:", result)
        return result.data[0] if result.data else None
    
    async def insert_many(self, tasks_data: list, user_id: str):
        #insert a list of tasks for a user, return the created tasks
        response = self.supabase.table("Tasks").insert([
            {**task, "user_id": user_id} for task in tasks_data
        ]).execute()
        return response.data

    def get_task(self, task_id: str, user_id: str):
        result = self.supabase.table("Tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        if not result.data:
            raise ValueError(f"Task {task_id} not found")
        return result.data[0]

    def get_tasks(self, user_id):
        response = self.supabase.table('Tasks').select('*').eq('user_id', user_id).execute()
        return response.data

    def delete_task(self, task_id: str, user_id: str):
            result = (
                self.supabase
                .table("Tasks")
                .delete()
                .eq("id", task_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not result.data:
                raise Exception("Task not found")

            return task_id

    def update_task(self, task_id: str, task_data: dict, user_id: str):
        task_data = {key: value for key, value in task_data.items() if key not in ("id", "user_id")}
        result = (
            self.supabase
                .table('Tasks')
                .update(task_data)
                .eq('id', task_id)
                .eq('user_id', user_id)
                .execute()
        )
        return result.data[0]

    def get_tasks_by_ids(self, user_id: str, task_ids: List[str]):
        print("Hit the repo")
        result = (
            self.supabase
            .table("Tasks")
            .select("*")
            .eq("user_id", user_id)
            .in_("id", task_ids)
            .execute()
        )

        return result.data or []

