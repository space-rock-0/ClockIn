from pydantic import BaseModel
from typing import Optional

class BusyTimeRequest(BaseModel):
    title: str
    start_time: Optional[str] = None   # ISO string e.g. "1970-01-01T18:00:00.000Z"
    end_time: Optional[str] = None
    days_of_week: list[str] = []       # ["MON", "WED", "FRI"]
    source: Optional[str] = "manual"
