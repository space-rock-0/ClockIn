from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Task:
    """Domain model mirroring the Supabase tasks table row."""

    def __init__(
        self,
        id: UUID,
        user_id: UUID,
        created_at: datetime,
        title: str,
        description: Optional[str],
        task_duration: Optional[int],
        priority: Optional[int],
        due_date: Optional[datetime],
        can_schedule: bool,
        is_complete: bool = False,
    ) -> None:
        self.id = id
        self.user_id = user_id
        self.created_at = created_at
        self.title = title
        self.description = description
        self.task_duration = task_duration
        self.priority = priority
        self.due_date = due_date
        self.can_schedule = can_schedule
        self.is_complete = is_complete

    def markComplete(self) -> None:
        self.is_complete = True


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class TaskCreateRequest(BaseModel):  #what fields the frontend is sending as a request to retreive from backend
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    task_duration: Optional[int] = Field(None, gt=0, description="Duration in minutes")
    priority: Optional[int] = None
    can_schedule: bool = False


class TaskUpdateRequest(BaseModel): #all optional cause its only if you wanna update
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    task_duration: Optional[int] = Field(None, gt=0)
    priority: Optional[int] = None
    can_schedule: Optional[bool] = None
    is_complete: Optional[bool] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class TaskResponse(BaseModel): #defines what gets sent back
    id: UUID
    user_id: UUID
    created_at: datetime
    title: str
    description: Optional[str]
    task_duration: Optional[int]
    priority: Optional[int]
    due_date: Optional[datetime]
    can_schedule: bool
    is_complete: bool

    model_config = {"from_attributes": True}
