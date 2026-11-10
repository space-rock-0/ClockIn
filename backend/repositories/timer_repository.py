class TimerRepository:
    def __init__(self, supabase):
        self.supabase = supabase

    def create_session(self, data: dict):
        result = (
            self.supabase
            .table("TimerSession")
            .insert(data)
            .execute()
        )

        return result.data[0]

    def get_sessions(self, user_id):
        result = (self.supabase
            .table("TimerSession")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data
