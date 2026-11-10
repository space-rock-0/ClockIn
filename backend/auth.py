from __future__ import annotations

import os
import jwt
from fastapi import Header, HTTPException
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


def get_current_user_id(authorization: str = Header(...)) -> str:
    """Extract and verify the Supabase JWT token, return the user's ID."""
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
