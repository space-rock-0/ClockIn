import { apiError } from "./aiSettings";
import { API_ROUTES } from "../constants/apiRoutes.ts";
import type { Note } from "../types/Note";
import type { StickyNoteColor } from "../types/StickyNoteThemes";
import { authFetch } from "./authFetch";
import type { Task } from "../types/Task";

export async function noteToTask(noteId: string) {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/note_to_task/${noteId}`
    );

    if (!response.ok) {
        throw await apiError(response, "Failed to convert note to tasks");
    }

    return await response.json(); // returns proposed task list, nothing saved yet
}

export async function sendTasksToList(tasks: Task[]) {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/send`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tasks)
        }
    );

    if (!response.ok) {
        throw new Error("Failed to send tasks");
    }

    return await response.json();
}

export async function saveNote (activeNote : Note) {
    if (!activeNote) return;

    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/save`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                id: activeNote.id,
                title: activeNote.title,
                content: activeNote.content,
                position: activeNote.position,
                color: activeNote.color
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create note");
    }

    return await response.json();
}

export async function getNotes() {

    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}`
    );


    if (!response.ok) {
        throw new Error("Failed to fetch notes");
    }
    return response.json();
}

export async function deleteNote(noteId: string) {
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/delete/${noteId}`,
        {
            method: "DELETE",
        }
    );
    if (!response.ok) {
        throw new Error("Failed to delete note");
    }
    return await response.json();
    // { deleted_id: number }
    // returns this
}

export async function changeColor(noteId : string, color: StickyNoteColor) {
    // stuff to change color
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/${noteId}/color`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ color })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update color");
    }
    console.log("Succcess, no return to frontend")
}

export async function updateNotePosition(noteId: string, x: number, y: number, z: number) {
    console.log("Got here!");
    const response = await authFetch(
        `${import.meta.env.VITE_API_URL}${API_ROUTES.STICKY_NOTES}/${noteId}/position`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x, y, z }),
        }
    );

    console.log("Got here again!");
    if (!response.ok) {
        throw new Error("Failed to update note position");
    }
    // No return value needed — backend returns nothing on position update
}