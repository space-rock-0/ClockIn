from fastapi import APIRouter, Depends
from constants.routes import TIMER
from dependencies.auth import get_current_user
from dependencies.dependencies import timer_service, openai_service
from models.timer_model import TimerRequest
from pydantic import BaseModel

class WorkflowRequest(BaseModel):
    title: str
    description: str = ""

router = APIRouter(prefix=TIMER)

@router.post("")
def create_timer_session(req: TimerRequest, user=Depends(get_current_user)):
    session = timer_service.create_session(user["id"], req.dict())
    return {
        "message": "Timer session received",
        "user_id": user["id"],
        "data": session
    }

@router.post("/workflow")
async def generate_workflow(req: WorkflowRequest, user=Depends(get_current_user)):
    result = await openai_service.generate_workflow(req.title, req.description)
    return result