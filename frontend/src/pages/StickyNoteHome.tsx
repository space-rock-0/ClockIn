import { ROUTES } from "../constants/Routes";

import { useState, useEffect, useRef, useCallback } from "react";
import {saveNote, deleteNote, changeColor, noteToTask, sendTasksToList, updateNotePosition } from "../api/stickyNoteApi.ts";
import type {Note} from "../types/Note";
import type {Task} from "../types/Task";
import BackButton from "../components/navigation/BackButton.tsx";
import { useTheme } from "../context/ThemeContext";
import HomepageBlankObject from "../components/home/HomepageBlankObject";

import {
    PageTitle, PageWrapper, NotesAndButtonsLayout,
    NotesBoard, ActionColumn, AddAndSelectWrapper,
    BackgroundOverlay
} from "./StickyNoteHome.styles";

import StickyNoteOverlay from "../components/stickyNoteComponents/StickyNoteOverlay";
import { AddButton } from "../components/navigation/AddButton";
import DraggableStickyNote from "../components/stickyNoteComponents/DraggableStickyNote.tsx";
import DeleteConfirmModal from "../components/modal/DeleteConfirmModal.tsx";
import TaskDropZone from "../components/dropzones/TaskDropZone.tsx";
import TrashDropZone from "../components/dropzones/TrashDropZone.tsx";
import type {StickyNoteColor} from "../types/StickyNoteThemes.ts";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import {useNotes} from "../context/NoteContext.tsx";
import {STICKY_NOTE_TUTORIAL_STEPS} from "../constants/StickyNoteTutorialSteps.ts";
import {useAutoTutorial} from "../hooks/useAutoTutorial.ts";
import {useUserVisits} from "../hooks/useUserVisits.ts";
import TaskConfirmModal from "../components/modal/TaskConfirmModal.tsx";

// ─── Custom event types ───────────────────────────────────────────────────────

declare global {
    interface WindowEventMap {
        noteHoverZone: CustomEvent<{ zoneId: string | null }>;
    }
}

// ─── Default grid placement for notes with no saved position ─────────────────
const NOTE_SIZE = 220;
const GRID_COLS = 3;
const GRID_PAD = 30;
const GRID_GAP = 24;
const DROP_RADIUS = 120;

function defaultPosition(index: number) {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    return {
        x: GRID_PAD + col * (NOTE_SIZE + GRID_GAP),
        y: GRID_PAD + row * (NOTE_SIZE + GRID_GAP),
    };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PendingDrop = { note: Note; zone: "trash" | "calendar" } | null;

// ─── Animations ───────────────────────────────────────────────────────────────

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

const ToastWrapper = styled.div`
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #fff;
    border-radius: 12px;
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    animation: ${slideUp} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 2000;
    min-width: 220px;
    text-align: center;
`;

const ToastTop = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
`;

const ToastLink = styled.button`
    background: none;
    border: none;
    color: #aaa;
    font-size: 0.8rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;

    &:hover { color: #fff; }
`;

export function StickyNoteHome() {

    const { notes, setNotes } = useNotes();
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [proposedTasks, setProposedTasks] = useState<Task[]>([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<PendingDrop>(null);
    const [hoveredZone, setHoveredZone] = useState<"calendar" | "trash" | null>(null);
    const [sourceNote, setSourceNote] = useState<Note | null>(null);
    const [toast, setToast] = useState<{ count: number } | null>(null);
    const [isDraggingNote, setIsDraggingNote] = useState(false);

    const navigate = useNavigate();

    const boardRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const trashRef = useRef<HTMLDivElement>(null);
    const numberOfNotes = notes.length;

    const [dropZones, setDropZones] = useState<
        Array<{ id: string; x: number; y: number; radius: number }>
    >([]);

    const recomputeZones = useCallback(() => {
        if (!boardRef.current || !calendarRef.current || !trashRef.current) return;
        const boardRect = boardRef.current.getBoundingClientRect();
        const calRect = calendarRef.current.getBoundingClientRect();
        const trashRect = trashRef.current.getBoundingClientRect();

        setDropZones([
            {
                id: "calendar",
                x: calRect.left + calRect.width / 2 - boardRect.left,
                y: calRect.top + calRect.height / 2 - boardRect.top,
                radius: DROP_RADIUS,
            },
            {
                id: "trash",
                x: trashRect.left + trashRect.width / 2 - boardRect.left,
                y: trashRect.top + trashRect.height / 2 - boardRect.top,
                radius: DROP_RADIUS,
            },
        ]);
    }, []);

    useEffect(() => {
        const t = setTimeout(recomputeZones, 50);
        window.addEventListener("resize", recomputeZones);
        return () => {
            clearTimeout(t);
            window.removeEventListener("resize", recomputeZones);
        };
    }, [recomputeZones]);

    useEffect(() => {
        const handler = (e: CustomEvent<{ zoneId: string | null }>) => {
            setHoveredZone(e.detail.zoneId as "calendar" | "trash" | null);
        };
        window.addEventListener("noteHoverZone", handler);
        return () => window.removeEventListener("noteHoverZone", handler);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<{ dragging: boolean }>;
            setIsDraggingNote(custom.detail.dragging);
        };

        window.addEventListener("noteDragState", handler as EventListener);
        return () => window.removeEventListener("noteDragState", handler as EventListener);
    }, []);

    const notesWithPositions = notes.map((note, i) => ({
        ...note,
        position: {
            x: note.position?.x ?? defaultPosition(i).x,
            y: note.position?.y ?? defaultPosition(i).y,
            z: note.position?.z ?? i + 1,
        },
    }));

    const updateNote = (title: string, content: string) => {
        setActiveNote(prev =>
            prev ? { ...prev, title, content } : prev
        );
    };

    const generateTasksFromNote = async (note: Note) => {
        if (!note?.id) return;

        setShowTaskModal(true);
        setIsLoadingTasks(true);
        setSourceNote(note);

        try {
            const tasks = await noteToTask(note.id);
            setProposedTasks(tasks);
        } catch (err) {
            console.error("Failed to generate tasks", err);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const handleUpdateTask = (index: number, updated: Task) => {
        setProposedTasks(prev =>
            prev.map((task, i) => i === index ? updated : task)
        );
    };
    const handleRemoveTask = (index: number) => {
        setProposedTasks(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmTasks = async () => {
        const count = proposedTasks.length;

        await sendTasksToList(proposedTasks);

        if (sourceNote?.id) {
            await deleteNote(sourceNote.id);
            setNotes(prev => prev.filter(n => n.id !== sourceNote.id));
        }

        setShowTaskModal(false);
        setProposedTasks([]);
        setActiveNote(null);

        setToast({ count });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCancelTasks = () => {
        setShowTaskModal(false);
        setProposedTasks([]);
        setIsLoadingTasks(false);
        setSourceNote(null);
    };

    const handleSaveNote = async () => {
        if (!activeNote) return;

        try {
            const normalizedNote = await saveNote(activeNote);

            setNotes(prev => {
                const other = prev.filter(n => n.id !== normalizedNote.id);
                return [...other, normalizedNote];
            });

            setActiveNote(null);

        } catch (err) {
            console.error("Failed to save note", err);
        }
    };

    const handleCancelNote = () => {
        setActiveNote(null);
    };

    const handleColorChange = async (noteId: string, color: StickyNoteColor) => {
        setNotes(prev =>
            prev.map(n =>
                n.id === noteId ? { ...n, color } : n
            )
        );

        setActiveNote(prev =>
            prev && (prev.id === noteId || (!prev.id && !noteId))
                ? { ...prev, color }
                : prev
        );

        if (!noteId) {
            console.warn("No noteId — skipping backend call");
            return;
        }

        try {
            await changeColor(noteId, color);
        } catch (error) {
            console.error("Failed to update color", error);
        }
    };

    const handleDragEnd = useCallback(async (noteId: string, x: number, y: number) => {
        let newZ = 1;
        setNotes(prev => {
            const maxZ = Math.max(...prev.map(n => n.position?.z ?? 1));
            newZ = maxZ + 1;

            return prev.map(n =>
                n.id === noteId
                    ? { ...n, position: { x: Math.round(x), y: Math.round(y), z: newZ } }
                    : n
            );
        });

        try {
            await updateNotePosition(noteId, Math.floor(x), Math.floor(y), newZ);
        } catch (err) {
            console.error(err);
        }
    }, [setNotes]);

    const handleDropZoneRelease = useCallback((zoneId: string, note: Note) => {
        setPendingDrop({ note, zone: zoneId as "trash" | "calendar" });
    }, []);

    const confirmTrashDrop = async () => {
        if (!pendingDrop?.note.id) return;

        const result = await deleteNote(pendingDrop.note.id);

        setNotes(prev =>
            prev.filter(n => n.id !== result.deleted_id)
        );

        setPendingDrop(null);
    };

    const confirmCalendarDrop = async () => {
        if (!pendingDrop) return;

        const note = pendingDrop.note;
        setPendingDrop(null);

        await generateTasksFromNote(note);
    };

    const { isDark } = useTheme();
    const { visits } = useUserVisits();
    useAutoTutorial(visits?.visited_notes, STICKY_NOTE_TUTORIAL_STEPS, "notes");
    return (
        <>
            <HomepageBlankObject />
            <BackgroundOverlay style={isDark ? { background: "rgba(20,15,45,0.45)" } : undefined} />

            <PageWrapper>

                <BackButton to={ROUTES.HOME} style={{ color: "#eeeeee" }} />

                <PageTitle>Your Sticky Notes</PageTitle>

                <AddAndSelectWrapper>
                    <div data-tutorial-id="add-note-btn" style={{ display: "inline-flex" }}>
                        <AddButton
                            label="New Note"
                            onClick={() =>
                                setActiveNote({
                                    title: "",
                                    content: "",
                                    color: "yellow",
                                    position: {
                                        x: defaultPosition(numberOfNotes).x,
                                        y: defaultPosition(numberOfNotes).y,
                                        z: numberOfNotes + 1
                                    }
                                })}
                        />
                    </div>
                </AddAndSelectWrapper>

                <NotesAndButtonsLayout>
                    <NotesBoard ref={boardRef}>
                        {notesWithPositions.map((note) => (
                            <DraggableStickyNote
                                key={note.id}
                                note={note}
                                boardRef={boardRef}
                                dropZones={dropZones}
                                onDragEnd={handleDragEnd}
                                onNoteClick={setActiveNote}
                                onDropZoneRelease={handleDropZoneRelease}
                            />
                        ))}
                    </NotesBoard>

                    <ActionColumn>
                        <div
                            ref={calendarRef}
                            data-tutorial-id="calendar-zone"
                            style={{ display: "inline-flex" }}
                        >
                            <TaskDropZone
                                isHovered={hoveredZone === "calendar"}
                                isActive={isDraggingNote}
                            />
                        </div>
                        <div
                            ref={trashRef}
                            data-tutorial-id="trash-zone"
                            style={{ display: "inline-flex" }}
                        >
                            <TrashDropZone
                                isHovered={hoveredZone === "trash"}
                                isActive={isDraggingNote}
                            />
                        </div>
                    </ActionColumn>
                </NotesAndButtonsLayout>

                {activeNote && (
                    <StickyNoteOverlay
                        note={activeNote}
                        onChange={updateNote}
                        onSave={handleSaveNote}
                        onCancel={handleCancelNote}
                        onColorChange={handleColorChange}
                    />
                )}

                {pendingDrop?.zone === "trash" && (
                    <DeleteConfirmModal
                        noteTitle={pendingDrop.note.title}
                        onConfirm={confirmTrashDrop}
                        onCancel={() => setPendingDrop(null)}
                    />
                )}

                {pendingDrop?.zone === "calendar" && (
                    <DeleteConfirmModal
                        noteTitle={`Send "${pendingDrop.note.title}" to your planner?`}
                        onConfirm={confirmCalendarDrop}
                        onCancel={() => setPendingDrop(null)}
                    />
                )}

                {showTaskModal && (
                    <TaskConfirmModal
                        tasks={proposedTasks}
                        isLoading={isLoadingTasks}
                        onUpdateTask={handleUpdateTask}
                        onConfirm={handleConfirmTasks}
                        onCancel={handleCancelTasks}
                        onRemoveTask={handleRemoveTask}
                    />
                )}

                {toast && (
                    <ToastWrapper>
                        <ToastTop>
                            ✓ Sent {toast.count} task{toast.count !== 1 ? "s" : ""} to Task List!
                        </ToastTop>
                        <ToastLink onClick={() => navigate(ROUTES.TASKS)}>
                            View My Tasks
                        </ToastLink>
                    </ToastWrapper>
                )}

            </PageWrapper>
        </>
    );
}