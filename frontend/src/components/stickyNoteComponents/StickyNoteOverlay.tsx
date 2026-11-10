import {
    Overlay,
    OverlayContent,
    IconButton,
    BottomActions,
} from "../../pages/StickyNoteHome.styles";
import type { StickyNoteColor } from "../../types/StickyNoteThemes";
import StickyNoteMenu from "./StickyNoteMenu.tsx";

import CancelIcon from "../icons/CancelIcon.tsx";
import ConfirmIcon from "../icons/ConfirmIcon.tsx";
import styled from "styled-components";
import type { Note } from "../../types/Note";
import StickyNoteEditable from "./StickyNoteEditable.tsx";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

const LargeIconButton = styled(IconButton)`
    svg {
        width: 35px;
        height: 35px;
    }
`;

const NoteAndMenuRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
`;

type OverlayProps = {
    note: Note;
    onChange: (title: string, content: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onColorChange: (noteId: string, color: StickyNoteColor) => void;
};

export default function StickyNoteOverlay({
                                              note,
                                              onChange,
                                              onSave,
                                              onCancel,
                                              onColorChange,
                                          }: OverlayProps) {

    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: note.content || "",
        onUpdate: ({ editor }) => {
            onChange(note.title, editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && note.content !== editor.getHTML()) {
            editor.commands.setContent(note.content || "");
        }
    }, [note, editor]);

    return (
        <Overlay onClick={onCancel}>
            <OverlayContent onClick={(e) => e.stopPropagation()}>

                <NoteAndMenuRow>
                    <StickyNoteEditable
                        note={note}
                        editor={editor}
                        onChange={onChange}
                        size="large"
                    />

                    <StickyNoteMenu
                        editor={editor}
                        noteId={note.id ?? undefined}
                        selectedColor={note.color}
                        onColorChange={onColorChange}
                    />
                </NoteAndMenuRow>

                <BottomActions>
                    <LargeIconButton style={{ color: "#FFF59A" }} onClick={onSave}>
                        <ConfirmIcon />
                    </LargeIconButton>
                    <LargeIconButton style={{ color: "#AFDBFF" }} onClick={onCancel}>
                        <CancelIcon />
                    </LargeIconButton>
                </BottomActions>

            </OverlayContent>
        </Overlay>
    );
}