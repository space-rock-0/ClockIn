import { API_ROUTES } from "../constants/apiRoutes";
import { authFetch } from "./authFetch";

export type UserStats = {
    total_hours: number;
    plants_grown: number;
    day_streak: number;
};

export async function getStats(): Promise<UserStats> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STATS}`
    );

    if (!res.ok) throw new Error("Failed to fetch stats");

    return res.json();
}