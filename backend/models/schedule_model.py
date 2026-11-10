from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class SlotScoreRequest(BaseModel):
    task_id: UUID
    proposed_start: datetime


class SlotScoreResponse(BaseModel):
    task_id: UUID
    proposed_start: datetime
    score: float
    accepted: bool


class BehaviorEventRequest(BaseModel):
    task_id: UUID
    slot_offered: datetime
    action: str  # "accepted", "rescheduled", "ignored"


class ScheduleRequest(BaseModel):
    task_id: UUID
    scheduled_start: datetime
    scheduled_end: datetime


class ScheduleResponse(BaseModel):
    id: UUID
    task_id: UUID
    scheduled_start: datetime
    scheduled_end: datetime
    created_at: datetime


class AutoScheduleRequest(BaseModel):
    task_id: UUID


class AutoScheduleResponse(BaseModel):
    task_id: UUID
    best_slot: datetime
    score: float
    accepted: bool


class GenerateScheduleRequest(BaseModel):
    task_ids: list[str]
    filters: dict = {}
    allowed_days: list[str] = []
    ignored_event_ids: list[str] = []


class GeneratedBlock(BaseModel):
    task_id: str
    title: str
    start: str
    end: str
    score: float
