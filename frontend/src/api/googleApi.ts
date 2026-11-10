import { API_ROUTES } from "../constants/apiRoutes.ts";
import { authFetch } from "./authFetch";

/* ── Google Auth ───────────────────── */

export async function startGoogleLogin() {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.GOOGLE}/login`
    );
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "Failed to start Google Calendar connection");
    }
    return (await response.json()).url as string;
}

/* ── Sync ─────────────────────────── */

export async function syncGoogleCalendar() {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.GOOGLE}/sync`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error("Failed to sync Google Calendar");
    }

    return await response.json();
}

/* ── Disconnect ───────────────────── */

export async function disconnectGoogleCalendar() {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.GOOGLE}/disconnect`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error("Failed to disconnect Google Calendar");
    }

    return await response.json();
}

/* ── Status ───────────────────────── */

export async function getGoogleStatus() {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.GOOGLE}/status`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch Google status");
    }

    return await response.json();
}
