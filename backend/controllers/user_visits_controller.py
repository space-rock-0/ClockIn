from fastapi import APIRouter, Depends
from services.user_visits_service import UserVisitsService
from dependencies.auth import get_current_user
from constants.routes import USER_VISITS

router = APIRouter(prefix=USER_VISITS)

@router.get("")
async def get_user_visits(user=Depends(get_current_user)):
    print("controller called and connected, calling service")
    return await UserVisitsService.get_visits(user["id"])

@router.patch("/mark/{page}")
async def mark_page_visited(page: str, user=Depends(get_current_user)):
    return await UserVisitsService.mark_visited(user["id"], page)