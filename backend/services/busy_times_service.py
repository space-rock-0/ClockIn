class BusyTimesService:
    def __init__(self, busy_times_repo):
        self.repo = busy_times_repo

    def get_all(self, user_id):
        return self.repo.get_all(user_id)

    def create(self, user_id, req):
        return self.repo.create(user_id, {
            "title":        req.title,
            "start_time":   req.start_time,
            "end_time":     req.end_time,
            "days_of_week": req.days_of_week,
            "source":       req.source or "manual",
        })

    def update(self, user_id, busy_time_id, req):
        return self.repo.update(user_id, busy_time_id, {
            "title":        req.title,
            "start_time":   req.start_time,
            "end_time":     req.end_time,
            "days_of_week": req.days_of_week,
            "source":       req.source or "manual",
        })

    def delete(self, user_id, busy_time_id):
        return self.repo.delete(user_id, busy_time_id)

    def replace_google_events(self, user_id, busy_times):
        self.repo.delete_by_source(user_id, "google")

        for bt in busy_times:
            self.repo.create(user_id, bt)


    def delete_google_events(self, user_id):
        self.repo.delete_by_source(user_id, "google")

    # def sync_google(user_id: str):
    #     # 1. fetch events from google
    #     events = google_client.get_events(user_id)
    #
    #     # 2. expand recurring events → list of instances
    #     expanded = expand_events(events)
    #
    #     # 3. upsert into busy_times table
    #     for e in expanded:
    #         repo.upsert_by_external_id(user_id, e)
    #
    #     # 4. delete stale events (optional but important)
    #     repo.delete_missing(user_id, external_ids)
    #
    #     return {"status": "ok"}
