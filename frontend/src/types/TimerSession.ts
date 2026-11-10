export type TimerSession = {
    task_id?: string;
    mode: "task" | "free";
    started_at: string;   // ISO string
    ended_at: string;     // ISO string
    elapsed_seconds: number;
    active_seconds: number;
    task_completed: boolean;
};
