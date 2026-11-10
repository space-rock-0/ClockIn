from repositories.plants_repository import PlantsRepository

# Place where all plants have their max stages defined
PLANT_CONFIG = {
    "sunflower": {"max_stage": 5},
    "tulip": {"max_stage": 5},
    "snake_plant": {"max_stage": 4},
    "monstera": {"max_stage": 5},
    "bonsai": {"max_stage": 6},
    "cactus": {"max_stage": 6},
}

# Edit this back to 30/60 later
SECONDS_PER_STAGE = 30  


class PlantsService:
    def __init__(self, repo: PlantsRepository):
        self.repo = repo

    async def get_active_plant(self, user_id: str):
        plant = self.repo.get_active_plant(user_id)
        if not plant:
            plant = self.repo.create_plant(user_id)
        return plant

    async def grow_plant(self, user_id: str, active_seconds: int):
        plant = self.repo.get_active_plant(user_id)
        if not plant:
            plant = self.repo.create_plant(user_id)

        total = plant["progress_seconds"] + active_seconds
        stages_completed = total // SECONDS_PER_STAGE
        new_progress = total % SECONDS_PER_STAGE

        plants_earned = []

        for _ in range(stages_completed):
            variety = plant["variety"]
            max_stage = PLANT_CONFIG[variety]["max_stage"]

            next_stage = plant["stage"] + 1

            if next_stage > max_stage:
                # ✅ check if new BEFORE completing
                existing_count = self.repo.get_completed_count_by_variety(user_id, variety)
                is_new = existing_count == 0

                self.repo.complete_plant(plant["id"])

                plants_earned.append({
                    "variety": variety,
                    "is_new": is_new
                })

                plant = self.repo.create_plant(user_id)

            else:
                plant = self.repo.advance_stage(plant["id"], next_stage)

        self.repo.update_progress(plant["id"], new_progress)

        return {
            "plants_earned": plants_earned,
            "plants_earned_count": len(plants_earned),
            "progress": new_progress,
            "stage": plant["stage"],
            "variety": plant["variety"],
        }

    async def get_completed_counts(self, user_id: str):
        return self.repo.get_completed_counts_grouped(user_id)

    async def get_first_grown_dates(self, user_id: str):
        return self.repo.get_first_grown_dates(user_id)