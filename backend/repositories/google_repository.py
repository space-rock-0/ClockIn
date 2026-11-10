import requests
from datetime import datetime, timedelta
import os
import base64
import binascii
import hashlib
import hmac
import json
import time
from urllib.parse import quote, urlencode
from dotenv import load_dotenv
from urllib.parse import quote

load_dotenv()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_STATE_SECRET = os.getenv("GOOGLE_STATE_SECRET") or os.getenv("SUPABASE_SECRET_KEY")


class GoogleRepository:
    def __init__(self, supabase):
        self.supabase = supabase

    def get_auth_url(self, user_id: str) -> dict[str, str]:
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
            raise RuntimeError("Google Calendar is not configured on the backend.")
        if not GOOGLE_STATE_SECRET:
            raise RuntimeError("Google OAuth state signing is not configured on the backend.")
        state_payload = base64.urlsafe_b64encode(json.dumps({
            "user_id": user_id,
            "expires_at": int(time.time()) + 600,
        }, separators=(",", ":")).encode()).decode().rstrip("=")
        state_signature = hmac.new(
            GOOGLE_STATE_SECRET.encode(), state_payload.encode(), hashlib.sha256
        ).hexdigest()
        return {
            "url": "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
                "client_id": GOOGLE_CLIENT_ID, "redirect_uri": GOOGLE_REDIRECT_URI,
                "response_type": "code", "scope": "https://www.googleapis.com/auth/calendar.readonly",
                "access_type": "offline", "prompt": "consent",
                "state": f"{state_payload}.{state_signature}",
            })
        }

    def verify_oauth_state(self, state: str) -> str:
        if not GOOGLE_STATE_SECRET:
            raise RuntimeError("Google OAuth state signing is not configured on the backend.")
        try:
            state_payload, state_signature = state.rsplit(".", 1)
            expected_signature = hmac.new(
                GOOGLE_STATE_SECRET.encode(), state_payload.encode(), hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(state_signature, expected_signature):
                raise ValueError("Invalid OAuth state signature")
            padded = state_payload + "=" * (-len(state_payload) % 4)
            data = json.loads(base64.urlsafe_b64decode(padded).decode())
            if int(data["expires_at"]) < int(time.time()):
                raise ValueError("Expired OAuth state")
            user_id = str(data["user_id"])
            if not user_id:
                raise ValueError("Missing OAuth user")
            return user_id
        except (ValueError, KeyError, TypeError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error) as exc:
            raise RuntimeError("Invalid or expired Google OAuth state.") from exc

    def exchange_code_for_tokens(self, code: str) -> dict[str, object]:
        res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        res.raise_for_status()
        return res.json()

    def _refresh_access_token(self, user_id: str, refresh_token: str) -> str:
        """Exchange refresh token for a new access token and persist it."""
        res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        res.raise_for_status()
        new_tokens = res.json()
        expires_at = datetime.utcnow() + timedelta(seconds=new_tokens["expires_in"])
        self.supabase.table("GoogleTokens").update({
            "access_token": new_tokens["access_token"],
            "expires_at": expires_at.isoformat(),
        }).eq("user_id", user_id).execute()
        return new_tokens["access_token"]

    def _get_valid_access_token(self, tokens: dict[str, object]) -> str:
        expires_at = datetime.fromisoformat(tokens["expires_at"]).replace(tzinfo=None)
        if datetime.utcnow() >= expires_at - timedelta(minutes=5):
            return self._refresh_access_token(tokens["user_id"], tokens["refresh_token"])
        return tokens["access_token"]

    def store_tokens(self, user_id: str, tokens: dict[str, object]) -> None:
        refresh_token = tokens.get("refresh_token")
        if not refresh_token:
            existing = self.get_tokens(user_id)
            refresh_token = existing.get("refresh_token") if existing else None
        self.supabase.table("GoogleTokens").upsert({
            "user_id": user_id,
            "access_token": tokens["access_token"],
            "refresh_token": refresh_token,
            "expires_at": (
                    datetime.utcnow() + timedelta(seconds=tokens["expires_in"])
            ).isoformat(),
        }).execute()

    def get_tokens(self, user_id: str) -> dict[str, object] | None:
        res = self.supabase.table("GoogleTokens").select("*").eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    def delete_tokens(self, user_id: str) -> None:
        self.supabase.table("GoogleTokens").delete().eq("user_id", user_id).execute()

    def _fetch_calendar_ids(self, access_token: str) -> list[str]:
        """Return IDs of all calendars the user has access to."""
        res = requests.get(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        res.raise_for_status()
        return [cal["id"] for cal in res.json().get("items", [])]

    def _fetch_events_for_calendar(self, access_token: str, calendar_id: str) -> list[dict]:
        time_min = datetime.utcnow().isoformat() + "Z"
        time_max = (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
        res = requests.get(
            f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": True,
                "orderBy": "startTime",
                "maxResults": 250,
            },
        )
        if not res.ok:
            return []  # skip calendars we can't read (e.g. holidays, other people's)
        return [e for e in res.json().get("items", []) if e.get("status") != "cancelled"]

    def fetch_events(self, tokens: dict[str, object]) -> list[dict]:
        access_token = self._get_valid_access_token(tokens)
        calendar_ids = self._fetch_calendar_ids(access_token)

        all_events = []
        seen_ids = set()
        for cal_id in calendar_ids:
            for event in self._fetch_events_for_calendar(access_token, cal_id):
                event_id = event.get("id")
                if event_id and event_id not in seen_ids:
                    seen_ids.add(event_id)
                    all_events.append(event)

        return all_events
