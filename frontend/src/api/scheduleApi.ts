import { API_ROUTES } from "../constants/apiRoutes";
import type { ScheduleFilters } from "../types/ScheduleFilters";
import type { Schedule } from "../types/Schedule";
import type { ScheduleBlock } from "../types/ScheduleBlock";
import { authFetch } from "./authFetch";

// ─── Raw API shapes ───────────────────────────────────────────────────────────

/** Block as it arrives from the backend, before normalisation */
interface RawBlock {
    id?: string;
    task_id?: string;
    title?: string;
    description?: string;
    /** Present on freshly-generated blocks */
    start?: string;
    end?: string;
    /** Present on blocks loaded from the DB */
    scheduled_start?: string;
    scheduled_end?: string;
    color?: string;
}

/** Shape returned by /generate when the backend returns the new { scheduled, skipped } envelope */
interface RawGenerateResponse {
    scheduled: RawBlock[];
    skipped?: Array<{ title?: string }>;
}

/** Shape returned when the backend wraps blocks in an object */
interface RawBlocksWrapper {
    blocks: RawBlock[];
}

// ─── Type guards ──────────────────────────────────────────────────────────────

function isRawBlockArray(v: unknown): v is RawBlock[] {
    return Array.isArray(v);
}

function isRawGenerateResponse(v: unknown): v is RawGenerateResponse {
    return typeof v === "object" && v !== null && "scheduled" in v;
}

function isRawBlocksWrapper(v: unknown): v is RawBlocksWrapper {
    return typeof v === "object" && v !== null && "blocks" in v;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/** Strip timezone suffix so the browser treats the value as local wall-clock time.
 *  The backend stores naive local datetimes; Supabase re-adds +00:00 on read,
 *  which would shift the displayed time by the user's UTC offset. */
function stripTZ(s: string): string {
    return s.replace(/([+-]\d{2}:\d{2}|Z)$/, "");
}

function parseBlock(raw: RawBlock): ScheduleBlock {
    // Backend returns either "start"/"end" (generate) or "scheduled_start"/"scheduled_end" (load)
    const start = new Date(stripTZ(raw.start ?? raw.scheduled_start ?? ""));
    const end   = new Date(stripTZ(raw.end   ?? raw.scheduled_end   ?? ""));
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    return {
        // Prefer the schedule-row UUID so blocks are always unique, even if the
        // same task appears twice due to old duplicate DB rows.
        id: raw.id ?? raw.task_id ?? crypto.randomUUID(),
        title: raw.title ?? "",
        description: raw.description ?? undefined,
        date,
        start: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        end: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        task_id: raw.task_id,
        color: raw.color,
    };
}

function wrapBlocks(rawBlocks: RawBlock[]): Schedule {
    const blocks = rawBlocks.map(parseBlock);
    return {
        id: crypto.randomUUID(),
        name: "Generated Schedule",
        date: blocks[0]?.date ?? new Date().toISOString().slice(0, 10),
        blocks,
    };
}

// ─── Shared response normaliser ───────────────────────────────────────────────

/** Handles all three response shapes the schedule endpoints can return */
function normaliseScheduleResponse(data: unknown): Schedule {
    if (isRawBlockArray(data)) return wrapBlocks(data);
    if (isRawBlocksWrapper(data)) {
        return { ...(data as unknown as Schedule), blocks: data.blocks.map(parseBlock) };
    }
    // Already a full Schedule object
    return data as Schedule;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getSchedule(userId?: string): Promise<Schedule> {
    const url = userId
        ? `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/user/${userId}`
        : `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error("Failed to fetch schedule");
    const data: unknown = await res.json();
    return normaliseScheduleResponse(data);
}

export async function generateSchedule(
    taskIds: string[],
    filters: ScheduleFilters,
    userId?: string,
    ignoredEventIds: string[] = []
): Promise<Schedule> {
    const url = userId
        ? `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/generate?user_id=${userId}`
        : `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/generate`;
    const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            task_ids: taskIds,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            filters: (({ allowed_days: _days, ...rest }) => rest)(filters),
            allowed_days: filters.allowed_days ?? [],
            ignored_event_ids: ignoredEventIds,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("❌ BACKEND ERROR:", text);
        throw new Error("Failed to generate schedule");
    }

    const data: unknown = await res.json();

    // New envelope shape: { scheduled: [...], skipped: [...] }
    if (isRawGenerateResponse(data)) {
        const schedule = wrapBlocks(data.scheduled);
        schedule.skipped = (data.skipped ?? []).map((s) => s.title ?? "");
        return schedule;
    }

    return normaliseScheduleResponse(data);
}

export async function acceptBlock(
    taskId: string,
    startTime: string,
    endTime: string,
    userId: string
): Promise<void> {
    await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/accept?user_id=${userId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task_id: taskId, scheduled_start: startTime, scheduled_end: endTime }),
        }
    );
}

export async function confirmSchedule(blocks: ScheduleBlock[], userId: string): Promise<void> {
    const payload = blocks
        .filter((b) => b.task_id)
        .map((b) => ({
            task_id: b.task_id,
            scheduled_start: `${b.date}T${b.start}:00`,
            scheduled_end: `${b.date}T${b.end}:00`,
        }));
    await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/confirm?user_id=${userId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );
}

export async function rejectBlock(
    taskId: string,
    originalTime: string,
    userId: string
): Promise<void> {
    await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/reject?user_id=${userId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task_id: taskId, slot_offered: originalTime, action: "rescheduled" }),
        }
    );
}
