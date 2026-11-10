export type ScheduleBlock = {
    id: string;
    title: string;
    description?: string;

    date: string;   // "YYYY-MM-DD"
    start: string;  // "HH:MM"
    end: string;    // "HH:MM"

    duration?: number;
    task_id?: string;
    color?: string;
    isCalendarEvent?: boolean;  // Google Calendar events — non-draggable, shown on grid
    isIgnored?: boolean;        // greyed out — excluded from scheduling but still visible
};
