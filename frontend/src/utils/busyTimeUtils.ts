import type { TimeValue } from "../types/BusyTime";

export function formatTime(t: TimeValue): string {
    return `${t.hour}:${t.minute} ${t.ampm}`;
}

export function timeValueToISO(t: TimeValue): string {
    let h = parseInt(t.hour);
    if (t.ampm === "PM" && h !== 12) h += 12;
    if (t.ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${t.minute}:00`;
}

export function isoToTimeValue(iso: string): TimeValue {
    const timePart = iso.includes("T") ? iso.split("T")[1] : iso;
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr);
    const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return {
        hour: h.toString(),
        minute: mStr,
        ampm,
    };
}
