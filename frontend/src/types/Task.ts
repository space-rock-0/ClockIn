export type Task = {
    id?: string;
    color?: string;
    title: string;
    description: string;
    task_duration: number;
    importance: number;
    difficulty: number;
    due_date: string | null;
    can_schedule: boolean;
    status: "to do" | "scheduled" | "in progress" | "completed";

    // for modal usage
    _modalId?: number;

}