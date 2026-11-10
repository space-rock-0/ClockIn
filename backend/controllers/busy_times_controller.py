from fastapi import APIRouter, Depends
from constants.routes import BUSY_TIMES
from dependencies.auth import get_current_user
from dependencies.dependencies import busy_times_service
from models.busy_times_model import BusyTimeRequest

router = APIRouter(prefix=BUSY_TIMES)

@router.get("")
def get_busy_times(user=Depends(get_current_user)):
    return busy_times_service.get_all(user["id"])

@router.post("")
def create_busy_time(req: BusyTimeRequest, user=Depends(get_current_user)):
    return busy_times_service.create(user["id"], req)

@router.put("/{busy_time_id}")
def update_busy_time(busy_time_id: str, req: BusyTimeRequest, user=Depends(get_current_user)):
    return busy_times_service.update(user["id"], busy_time_id, req)

@router.delete("/{busy_time_id}")
def delete_busy_time(busy_time_id: str, user=Depends(get_current_user)):
    return busy_times_service.delete(user["id"], busy_time_id)

@router.post("/sync/google")
def sync_google_calendar(user=Depends(get_current_user)):
    return busy_times_service.sync_google(user["id"])
