from datetime import datetime, timedelta


class StatsService:
    def __init__(self, timer_repo, plants_repo):
        self.timer_repo = timer_repo
        self.plants_repo = plants_repo

    def get_stats(self, user_id):
        sessions = self.timer_repo.get_sessions(user_id)

        if not sessions:
            return {
                "total_hours": 0,
                "plants_grown": 0,
                "day_streak": 0
            }

        # -------------------------
        # 1. TOTAL HOURS
        # -------------------------
        total_seconds = sum(s.get("active_seconds", 0) for s in sessions)
        total_hours = round(total_seconds / 3600, 1)

        # -------------------------
        # 2. PLANTS GROWN
        # -------------------------
        plants_grown = self.plants_repo.get_completed_plant_count(user_id)

        # -------------------------
        # 3. DAY STREAK
        # -------------------------
        # get unique days
        days = set()

        for s in sessions:
            started = s.get("started_at")
            if started:
                day = datetime.fromisoformat(started).date()
                days.add(day)

        if not days:
            return {
                "total_hours": total_hours,
                "plants_grown": plants_grown,
                "day_streak": 0
            }

        # sort descending
        sorted_days = sorted(days, reverse=True)

        streak = 0
        current_day = datetime.now().date()

        for day in sorted_days:
            if day == current_day:
                streak += 1
                current_day = current_day - timedelta(days=1)
            elif day == current_day - timedelta(days=1):
                streak += 1
                current_day = current_day - timedelta(days=1)
            else:
                break

        return {
            "total_hours": total_hours,
            "plants_grown": plants_grown,
            "day_streak": streak
        }