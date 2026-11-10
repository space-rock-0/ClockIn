import styled from "styled-components";
import type { Task } from "../../types/Task.ts";
import TaskEditable from "./TaskEditable.tsx";
import TaskSelectable from "./TaskSelectable.tsx";
import type { TaskSidebarProps } from "./TaskSidebarProps.ts";
import { useState } from "react";
import type { ViewMode } from "../../pages/TaskPage.tsx";
import UploadIcon from "../icons/UploadIcon.tsx";

// ── Styled Components ────────────────────────────────────────────────────────

const TaskContainer = styled.div`
    background-color: #ffffff;
    border-radius: 5px;
    max-width: 95%;
    margin: auto;
    padding-bottom: 2%;
    min-height: 100vh;

    [data-theme="dark"] & {
        background-color: #9f95c6;
    }
`;

const StickyBar = styled.div`
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: #ffffff;
    padding: 10px 12px 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 5px 5px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    [data-theme="dark"] & {
        background-color: #9f95c6;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    flex: 1;
    padding: 4px 10px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    font-size: calc(2px + 1vh);
    font-family: "clother", sans-serif;
    font-style: italic;
    color: #636363;
    outline: none;
    box-sizing: border-box;
    background: #fff;
    &:focus {
        border-color: #aaa;
    }
    &::placeholder {
        color: #ccc;
    }

    [data-theme="dark"] & {
        background: #857bb5;
        color: #f0ecf8;
        border-color: #7a70a8;
    }
`;

const AddButton = styled.button`
    background: #f5f5f5;
    border: 1px solid #999;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 1rem;
    cursor: pointer;
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    &:hover {
        background-color: #e0e0e0;
        border-color: #777;
        color: #333;
    }
`;

const SortSelect = styled.select`
    padding: 4px 8px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    font-size: calc(2px + 1vh);
    font-family: "clother", sans-serif;
    font-style: italic;
    color: #636363;
    background: #fff;
    outline: none;
    cursor: pointer;
    &:focus {
        border-color: #aaa;
    }

    [data-theme="dark"] & {
        background: #857bb5;
        color: #f0ecf8;
        border-color: #7a70a8;
    }
`;

const UploadWrapper = styled.button`
    display: flex;
    align-items: center;
    justify-content: flex-start; /* 🔥 important */

    width: 42px;
    height: 42px;

    background: none;
    border: none;
    cursor: pointer;
    padding: 0 8px;
    flex-shrink: 0;
    overflow: hidden;

    transition: width 0.2s ease;

    &:hover {
        width: 140px; /* expands right */
    }

    svg {
        width: 35px;
        height: 35px;
        flex-shrink: 0;
        display: block;
    }
`;

const UploadLabel = styled.span`
    margin-left: 10px; /* 🔥 this is the magic */
    
    font-size: 0.75rem;
    font-weight: 600;
    color: #4B94DB;
    white-space: nowrap;

    opacity: 0;
    transition: opacity 0.2s ease;

    ${UploadWrapper}:hover & {
        opacity: 1;
    }
`;

// ── View Toggle ───────────────────────────────────────────────────────────────

const ViewToggleWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 3px;
    flex-shrink: 0;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    background: ${({ $active }) => ($active ? "#ffffff" : "transparent")};
    color: ${({ $active }) => ($active ? "#1c4d77" : "#aaa")};
    box-shadow: ${({ $active }) => ($active ? "0 1px 3px rgba(0,0,0,0.12)" : "none")};
    &:hover {
        color: ${({ $active }) => ($active ? "#1c4d77" : "#636363")};
    }
`;

function ListIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="2" y="3.5" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="8" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="12.5" width="14" height="2" rx="1" fill="currentColor" />
        </svg>
    );
}

function GridIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
        </svg>
    );
}

// ── Grid ─────────────────────────────────────────────────────────────────────

const TaskGrid = styled.div<{ $viewMode: ViewMode }>`
    display: ${({ $viewMode }) => ($viewMode === "grid" ? "grid" : "flex")};
    flex-direction: column;
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ $viewMode }) => ($viewMode === "grid" ? "6px" : "0")};
    padding: ${({ $viewMode }) => ($viewMode === "grid" ? "4px" : "0")};

    ${({ $viewMode }) =>
    $viewMode === "grid" &&
    `
        > * {
            width: 100%;
            min-height: 140px;
            box-sizing: border-box;
        }
    `}

    ${({ $viewMode }) =>
    $viewMode === "list" &&
    `
        > * {
            width: 100%;
        }
    `}
`;

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = "none" | "due_date" | "difficulty" | "importance" | "task_duration";

type TaskListProps = TaskSidebarProps & {
    onAddTask?: () => void;
    hideControls?: boolean;
    onOpenUpload?: () => void;

    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function TaskList({
                                     tasks,
                                     selectedTaskIds,
                                     onToggleSelect,
                                     onUpdateTask,
                                     onSelectTask,
                                     onDeleteTask,
                                     onAddToSchedule,
                                     onAddTask,
                                     mode,
                                     onSplitTask,
                                     hideControls = false,
                                     onOpenUpload,
                                     viewMode = "list",
                                     onViewModeChange,
                                 }: TaskListProps) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("none");

    const filteredTasks = (tasks ?? []).filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (sortKey === "none") return 0;
        if (sortKey === "due_date") {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
        }
        return (b[sortKey] ?? 0) - (a[sortKey] ?? 0); // higher = first for importance/difficulty/duration
    });

    return (
        <TaskContainer>
            {!hideControls && (
                <StickyBar>
                    {mode === "tasklist" && onAddTask && (
                        <div data-tutorial-id="add-task">
                            <AddButton onClick={onAddTask} title="Add task">+</AddButton>
                        </div>
                    )}

                    {onOpenUpload && (
                        <UploadWrapper onClick={onOpenUpload} title="Upload Task">
                            <UploadIcon />
                            <UploadLabel>Upload Task</UploadLabel>
                        </UploadWrapper>
                    )}

                    <div data-tutorial-id="search-bar" style={{ flex: 1, minWidth: 0 }}>
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="search tasks..."
                        />
                    </div>
                    <div data-tutorial-id="filters">
                        <SortSelect
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                        >
                            <option value="none">sort by...</option>
                            <option value="due_date">due date</option>
                            <option value="importance">importance</option>
                            <option value="difficulty">difficulty</option>
                            <option value="task_duration">duration</option>
                        </SortSelect>
                    </div>

                    <ViewToggleWrapper>
                        <ToggleBtn
                            $active={viewMode === "list"}
                            onClick={() => onViewModeChange?.("list")}
                            title="List view"
                            aria-label="Switch to list view"
                        >
                            <ListIcon />
                        </ToggleBtn>
                        <ToggleBtn
                            $active={viewMode === "grid"}
                            onClick={() => onViewModeChange?.("grid")}
                            title="Grid view"
                            aria-label="Switch to grid view"
                        >
                            <GridIcon />
                        </ToggleBtn>
                    </ViewToggleWrapper>
                </StickyBar>
            )}

            <TaskGrid $viewMode={viewMode}>
                {sortedTasks.map((task: Task, index: number) => {
                    if (mode === "planner") {
                        return (
                            <TaskSelectable
                                key={task.id}
                                task={task}
                                isSelected={selectedTaskIds?.includes(task.id!)}
                                onClick={() => onToggleSelect?.(task.id!)}
                            />
                        );
                    }

                    return (
                        <TaskEditable
                            key={task.id}
                            task={task}
                            isEditable={mode === "tasklist"}
                            initialEditing={index === 0 && !task.title}
                            isSelected={false}
                            onClick={() => onSelectTask?.(task)}
                            onChange={onUpdateTask}
                            onDelete={onDeleteTask}
                            onAddToSchedule={onAddToSchedule}
                            onSplit={onSplitTask}
                            viewMode={viewMode}
                        />
                    );
                })}
            </TaskGrid>
        </TaskContainer>
    );
}