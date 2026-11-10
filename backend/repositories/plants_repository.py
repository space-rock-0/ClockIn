from supabase import Client
from datetime import datetime, timezone
import uuid
import random

class PlantsRepository:
    def __init__(self, supabase):
        self.supabase = supabase

    def _generate_random_plant(self) -> str:
        """
        Generate random plant:
        - 50% Common: Sunflower, Tulip, Snake Plant
        - 50% Rare: Monstera, Bonsai, Cactus
        """
        common = ["sunflower", "tulip", "snake_plant"]
        rare = ["monstera", "bonsai", "cactus"]

        # Pick rarity (50/50)
        rarity = random.choice(["common", "rare"])

        # Pick from that rarity
        if rarity == "common":
            return random.choice(common)
        else:
            return random.choice(rare)

    def get_active_plant(self, user_id: str):
        result = (
            self.supabase.table("Plants")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def create_plant(self, user_id: str, stage: int = 1):
        result = (
            self.supabase.table("Plants")
            .insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "stage": stage,
                "progress_seconds": 0,
                "is_active": True,
                "variety": self._generate_random_plant(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            .execute()
        )
        return result.data[0]

    def advance_stage(self, plant_id: str, new_stage: int):
        result = (
            self.supabase.table("Plants")
            .update({"stage": new_stage})
            .eq("id", plant_id)
            .execute()
        )
        return result.data[0]

    def update_progress(self, plant_id: str, progress_seconds: int):
        result = (
            self.supabase.table("Plants")
            .update({"progress_seconds": progress_seconds})
            .eq("id", plant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def complete_plant(self, plant_id: str):
        result = (
            self.supabase.table("Plants")
            .update({
                "is_active": False,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("id", plant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_completed_plant_count(self, user_id: str) -> int:
        result = (
            self.supabase.table("Plants")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_active", False)
            .execute()
        )
        return len(result.data) if result.data else 0

    def get_completed_count_by_variety(self, user_id: str, variety: str) -> int:
        result = (
            self.supabase.table("Plants")
            .select("id")
            .eq("user_id", user_id)
            .eq("variety", variety)
            .eq("is_active", False)
            .execute()
        )
        return len(result.data) if result.data else 0

    def get_completed_counts_grouped(self, user_id: str):
        result = (
            self.supabase.table("Plants")
            .select("variety")
            .eq("user_id", user_id)
            .eq("is_active", False)
            .execute()
        )

        if not result.data:
            return []

        counts = {}
        for row in result.data:
            v = row["variety"]
            counts[v] = counts.get(v, 0) + 1

        return [
            {"variety": variety, "count": count}
            for variety, count in counts.items()
        ]

    def get_first_grown_dates(self, user_id: str) -> list[dict]:
        """Returns the earliest completed_at per variety for this user."""
        result = (
            self.supabase.table("Plants")
            .select("variety, completed_at")
            .eq("user_id", user_id)
            .eq("is_active", False)
            .not_.is_("completed_at", "null")
            .order("completed_at", desc=False)
            .execute()
        )

        if not result.data:
            return []

        # Keep only the first (oldest) completed_at per variety
        seen = {}
        for row in result.data:
            v = row["variety"]
            if v not in seen:
                seen[v] = row["completed_at"]

        return [{"variety": v, "first_grown": ts} for v, ts in seen.items()]