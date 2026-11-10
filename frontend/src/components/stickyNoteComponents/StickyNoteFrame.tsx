import styled from "styled-components";
import StickyNoteBackground from "./StickyNoteBackground";
import React from "react";
import type { StickyNoteTheme } from "../../types/StickyNoteThemes";

const NoteWrapper = styled.div<{ size?: "small" | "large" }>`
    position: relative;
    opacity: 1;

    width: ${({ size }) =>
            size === "large"
                    ? "min(400px, 60vw)"   // 🔥 bigger edit mode
                    : "clamp(200px, 13vw, 300px)"};

    aspect-ratio: 1;
`;

const NoteContent = styled.div<{textColor: string}>`
    position: absolute;
    inset: 8% 8% 10% 8%;
    
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: ${(props) => props.textColor};
`;

type Props = {
    onClick?: () => void;
    theme: StickyNoteTheme;
    children: React.ReactNode;
    size?: "small" | "large";
};

export default function StickyNoteFrame({onClick, theme, children, size }: Props) {
    return (
        <NoteWrapper size={size} onClick={onClick}>
            <StickyNoteBackground theme={theme}/>
            <NoteContent textColor={theme.text}>{children}</NoteContent>
        </NoteWrapper>
    );
}