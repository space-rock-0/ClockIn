export interface TimeValue {
    hour: string;
    minute: string;
    ampm: "AM" | "PM";
}

export interface BusyTimeData {
    id?: number;
    title: string;
    start: TimeValue;
    end: TimeValue;
    days: string[];
}
