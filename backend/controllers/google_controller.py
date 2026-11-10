from fastapi import APIRouter, Depends, HTTPException
from constants.routes import GOOGLE
from dependencies.auth import get_current_user
from dependencies.dependencies import google_service
from fastapi.responses import RedirectResponse
import os

router = APIRouter(prefix=GOOGLE)


@router.get("/login")
def google_login(user=Depends(get_current_user)):
    try:
        url = google_service.get_auth_url(user["id"])["url"]
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"url": url}


@router.get("/callback")
def google_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if error:
        return RedirectResponse(f"{frontend_url}/availability?google=denied")
    if not code or not state:
        return RedirectResponse(f"{frontend_url}/availability?google=error")
    try:
        google_service.handle_callback(code, state)
        return RedirectResponse(f"{frontend_url}/availability?google=connected")
    except Exception as exc:
        if "GoogleTokens" in str(exc):
            return RedirectResponse(f"{frontend_url}/availability?google=storage")
        if "redirect_uri" in str(exc).lower():
            return RedirectResponse(f"{frontend_url}/availability?google=redirect")
        return RedirectResponse(f"{frontend_url}/availability?google=error")


@router.post("/sync")
def sync_google(user=Depends(get_current_user)):
    return google_service.sync_calendar(user["id"])


@router.post("/disconnect")
def disconnect_google(user=Depends(get_current_user)):
    return google_service.disconnect(user["id"])


@router.get("/status")
def google_status(user=Depends(get_current_user)):
    try:
        return google_service.get_status(user["id"])
    except Exception as exc:
        if "GoogleTokens" in str(exc):
            raise HTTPException(
                status_code=503,
                detail="Google Calendar storage is not configured. Run backend/database/google_calendar_schema.sql in Supabase SQL Editor.",
            )
        raise HTTPException(status_code=502, detail="Unable to read Google Calendar connection status.")
