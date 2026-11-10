class BusyTimesRepository:
    def __init__(self, supabase):
        self.supabase = supabase

    def get_all(self, user_id):
        result = (
            self.supabase
            .table("BusyTimes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .execute()
        )
        return result.data

    def create(self, user_id, data: dict):
        result = (
            self.supabase
            .table("BusyTimes")
            .insert({"user_id": user_id, **data})
            .execute()
        )
        if not result.data:
            print(f"[BusyTimesRepo] Insert returned no data for: {data.get('title')} — possible RLS or constraint violation")
            return None
        return result.data[0]

    def update(self, user_id, busy_time_id: str, data: dict):
        result = (
            self.supabase
            .table("BusyTimes")
            .update(data)
            .eq("id", busy_time_id)
            .eq("user_id", user_id)   # safety: can't edit another user's record
            .execute()
        )
        return result.data[0]

    def delete(self, user_id, busy_time_id: str):
        result = (
            self.supabase
            .table("BusyTimes")
            .delete()
            .eq("id", busy_time_id)
            .eq("user_id", user_id)   # safety: can't delete another user's record
            .execute()
        )
        return { "deleted_id": busy_time_id }

    def delete_by_source(self, user_id: str, source: str):
        self.supabase.table("BusyTimes").delete().eq("user_id", user_id).eq("source", source).execute()
