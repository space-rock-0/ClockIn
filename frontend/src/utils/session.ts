export function getActiveSession() {
    const raw = localStorage.getItem("activeSession");
    if (!raw) return null;

    const session = JSON.parse(raw);

    const remaining = session.endTime - Date.now();

    if (remaining <= 0) {
        localStorage.removeItem("activeSession");
        return null;
    }

    return session;
}