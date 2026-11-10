import { API_ROUTES } from "../constants/apiRoutes.ts";
import { authFetch } from "./authFetch.ts";

export type VisitFlags = {
    visited_home: boolean;
    visited_notes: boolean;
    visited_tasks: boolean;
    visited_schedule: boolean;
    visited_timer: boolean;
    visited_garden: boolean;
};

type Page = "home" | "notes" | "tasks" | "schedule" | "timer" | "garden";

export async function getUserVisits(): Promise<VisitFlags> {
    console.log("Fetching user visibility. getUserVisits was called");
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.USER_VISITS}`
    );
    const data = await response.json();
    console.log(data);
    if (!response.ok) throw new Error("Failed to fetch user visits");
    return data;
}

export async function markPageVisited(page: Page): Promise<VisitFlags> {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.USER_VISITS}/mark/${page}`,
        { method: "PATCH" }
    );
    if (!response.ok) throw new Error("Failed to mark page as visited");
    return await response.json();
}