from pydantic import BaseModel
from typing import Optional

class TimerRequest(BaseModel):
    task_id: Optional[str] = None
    mode: str
    started_at: str
    ended_at: str
    elapsed_seconds: int
    active_seconds: int
    task_completed: bool