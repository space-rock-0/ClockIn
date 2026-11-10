from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from dependencies.auth import get_current_user
from datetime import datetime, timezone
from typing import List

from pydantic import BaseModel
from models.schedule_model import SlotScoreRequest, SlotScoreResponse, BehaviorEventRequest, ScheduleRequest, ScheduleResponse, AutoScheduleRequest, AutoScheduleResponse, GenerateScheduleRequest
from services.schedule_service import ScheduleService
from repositories.calendar_repository import CalendarRepository


class InitWeightsRequest(BaseModel):
    priority_style: str  # "important_first" | "urgent_first" | "balanced"
    time_preferences: List[str]  # ["morning", "afternoon", "evening", "night"]

def require_schedule_owner(user_id: UUID, user=Depends(get_current_user)):
    if str(user_id) != user["id"]:
        raise HTTPException(status_code=403, detail="Cannot access another user's schedule")


router = APIRouter(prefix="/api/schedule", tags=["schedule"], dependencies=[Depends(require_schedule_owner)])

schedule_service = ScheduleService()
task_repo = CalendarRepository()


def require_owned_task(task_id: UUID, user_id: UUID):
    task = task_repo.get_task_by_id(task_id)
    if task is None or str(task.user_id) != str(user_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/score", response_model=SlotScoreResponse)
def score_slot(body: SlotScoreRequest, user_id: UUID):
    task = require_owned_task(body.task_id, user_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task_dict = {
        "priority": task.priority,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "task_duration": task.task_duration,
    }

    score = schedule_service.score_slot(task_dict, body.proposed_start, user_id)
    accepted = score >= 0.5

    return SlotScoreResponse(
        task_id=body.task_id,
        proposed_start=body.proposed_start,
        score=score,
        accepted=accepted,
    )


@router.post("/accept")
async def accept_slot(body: ScheduleRequest, user_id: UUID):
    require_owned_task(body.task_id, user_id)
    print(f"[ACCEPT] task_id={body.task_id} start={body.scheduled_start}")
    rejected_slot = schedule_service.get_last_rejected_slot(user_id, body.task_id)
    print(f"[ACCEPT] rejected_slot={rejected_slot}")

    result = schedule_service.accept_slot(
        user_id=user_id,
        task_id=body.task_id,
        proposed_start=body.scheduled_start,
        scheduled_end=body.scheduled_end,
    )

    if rejected_slot is not None:
        print(f"[PIPELINE] firing OpenAI → FeatureValidator → perceptron for task {body.task_id}")
        try:
            await schedule_service.process_slot_correction(
                user_id, body.task_id, rejected_slot, body.scheduled_start
            )
            print(f"[PIPELINE] done")
        except Exception as e:
            print(f"[PIPELINE] error: {e}")

    return result


@router.post("/reject")
def reject_slot(body: BehaviorEventRequest, user_id: UUID):
    require_owned_task(body.task_id, user_id)
    print(f"[REJECT] task_id={body.task_id} slot={body.slot_offered}")
    schedule_service.reject_slot(
        user_id=user_id,
        task_id=body.task_id,
        proposed_start=body.slot_offered,
    )
    return {"message": "slot rejected, logged"}


@router.post("/auto", response_model=AutoScheduleResponse)
def auto_schedule(body: AutoScheduleRequest, user_id: UUID):
    task = require_owned_task(body.task_id, user_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task_dict = {
        "priority": task.priority,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "task_duration": task.task_duration,
    }

    try:
        result = schedule_service.find_best_slot(task_dict, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return AutoScheduleResponse(
        task_id=body.task_id,
        best_slot=result["best_slot"],
        score=result["score"],
        accepted=result["accepted"],
    )


@router.post("/generate")
def generate_schedule(body: GenerateScheduleRequest, user_id: UUID):
    if not body.task_ids:
        raise HTTPException(status_code=400, detail="No tasks selected")
    for task_id in body.task_ids:
        try:
            parsed_id = UUID(task_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid task ID")
        require_owned_task(parsed_id, user_id)
    try:
        result = schedule_service.build_schedule(str(user_id), body.task_ids, body.filters, body.allowed_days, body.ignored_event_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result  # {"scheduled": [...], "skipped": [...]}


@router.post("/confirm")
def confirm_schedule(body: list[ScheduleRequest], user_id: UUID):
    """Clear the user's existing schedule and persist the confirmed set of blocks."""
    for block in body:
        require_owned_task(block.task_id, user_id)
    schedule_service.repo.clear_schedules_for_user(user_id)
    for block in body:
        schedule_service.repo.save_schedule(user_id, block.task_id, block.scheduled_start, block.scheduled_end)
    return {"message": "schedule confirmed", "count": len(body)}


@router.get("/user/{user_id}")
def get_schedule(user_id: UUID):
    return schedule_service.get_schedule(user_id)


@router.post("/init-weights")
def init_weights_from_survey(body: InitWeightsRequest, user_id: UUID):
    """
    Set initial perceptron weights from onboarding survey answers.
    Called once after a new user completes the onboarding survey.
    """
    if body.priority_style == "important_first":
        priority, urgency = 0.55, 0.25
    elif body.priority_style == "urgent_first":
        priority, urgency = 0.25, 0.55
    else:
        priority, urgency = 0.40, 0.40

    # Strong time preference → give duration_fit more influence
    has_strong_time_pref = 0 < len(body.time_preferences) <= 2
    duration_fit = 0.30 if has_strong_time_pref else 0.20

    total = priority + urgency + duration_fit
    weights = {
        "priority": round(priority / total, 4),
        "urgency": round(urgency / total, 4),
        "duration_fit": round(duration_fit / total, 4),
    }

    schedule_service.repo.save_perceptron_weights(user_id, weights)
    return {"message": "weights initialized", "weights": weights}
