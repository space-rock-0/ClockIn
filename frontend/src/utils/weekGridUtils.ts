function pad(n: number) { return String(n).padStart(2, "0"); }

export const TIME_COL_WIDTH = 42;

export function getWeekDays() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        return { date, label, isToday: i === 0 };
    });
}
