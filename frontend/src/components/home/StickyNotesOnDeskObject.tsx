// StickyNotesOnDeskObject.tsx
import styled from "styled-components";
import { ROUTES } from "../../constants/Routes";
import { useNotes } from "../../context/NoteContext";
import { StickyNoteThemes } from "../../types/StickyNoteThemes";
import StickyNoteSVG from "../stickyNoteComponents/StickyNoteSVG";
import StickyNotesOnDeskIcon from "../icons/StickyNotesOnDeskIcon";
import { Link } from "react-router-dom";

const Wrapper = styled.div`
    position: absolute;
    top: 10%;
    left: 35%;
    width: 28%;
    display: block;
    transform: scale(0.7);
    cursor: pointer;

    & * {
        pointer-events: none;
    }
    &:hover::after {
        content: "Sticky Note Board"; /* or "Sticky Note Board" */
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #4B94DB;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 2.2rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 0 8px rgba(255, 255, 255, 1),
        0 0 16px rgba(255, 255, 255, 0.9),
        0 0 32px rgba(255, 255, 255, 0.7),
        0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
`;

const BoardBackground = styled(StickyNotesOnDeskIcon)`
    width: 100%;
    height: auto;
    display: block;

    [data-theme="dark"] & rect[fill="white"] { fill: #9f95c6; stroke: #272336; }
`;

const NotesOverlay = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const StyledLink = styled(Link)`
    position: absolute;
    inset: 0;
    cursor: pointer;
    z-index: 100;
    pointer-events: all;
`;

const PREVIEW_SIZE = 100;
const MAX_PREVIEW = 15;
const NOTE_SIZE = 220;

const PREVIEW_BOUNDS = {
    minX: 60,
    minY: 80,
    maxX: 750,
    maxY: 580,
};

const BOARD_PADDING = 50;
const CLUSTER_THRESHOLD = 750;

function mapBoardPositionToPreview(
    boardPos: { x: number; y: number },
    previewNotes: Array<{ position: { x: number; y: number } }>
) {
    if (previewNotes.length === 0) {
        return { x: (PREVIEW_BOUNDS.minX + PREVIEW_BOUNDS.maxX) / 2, y: (PREVIEW_BOUNDS.minY + PREVIEW_BOUNDS.maxY) / 2 };
    }

    const tightBounds = previewNotes.reduce(
        (acc, note) => ({
            minX: Math.min(acc.minX, note.position.x),
            minY: Math.min(acc.minY, note.position.y),
            maxX: Math.max(acc.maxX, note.position.x + NOTE_SIZE),
            maxY: Math.max(acc.maxY, note.position.y + NOTE_SIZE),
        }),
        {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
        }
    );

    const spread = Math.max(
        tightBounds.maxX - tightBounds.minX,
        tightBounds.maxY - tightBounds.minY
    );
    const dynamicPaddingScale = spread < CLUSTER_THRESHOLD ? 0.6 : 0.8;

    const boardBounds = {
        minX: tightBounds.minX - BOARD_PADDING,
        minY: tightBounds.minY - BOARD_PADDING,
        maxX: tightBounds.maxX + BOARD_PADDING,
        maxY: tightBounds.maxY + BOARD_PADDING,
    };

    const boardW = Math.max(boardBounds.maxX - boardBounds.minX, 1);
    const boardH = Math.max(boardBounds.maxY - boardBounds.minY, 1);

    const relX = (boardPos.x - boardBounds.minX) / boardW;
    const relY = (boardPos.y - boardBounds.minY) / boardH;

    const previewW = PREVIEW_BOUNDS.maxX - PREVIEW_BOUNDS.minX;
    const previewH = PREVIEW_BOUNDS.maxY - PREVIEW_BOUNDS.minY;
    const centerX = PREVIEW_BOUNDS.minX + previewW / 2;
    const centerY = PREVIEW_BOUNDS.minY + previewH / 2;

    const shrunkW = previewW * dynamicPaddingScale;
    const shrunkH = previewH * dynamicPaddingScale;

    return {
        x: centerX - shrunkW / 2 + relX * shrunkW,
        y: centerY - shrunkH / 2 + relY * shrunkH,
    };
}

export default function StickyNotesOnDeskObject() {
    const { notes } = useNotes();
    const preview = notes.slice(0, MAX_PREVIEW);

    return (
        <Wrapper data-tutorial="sticky-notes">
            <BoardBackground />

            <NotesOverlay viewBox="0 0 800 600">
                {preview.map((note) => {
                    const theme = StickyNoteThemes[note.color] ?? StickyNoteThemes.yellow;
                    const previewPos = mapBoardPositionToPreview(note.position, preview);
                    const rot = ((parseInt(note.id?.slice(0, 8) ?? "0", 16) * 7 + 3) % 9) - 4;

                    return (
                        <g
                            key={note.id}
                            transform={`translate(${previewPos.x}, ${previewPos.y}) rotate(${rot}, ${PREVIEW_SIZE / 2}, ${PREVIEW_SIZE / 2})`}
                        >
                            <foreignObject
                                width={PREVIEW_SIZE}
                                height={PREVIEW_SIZE}
                                style={{ pointerEvents: "none" }}
                            >
                                <StickyNoteSVG
                                    theme={theme}
                                    width={PREVIEW_SIZE}
                                    height={PREVIEW_SIZE}
                                />
                            </foreignObject>
                        </g>
                    );
                })}

                {notes.length > MAX_PREVIEW && (
                    <text
                        x={PREVIEW_BOUNDS.maxX - 10}
                        y={PREVIEW_BOUNDS.minY - 12}
                        textAnchor="end"
                        fontSize={10}
                        fill="#999"
                        fontFamily="sans-serif"
                    >
                        +{notes.length - MAX_PREVIEW} more
                    </text>
                )}
            </NotesOverlay>

            <StyledLink to={ROUTES.STICKY_NOTES} />
        </Wrapper>
    );
}