import { API_ROUTES } from "../constants/apiRoutes";
import { authFetch } from "./authFetch";

export type PriorityStyle = "important_first" | "urgent_first" | "balanced";

export interface OnboardingWeightAnswers {
    priorityStyle: PriorityStyle;
    timePreferences: string[];
}

export async function initializeWeights(
    userId: string,
    answers: OnboardingWeightAnswers
): Promise<void> {
    const res = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.SCHEDULE}/init-weights?user_id=${userId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                priority_style: answers.priorityStyle,
                time_preferences: answers.timePreferences,
            }),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        console.error("Failed to initialize weights:", text);
        throw new Error("Failed to initialize weights");
    }
}
