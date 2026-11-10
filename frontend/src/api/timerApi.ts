import { apiError } from "./aiSettings";
import { API_ROUTES } from "../constants/apiRoutes";
import { authFetch } from "./authFetch";
import type { TimerSession } from "../types/TimerSession";


export async function createTimerSession(session: TimerSession) {

    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.TIMER}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(session),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to save timer session");
    }

    return response.json();
}

export async function generateWorkflow(task: { title: string; description?: string }) {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.TIMER}/workflow`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: task.title,
                description: task.description ?? "",
            }),
        }
    );

    if (!response.ok) throw await apiError(response, "Failed to generate workflow");
    return response.json();
}