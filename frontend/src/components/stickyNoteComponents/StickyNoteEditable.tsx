import StickyNoteFrame from "./StickyNoteFrame";
import type { Note } from "../../types/Note";
import styled from "styled-components";
import { StickyNoteThemes } from "../../types/StickyNoteThemes";
import { useRef, useEffect } from "react";
import { EditorContent, type Editor } from "@tiptap/react";

const TitleInput = styled.input`
    font-size: 1.6rem;
    font-weight: 600;
    border: none;
    background: transparent;

    &:focus {
        outline: none;
    }
`;

const ContentWrapper = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-top: 6px;
    padding-right: 47px;

    /* 🔥 Hide scrollbar */
    scrollbar-width: none;        /* Firefox */
    -ms-overflow-style: none;     /* IE */

    &::-webkit-scrollbar {
        display: none;            /* Chrome/Safari */
    }

    .ProseMirror {
        outline: none;
        font-size: 1.2rem;
        line-height: 1.6;
        word-break: break-word;
        min-height: 120px;
        cursor: text;
    }
`;

type NoteProps = {
    note: Note;
    editor: Editor | null;
    onChange: (title: string, content: string) => void;
    size?: "small" | "large";
};

export default function StickyNoteEditable({
                                               note,
                                               editor,
                                               onChange,
                                               size = "small"
                                           }: NoteProps) {

    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        titleRef.current?.focus();
    }, []);

    return (
        <StickyNoteFrame
            size={size}
            theme={StickyNoteThemes[note.color]}
        >
            <TitleInput
                ref={titleRef}
                value={note.title}
                onChange={(e) => onChange(e.target.value, editor?.getHTML() || "")}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        editor?.commands.focus("end");
                    }
                }}
                placeholder="Add a title..."
            />

            <ContentWrapper>
                <EditorContent editor={editor} />
            </ContentWrapper>

        </StickyNoteFrame>
    );
}