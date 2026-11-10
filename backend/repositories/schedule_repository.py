from datetime import datetime
from uuid import UUID
from database.supabase_client import supabase


class ScheduleRepository:

    def log_behavior_event(self, user_id: UUID, task_id: UUID, slot_offered: datetime, action: str):
        supabase.table("user_behavior_events").insert({
            "user_id": str(user_id),
            "task_id": str(task_id),
            "slot_offered": slot_offered.isoformat(),
            "action": action,
        }).execute()

    def log_behavior_event_with_features(
        self,
        user_id: UUID,
        task_id: UUID,
        slot_offered: datetime,
        action: str,
        features: list[float],
        latent_vars: dict,
    ):
        """
        Logs a behavior event with pre-computed features and OpenAI-inferred
        latent variables.  features = [priority_norm, urgency_norm, duration_fit].
        latent_vars is stored as JSONB (nullable columns filled dynamically).
        """
        import json
        supabase.table("user_behavior_events").insert({
            "user_id":      str(user_id),
            "task_id":      str(task_id),
            "slot_offered": slot_offered.isoformat(),
            "action":       action,
            "priority_norm":  features[0] if len(features) > 0 else None,
            "urgency_norm":   features[1] if len(features) > 1 else None,
            "duration_fit":   features[2] if len(features) > 2 else None,
            "latent_features": json.dumps({k: v for k, v in latent_vars.items() if v is not None}),
        }).execute()

    def get_behavior_events(self, user_id: UUID) -> list[dict]:
        response = (
            supabase.table("user_behavior_events")
            .select("*")
            .eq("user_id", str(user_id))
            .execute()
        )
        return response.data

    def save_schedule(self, user_id: UUID, task_id: UUID, start: datetime, end: datetime) -> dict:
        response = supabase.table("schedules").insert({
            "user_id": str(user_id),
            "task_id": str(task_id),
            "scheduled_start": start.isoformat(),
            "scheduled_end": end.isoformat(),
        }).execute()
        return response.data[0]

    def clear_schedules_for_user(self, user_id: UUID) -> None:
        supabase.table("schedules").delete().eq("user_id", str(user_id)).execute()

    def get_schedules_for_user(self, user_id: UUID) -> list[dict]:
        response = (
            supabase.table("schedules")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .execute()
        )
        # Deduplicate by task_id — keep only the most recent row per task
        seen: set[str] = set()
        unique: list[dict] = []
        for row in response.data:
            tid = row.get("task_id")
            if tid not in seen:
                seen.add(tid)
                unique.append(row)
        rows = unique
        # Enrich with task titles via a single batch lookup
        task_ids = list({r["task_id"] for r in rows if r.get("task_id")})
        if task_ids:
            tasks_resp = (
                supabase.table("Tasks")
                .select("id, title, description")
                .in_("id", task_ids)
                .execute()
            )
            task_map = {t["id"]: t for t in tasks_resp.data}
            for row in rows:
                task = task_map.get(row["task_id"], {})
                row["title"] = task.get("title", "")
                row["description"] = task.get("description")
        return rows

    def get_behavior_events_ordered(self, user_id: UUID) -> list[dict]:
        response = (
            supabase.table("user_behavior_events")
            .select("*")
            .eq("user_id", str(user_id))
            .order("slot_offered", desc=False)
            .execute()
        )
        return response.data

    def get_perceptron_weights(self, user_id: UUID) -> dict | None:
        response = (
            supabase.table("perceptron_weights")
            .select("*")
            .eq("user_id", str(user_id))
            .execute()
        )
        if not response.data:
            return None
        row = response.data[0]
        return {
            "priority": row["priority"],
            "urgency": row["urgency"],
            "duration_fit": row["duration_fit"],
        }

    def save_perceptron_weights(self, user_id: UUID, weights: dict) -> None:
        # Only persist the 3 base features — promoted feature weights are cached in-memory
        # on ScheduleService._promoted_weights (keyed by user_id).
        import json
        base = {
            "priority": weights.get("priority", 0.4),
            "urgency": weights.get("urgency", 0.4),
            "duration_fit": weights.get("duration_fit", 0.2),
        }
        supabase.table("perceptron_weights").upsert({
            "user_id": str(user_id),
            "weights": json.dumps(base),   # legacy not-null JSONB column
            "priority": base["priority"],
            "urgency": base["urgency"],
            "duration_fit": base["duration_fit"],
            "updated_at": datetime.utcnow().isoformat(),
        }, on_conflict="user_id").execute()

    # ── Latent feature discovery ──────────────────────────────────────────────

    def increment_latent_key_count(self, key: str) -> None:
        """Atomically increment the seen-count for a latent key via RPC."""
        supabase.rpc("increment_latent_key", {"key_name": key}).execute()

    def get_promotable_latent_keys(self, threshold: int) -> list[str]:
        """Return keys that have been seen ≥ threshold times and not yet promoted."""
        response = (
            supabase.table("latent_key_stats")
            .select("key")
            .gte("count", threshold)
            .eq("promoted", False)
            .execute()
        )
        return [row["key"] for row in response.data]

    def promote_latent_column(self, key: str) -> None:
        """
        Promote a latent key to a real float column on user_behavior_events.
        Backfills existing JSONB data and marks the key as promoted.
        Executes via a SECURITY DEFINER Postgres function (see feature_discovery_service.py
        for the required SQL setup).
        """
        supabase.rpc("promote_latent_column", {"col_name": key}).execute()

    def get_promoted_keys(self) -> list[str]:
        """Return all latent keys that have been promoted to real columns."""
        try:
            response = (
                supabase.table("latent_key_stats")
                .select("key")
                .eq("promoted", True)
                .execute()
            )
            return [row["key"] for row in response.data]
        except Exception:
            return []

    def get_active_user_ids(self) -> list[str]:
        """Returns user IDs that have at least one behavior event."""
        response = (
            supabase.table("user_behavior_events")
            .select("user_id")
            .execute()
        )
        seen = set()
        result = []
        for row in response.data:
            uid = row["user_id"]
            if uid not in seen:
                seen.add(uid)
                result.append(uid)
        return result
