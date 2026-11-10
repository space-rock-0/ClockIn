import type {ScheduleBlock} from "./ScheduleBlock";

export type Schedule = {
    id: string;
    name: string;
    date: string;
    blocks: ScheduleBlock[];
    skipped?: string[];  // titles of tasks that couldn't be scheduled
};