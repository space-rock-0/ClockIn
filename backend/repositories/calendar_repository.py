from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from database.supabase_client import supabase
from database.database_models import Task, TaskCreateRequest, TaskUpdateRequest
#directly talks to supabase and tells what to pull. also imports models from 


def _row_to_task(row: dict) -> Task:
    """Convert a Supabase row dict into a Task domain object."""
    return Task(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        title=row["title"],
        description=row.get("description"),
        task_duration=row.get("task_duration"),
        priority=row.get("priority"),
        due_date=(
            datetime.fromisoformat(row["due_date"]) if row.get("due_date") else None
        ),
        can_schedule=row.get("can_schedule", False),
        is_complete=row.get("is_complete", False),
    )


class CalendarRepository:
    """Handles all Supabase CRUD operations for the tasks table."""

    TABLE = "Tasks" #the name of the database from supabase

    def get_task_by_id(self, task_id: UUID) -> Optional[Task]:
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("id", str(task_id))
            .execute()
        )
        if not response.data:
            return None
        return _row_to_task(response.data[0]) #select all tasks from the supabase table where the task_id matches the given id (from top)
        # if there isnt anything found, return None, otherwise, convert first result to a Task object

    def get_tasks_by_ids(self, task_ids: list[str]) -> list[Task]:
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .in_("id", task_ids)
            .execute()
        )
        if not response.data:
            return []
        return [_row_to_task(row) for row in response.data]

    def get_tasks_by_user(self, user_id: str) -> list[Task]:
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data: 
            return None
        return [_row_to_task(row) for row in response.data] #same thing but with users

    def create_task(self, payload: TaskCreateRequest, user_id: str) -> Task:
        data = {
            "user_id": user_id,
            "title": payload.title,
            "description": payload.description,
            "due_date": payload.due_date.isoformat() if payload.due_date else None,
            "task_duration": payload.task_duration,
            "priority": payload.priority,
            "can_schedule": payload.can_schedule,
        }
        response = supabase.table(self.TABLE).insert(data).execute()
        return _row_to_task(response.data[0]) #create a new row in supabase, creates a task, inserts it, then returns it again

    def update_task(self, task_id: UUID, payload: TaskUpdateRequest) -> Task:
        updates: dict = {}
        if payload.title is not None:
            updates["title"] = payload.title
        if payload.description is not None:
            updates["description"] = payload.description
        if payload.due_date is not None:
            updates["due_date"] = payload.due_date.isoformat()
        if payload.task_duration is not None:
            updates["task_duration"] = payload.task_duration
        if payload.priority is not None:
            updates["priority"] = payload.priority
        if payload.can_schedule is not None:
            updates["can_schedule"] = payload.can_schedule
        if payload.is_complete is not None:
            updates["is_complete"] = payload.is_complete

        response = (
            supabase.table(self.TABLE)
            .update(updates)
            .eq("id", str(task_id))
            .execute()
        )
        return _row_to_task(response.data[0]) #builds an empty updates dict and only updates the parts that arent none (all are optional)

    def delete_task(self, task_id: UUID) -> bool:
        response = (
            supabase.table(self.TABLE)
            .delete()
            .eq("id", str(task_id))
            .execute()
        )
        return len(response.data) > 0 #deletes a row based on ID, returns true if something was deleted and false otherwise 
