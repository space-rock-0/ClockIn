export type AIProvider = "auto" | "groq" | "openai" | "anthropic";
export interface AISettings {
    provider: AIProvider;
    groq_key: string;
    openai_key: string;
    anthropic_key: string;
    groq_model: string;
    openai_model: string;
    anthropic_model: string;
    groq_fallback: boolean;
}
export const defaultAISettings: AISettings = {
    provider: "auto", groq_key: "", openai_key: "", anthropic_key: "",
    groq_model: "", openai_model: "", anthropic_model: "", groq_fallback: true,
};
const storageKey = (userId: string) => `clockin.ai.v1.${userId}`;
export function loadAISettings(userId: string): AISettings {
    try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey(userId)) ?? "null");
        return saved ? { ...defaultAISettings, ...saved } : { ...defaultAISettings };
    } catch {
        return { ...defaultAISettings };
    }
}
export function saveAISettings(userId: string, settings: AISettings) {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(settings));
}
export function clearAISettings(userId: string) {
    sessionStorage.removeItem(storageKey(userId));
}

export async function apiError(response: Response, fallback: string): Promise<Error> {
    const data = await response.json().catch(() => null);
    return new Error(typeof data?.detail === "string" ? data.detail : fallback);
}
