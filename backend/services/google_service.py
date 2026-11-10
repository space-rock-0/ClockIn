from datetime import datetime, timedelta


class GoogleService:
    def __init__(self, google_repo, busy_times_service):
        self.repo = google_repo
        self.busy_times_service = busy_times_service

    def get_auth_url(self, user_id):
        return self.repo.get_auth_url(user_id)

    def handle_callback(self, code, user_id):
        user_id = self.repo.verify_oauth_state(user_id)
        tokens = self.repo.exchange_code_for_tokens(code)
        self.repo.store_tokens(user_id, tokens)
        self.sync_calendar(user_id)  # auto-sync on connect
        return {"status": "connected"}

    def get_status(self, user_id):
        tokens = self.repo.get_tokens(user_id)
        return {"connected": tokens is not None}

    def disconnect(self, user_id):
        self.repo.delete_tokens(user_id)
        self.busy_times_service.delete_google_events(user_id)
        return {"status": "disconnected"}

    def sync_calendar(self, user_id):
        tokens = self.repo.get_tokens(user_id)
        if not tokens:
            return {"error": "not connected"}

        events = self.repo.fetch_events(tokens)
        print(f"[GoogleSync] Converted event for user {user_id}")
        busy_times = []

        for e in events:
            start = e.get("start", {}).get("dateTime") or e.get("start", {}).get("date")
            end = e.get("end", {}).get("dateTime") or e.get("end", {}).get("date")
            if not start or not end:
                print(f"[GoogleSync] Skipping event with no start/end: {e.get('summary')}")
                continue
            try:
                is_all_day = len(start) <= 10
                bt = {
                    "title": e.get("summary", "Busy"),
                    "start_time": self._format_time(start),
                    "end_time": self._format_time(end, is_exclusive_end=is_all_day),
                    "days_of_week": self._get_days(start, end),
                    "source": "google",
                }
                busy_times.append(bt)
                print(f"[GoogleSync] Converted event for user {user_id}")
            except Exception as ex:
                print(f"[GoogleSync] Error converting event '{e.get('summary')}': {ex}")

        print(f"[GoogleSync] Saving {len(busy_times)} busy times to DB")
        self.busy_times_service.replace_google_events(user_id, busy_times)
        return {"status": "synced", "count": len(busy_times)}

    def _get_days(self, start_iso: str, end_iso: str) -> list[str]:
        is_all_day = len(start_iso) <= 10  # date-only strings like "2026-04-23"
        start = datetime.fromisoformat(start_iso)
        end = datetime.fromisoformat(end_iso)
        # Google all-day events use an exclusive end date (next day midnight),
        # so subtract one day to get the actual last day of the event.
        end_date = (end - timedelta(days=1)).date() if is_all_day else end.date()
        days = []
        current = start
        while current.date() <= end_date:
            days.append(current.strftime("%a").upper()[:3])
            current += timedelta(days=1)
        return list(dict.fromkeys(days))  # deduplicate, preserve order

    def _format_time(self, iso_string: str, is_exclusive_end: bool = False) -> str:
        if len(iso_string) <= 10:  # date-only (all-day event)
            return "23:59:00" if is_exclusive_end else "00:00:00"
        dt = datetime.fromisoformat(iso_string)
        return dt.strftime("%H:%M:%S")
