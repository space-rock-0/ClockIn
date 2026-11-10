import React, { useRef, useState, useCallback } from "react";
import styled from "styled-components";
import StickyNoteViewOnly from "./StickyNoteViewOnly";
import type { Note } from "../../types/Note";

const DragWrapper = styled.div<{
    x: number;
    y: number;
    z: number;
    $isDragging: boolean;
    $isSnapping: boolean;
    $isNearZone: boolean;
}>`
    position: absolute;
    left: ${({ x }) => x}px;
    top: ${({ y }) => y}px;
    z-index: ${({ $isDragging, z }) => ($isDragging ? 9999 : z)};
    cursor: ${({ $isDragging }) => ($isDragging ? "grabbing" : "grab")};
    user-select: none;

    filter: ${({ $isDragging }) =>
            $isDragging
                    ? "drop-shadow(0 14px 28px rgba(0,0,0,0.30))"
                    : "drop-shadow(0 2px 6px rgba(0,0,0,0.12))"};

    transform: ${({ $isDragging, $isNearZone }) =>
            $isNearZone
                    ? "scale(0.45)"
                    : $isDragging
                            ? "scale(1.04)"
                            : "scale(1)"};

    transition: ${({ $isDragging, $isSnapping }) =>
            $isDragging
                    ? "transform 0.2s ease, filter 0.15s ease"
                    : $isSnapping
                            ? "left 0.25s cubic-bezier(0.34,1.56,0.64,1), top 0.25s cubic-bezier(0.34,1.56,0.64,1), transform 0.15s ease, filter 0.15s ease"
                            : "transform 0.15s ease, filter 0.15s ease"};

    will-change: left, top;
`;

type DropZone = { id: string; x: number; y: number; radius: number };

type Props = {
    note: Note;
    boardRef: React.RefObject<HTMLDivElement | null>;
    dropZones: DropZone[];
    onDragEnd: (noteId: string, x: number, y: number) => void;
    onNoteClick: (note: Note) => void;
    onDropZoneRelease: (zoneId: string, note: Note) => void;
};

export default function DraggableStickyNote({
                                                note,
                                                boardRef,
                                                dropZones,
                                                onDragEnd,
                                                onNoteClick,
                                                onDropZoneRelease,
                                            }: Props) {
    const [pos, setPos] = useState({
        x: note.position?.x ?? 50,
        y: note.position?.y ?? 50,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const [isNearZone, setIsNearZone] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const lastGoodPos = useRef({
        x: note.position?.x ?? 50,
        y: note.position?.y ?? 50,
    });

    const getHoveredZone = useCallback(
        (x: number, y: number): string | null => {
            const w = wrapperRef.current?.offsetWidth ?? 220;
            const h = wrapperRef.current?.offsetHeight ?? 220;
            const cx = x + w / 2;
            const cy = y + h / 2;
            for (const zone of dropZones) {
                const dist = Math.sqrt((cx - zone.x) ** 2 + (cy - zone.y) ** 2);
                if (dist <= zone.radius) return zone.id;
            }
            return null;
        },
        [dropZones]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();

            const noteRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - noteRect.left,
                y: e.clientY - noteRect.top,
            };
            hasMoved.current = false;
            setIsDragging(true);
            window.dispatchEvent(
                new CustomEvent("noteDragState", { detail: { dragging: true } })
            );
            setIsSnapping(false);

            const boardRect = boardRef.current?.getBoundingClientRect();

            const handleMouseMove = (me: MouseEvent) => {
                hasMoved.current = true;
                const rawX = me.clientX - (boardRect?.left ?? 0) - dragOffset.current.x;
                const rawY = me.clientY - (boardRect?.top ?? 0) - dragOffset.current.y;
                setPos({ x: rawX, y: rawY });

                const zone = getHoveredZone(rawX, rawY);
                setIsNearZone(!!zone);
                window.dispatchEvent(
                    new CustomEvent("noteHoverZone", { detail: { zoneId: zone } })
                );
            };

            const handleMouseUp = (me: MouseEvent) => {
                setIsDragging(false);
                setIsNearZone(false);
                window.dispatchEvent(
                    new CustomEvent("noteHoverZone", { detail: { zoneId: null } })
                );
                window.dispatchEvent(
                    new CustomEvent("noteDragState", { detail: { dragging: false } })
                );
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);

                if (!hasMoved.current) {
                    onNoteClick(note);
                    return;
                }

                if (!boardRect) return;

                const finalX = me.clientX - boardRect.left - dragOffset.current.x;
                const finalY = me.clientY - boardRect.top - dragOffset.current.y;
                const noteW = wrapperRef.current?.offsetWidth ?? 220;
                const noteH = wrapperRef.current?.offsetHeight ?? 220;

                const droppedZone = getHoveredZone(finalX, finalY);
                if (droppedZone) {
                    setIsSnapping(true);
                    setPos({ ...lastGoodPos.current });
                    onDropZoneRelease(droppedZone, note);
                    return;
                }

                const insideBoard =
                    finalX >= 0 &&
                    finalY >= 0 &&
                    finalX + noteW <= boardRect.width &&
                    finalY + noteH <= boardRect.height;

                if (insideBoard) {
                    lastGoodPos.current = { x: finalX, y: finalY };
                    setPos({ x: finalX, y: finalY });
                    setIsSnapping(false);
                    onDragEnd(note.id!, finalX, finalY);
                } else {
                    setIsSnapping(true);
                    setPos({ ...lastGoodPos.current });
                }
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [note, boardRef, getHoveredZone, onDragEnd, onNoteClick, onDropZoneRelease]
    );

    React.useEffect(() => {
        if (!isDragging) {
            const x = note.position?.x ?? 50;
            const y = note.position?.y ?? 50;
            lastGoodPos.current = { x, y };
            setPos({ x, y });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note.position]);

    return (
        <DragWrapper
            ref={wrapperRef}
            x={pos.x}
            y={pos.y}
            z={note.position?.z ?? 1}
            $isDragging={isDragging}
            $isSnapping={isSnapping}
            $isNearZone={isNearZone}
            onMouseDown={handleMouseDown}
        >
            <StickyNoteViewOnly note={note} />
        </DragWrapper>
    );
}