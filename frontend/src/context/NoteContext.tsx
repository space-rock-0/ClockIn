/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { getNotes } from "../api/stickyNoteApi";
import type { Note } from "../types/Note";

interface NotesContextValue {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        getNotes()
            .then(setNotes)
            .catch((err: unknown) => {
                console.error(err);
            });
    }, []);

    return (
        <NotesContext.Provider value={{ notes, setNotes }}>
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    const ctx = useContext(NotesContext);
    if (!ctx) throw new Error("useNotes must be used inside NotesProvider");
    return ctx;
}
