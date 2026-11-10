import {supabase} from "../supabaseClient.ts";
import { loadAISettings } from "./aiSettings";

function buildHeaders(token: string, body?: BodyInit | null, extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    headers.set("Authorization", `Bearer ${token}`);

    if (!(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    return headers;
}

export async function authFetch(url: string, options: RequestInit = {}) {
    const { data } = await supabase.auth.getSession();
    let token = data.session?.access_token;

    if (!token) {
        throw new Error("No auth token found");
    }

    const target = new URL(url, window.location.origin);
    const api = new URL(import.meta.env.VITE_API_URL || window.location.origin, window.location.origin);
    if (target.origin !== api.origin) throw new Error("Authenticated requests must use the configured API.");
    const headers = new Headers(options.headers);
    const aiRequest = /\/api\/(timer\/workflow|tasks\/generate-from-file|sticky-notes\/note_to_task\/|schedule\/accept)/.test(target.pathname);
    if (aiRequest && data.session?.user.id) {
        headers.set("X-AI-Settings", JSON.stringify(loadAISettings(data.session.user.id)));
    }

    let response = await fetch(url, {
        ...options,
        headers: buildHeaders(token, options.body, headers),
    });

    if (response.status === 401) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (error || !refreshed.session) {
            throw new Error("Session expired — please log in again");
        }

        token = refreshed.session.access_token;

        response = await fetch(url, {
            ...options,
            headers: buildHeaders(token, options.body, headers),
        });
    }

    return response;
}
