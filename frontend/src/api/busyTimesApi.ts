import { API_ROUTES } from "../constants/apiRoutes";
import { authFetch } from "./authFetch";

export interface BusyTimePayload {
    title: string;
    start_time: string | null;  // ISO string, null if all_day
    end_time: string | null;
    days_of_week: string[];     // ["MON", "WED", "FRI"] or []
    source?: string;            // "manual" | "google"
}

export interface BusyTimeRecord extends BusyTimePayload {
    id: string;
    user_id: string;
    created_at: string;
}

// ── GET all ──────────────────────────────────────────
export async function getBusyTimes(): Promise<BusyTimeRecord[]> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.BUSY_TIMES}`
    );
    if (!res.ok) throw new Error("Failed to fetch busy times");
    return res.json();
}

// ── POST create ───────────────────────────────────────
export async function createBusyTime(payload: BusyTimePayload): Promise<BusyTimeRecord> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.BUSY_TIMES}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        console.error("Failed to create busy time:", text);
        throw new Error("Failed to create busy time");
    }
    return res.json();
}

// ── PUT update ────────────────────────────────────────
export async function updateBusyTime(id: string, payload: BusyTimePayload): Promise<BusyTimeRecord> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.BUSY_TIMES}/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        console.error("Failed to update busy time:", text);
        throw new Error("Failed to update busy time");
    }
    return res.json();
}

// ── DELETE ────────────────────────────────────────────
export async function deleteBusyTime(id: string): Promise<void> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.BUSY_TIMES}/${id}`,
        { method: "DELETE" }
    );
    if (!res.ok) {
        const text = await res.text();
        console.error("Failed to delete busy time:", text);
        throw new Error("Failed to delete busy time");
    }
}
