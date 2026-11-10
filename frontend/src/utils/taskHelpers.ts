// src/utils/taskHelpers.ts

import type { Task } from "../types/Task";

export function getMissingFields(task: Task): Set<"title" | "due_date" | "task_duration"> {
    const missing = new Set<"title" | "due_date" | "task_duration">();
    if (!task.title?.trim()) missing.add("title");
    if (!task.due_date) missing.add("due_date");
    if (!task.task_duration || task.task_duration <= 0) missing.add("task_duration");
    return missing;
}

export function computeCanSchedule(task: Task): boolean {
    return getMissingFields(task).size === 0;
}

export function toHoursMinutes(totalMinutes: number | null | undefined) {
    if (!totalMinutes) return { hours: 0, minutes: 0 };
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function toTotalMinutes(hours: number, minutes: number) {
    return hours * 60 + minutes;
}

export const colors: Record<string, string> = {
    red: "#FFAFB1",
    orange: "#F6C98A",
    yellow: "#FFF59A",
    green: "#C0E8AA",
    blue: "#AFDBFF",
    purple: "#C5AFFF",
    pink: "#FFC7E8",
};

export const darkColors: Record<string, string> = {
    red: "#e57373",
    orange: "#ef9c3a",
    yellow: "#c8a800",
    green: "#5aab2e",
    blue: "#2a7fcf",
    purple: "#7c52e0",
    pink: "#e05fa8",
};

export const getColorHex = (colorName?: string) =>
    colors[colorName ?? "yellow"] ?? colors["yellow"];

export const getDarkColorHex = (colorName?: string) =>
    darkColors[colorName ?? "yellow"] ?? darkColors["yellow"];