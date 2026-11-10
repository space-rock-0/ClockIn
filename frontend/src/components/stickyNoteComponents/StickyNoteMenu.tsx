import styled from "styled-components";
import type { StickyNoteColor } from "../../types/StickyNoteThemes";
import type { Editor } from "@tiptap/react";
import { useState } from "react";

// ─── Layout ───────────────────────────────────────────────────────────────────

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;

    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 14px;

    box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.08);

    padding: 8px 10px;
    gap: 6px;

    min-width: 260px;
`;

const Divider = styled.div`
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
`;

// ─── Format Row ───────────────────────────────────────────────────────────────

const FormatRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const FormatButton = styled.button<{ active?: boolean }>`
    flex: 1;
    padding: 8px 0;
    border: none;
    background: ${({ active }) =>
            active ? "rgba(0, 0, 0, 0.18)" : "transparent"};
    cursor: pointer;

    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.75);

    transition: background 0.12s ease;

    &:hover {
        background: ${({ active }) =>
                active ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.07)"};
    }

    &:active {
        background: rgba(0,0,0,0.25);
    }

    & + & {
        border-left: 1px solid rgba(0, 0, 0, 0.08);
    }

    border-radius: 14px;
`;

const BoldLabel = styled.span`font-weight: 700;`;
const ItalicLabel = styled.span`font-style: italic;`;
const UnderlineLabel = styled.span`text-decoration: underline;`;
const StrikeLabel = styled.span`text-decoration: line-through;`;

// ─── Colors ───────────────────────────────────────────────────────────────────

const ColorRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
`;

const ColorLabel = styled.span`
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.5);
    margin-right: 4px;
`;

const ColorSwatch = styled.button<{ color: string; selected?: boolean }>`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ color }) => color};

    border: ${({ selected }) =>
            selected ? "2px solid rgba(0,0,0,0.6)" : "2px solid transparent"};

    cursor: pointer;
    padding: 0;

    transition: transform 0.1s ease, border 0.1s ease;

    &:hover {
        transform: scale(1.2);
        border-color: rgba(0,0,0,0.3);
    }
`;

const COLORS = [
    { color: "red", hex: "#FFAFB1" },
    { color: "orange", hex: "#F6C98A" },
    { color: "yellow", hex: "#FFF59A" },
    { color: "green", hex: "#C0E8AA" },
    { color: "blue", hex: "#AFDBFF" },
    { color: "purple", hex: "#C5AFFF" },
    { color: "pink", hex: "#FFC7E8" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
    editor: Editor;
    noteId?: string;
    selectedColor?: StickyNoteColor;
    onColorChange?: (noteId: string, color: StickyNoteColor) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StickyNoteMenu({
                                           editor,
                                           noteId,
                                           selectedColor,
                                           onColorChange,
                                       }: Props) {

    const [mode, setMode] = useState<
        null | "bold" | "italic" | "underline" | "strike"
    >(null);

    const handleClick = (type: "bold" | "italic" | "underline" | "strike") => {
        const hasSelection =
            editor.state.selection.from !== editor.state.selection.to;

        const chain = editor.chain().focus();

        // ✅ CASE 1: selection → normal formatting
        if (hasSelection) {
            if (type === "bold") chain.toggleBold();
            if (type === "italic") chain.toggleItalic();
            if (type === "underline") chain.toggleUnderline();
            if (type === "strike") chain.toggleStrike();

            chain.run();
            return;
        }

        // ✅ CASE 2/3/4: mode logic
        if (mode === type) {
            setMode(null);
            return;
        }

        setMode(type);

        // 🔥 CRITICAL FIX: apply immediately so first letter is correct
        if (type === "bold") chain.setBold();
        if (type === "italic") chain.setItalic();
        if (type === "underline") chain.setUnderline();
        if (type === "strike") chain.setStrike();

        chain.run();
    };

    return (
        <MenuContainer>
            <FormatRow>
                <FormatButton active={mode === "bold"} onClick={() => handleClick("bold")}>
                    <BoldLabel>B</BoldLabel>
                </FormatButton>

                <FormatButton active={mode === "italic"} onClick={() => handleClick("italic")}>
                    <ItalicLabel>I</ItalicLabel>
                </FormatButton>

                <FormatButton active={mode === "underline"} onClick={() => handleClick("underline")}>
                    <UnderlineLabel>U</UnderlineLabel>
                </FormatButton>

                <FormatButton active={mode === "strike"} onClick={() => handleClick("strike")}>
                    <StrikeLabel>S</StrikeLabel>
                </FormatButton>
            </FormatRow>

            <Divider />

            <ColorRow>
                <ColorLabel>Color</ColorLabel>
                {COLORS.map(({ color, hex }) => (
                    <ColorSwatch
                        key={color}
                        color={hex}
                        selected={selectedColor === color}
                        onClick={() =>
                            onColorChange?.(noteId ?? "", color as StickyNoteColor)
                        }
                    />
                ))}
            </ColorRow>
        </MenuContainer>
    );
}