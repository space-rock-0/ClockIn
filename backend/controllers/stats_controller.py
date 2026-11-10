# routes/stats.py

from fastapi import APIRouter, Depends
from dependencies.auth import get_current_user
from dependencies.dependencies import stats_service
from constants.routes import STATS


router = APIRouter(prefix=STATS)

@router.get("")
def get_stats(user=Depends(get_current_user)):
    return stats_service.get_stats(user["id"])