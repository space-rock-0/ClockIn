from fastapi import APIRouter, HTTPException, Depends
from database.supabase_client import supabase
from models.auth_model import LoginRequest, SignupRequest, AuthResponse
from dependencies.auth import get_current_user

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        return AuthResponse(
            access_token=res.session.access_token,
            user_id=res.user.id,
            email=res.user.email
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/signup")
def signup(payload: SignupRequest):
    try:
        supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {"data": {"username": payload.username}}
        })
        return {"message": "Account created! Check your email to confirm."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/account")
def delete_account(user=Depends(get_current_user)):
    user_id = user["id"]

    # Delete all user data across every table
    user_tables = [
        "Tasks", "schedules", "StickyNotes", "Plants",
        "BusyTimes", "GoogleTokens", "perceptron_weights",
        "user_behavior_events", "latent_key_stats",
        "user_visits", "TimerSession",
    ]
    for table in user_tables:
        try:
            supabase.table(table).delete().eq("user_id", user_id).execute()
        except Exception as e:
            print(f"[DeleteAccount] Could not delete from {table}: {e}")

    # Delete the auth account using service-role access
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete auth account: {e}")

    return {"message": "Account deleted"}
