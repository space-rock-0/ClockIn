import StickyNoteViewOnly from "./StickyNoteViewOnly";
//import { useState} from "react";
import type { Note } from "../../types/Note";


type StickyNoteContainerProps = {
    notes: Note[];
    onNoteClick: (note: Note) => void;
};

export default function StickyNoteContainer({notes, onNoteClick }: StickyNoteContainerProps)
{

    return (
        <>
            {notes.map((note) => (
                <StickyNoteViewOnly
                    key={note.id}
                    note={note}
                    onClick={() => onNoteClick(note)}
                />
            ))}
        </>
    );
}