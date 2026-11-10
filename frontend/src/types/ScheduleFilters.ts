export type Preference = "asc" | "none" | "desc";

export type ScheduleFilters = {
    deadline: Preference;
    importance: Preference;
    value: Preference;
    time: Preference;
    subject: Preference;
    difficulty?: Preference;
    allowed_days?: string[];
};