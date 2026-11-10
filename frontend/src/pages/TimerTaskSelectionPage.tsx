import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

import { ROUTES } from "../constants/Routes.ts";
import type { Task } from "../types/Task";

import { getTasks } from "../api/taskApi";
import BackButton from "../components/navigation/BackButton";
import HomepageBlankIcon from "../components/icons/HomepageBlankIcon";
import NightHomepageIcon from "../components/icons/NightHomepageIcon";
import TaskList from "../components/taskComponents/TaskList";
import FreeModeIcon from "../components/icons/FreeModeIcon.tsx";
import TaskModeIcon from "../components/icons/TaskModeIcon.tsx";
import { useTheme } from "../context/ThemeContext";

// ── Background elements — must live OUTSIDE any transformed/filtered parent
//    so that position:fixed children aren't trapped in a sub-stacking context ──

const DayBgSVG = styled(HomepageBlankIcon)`
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    filter: blur(6px);
    transform: scale(1.05);
`;

const NightBgSVG = styled(NightHomepageIcon)`
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    filter: blur(6px);
    transform: scale(1.05);
`;

const BackgroundOverlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 1;
    background: rgba(28, 77, 119, 0.5);

    [data-theme="dark"] & {
        background: rgba(20, 15, 45, 0.5);
    }
`;

// ── Page layout — no transform/filter here so fixed children escape freely ──

const PageWrapper = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
`;

const PageBackButton = styled(BackButton)`
    position: fixed;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 10;
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.97) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const ModalCard = styled.div`
    position: relative;
    z-index: 2;
    background: white;

    [data-theme="dark"] & {
        background: #9f95c6;
    }
    border-radius: 20px;
    width: min(680px, 88vw);
    max-height: 68vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.22);
    animation: ${fadeIn} 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const ModalHeader = styled.div`
    padding: 1.4rem 1.6rem 0.8rem;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
`;

const ModalTitle = styled.h2`
    font-size: 1.3rem;
    font-weight: 700;
    font-style: italic;
    color: #1a1a2e;
    margin: 0 0 0.2rem;
    text-align: center;
`;

const ModalSubtitle = styled.p<{ $active?: boolean }>`
    font-size: ${({ $active }) => ($active ? "1.1rem" : "0.82rem")};
    color: ${({ $active }) => ($active ? "#4B94DB" : "#888")};
    font-weight: ${({ $active }) => ($active ? "700" : "400")};
    margin: 0 0 0.9rem;
    text-align: center;
    transition: all 0.2s ease;
`;

const SearchRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const SearchInput = styled.input`
    flex: 1;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    padding: 0.45rem 0.75rem;
    font-size: 0.85rem;
    outline: none;
    &:focus { border-color: #4B94DB; }
`;

const FilterSelect = styled.select`
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
    font-size: 0.82rem;
    outline: none;
    color: #555;
    cursor: pointer;
    &:focus { border-color: #4B94DB; }
`;

const ModalBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1.2rem 1.2rem;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
`;

const SectionLabel = styled.div`
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #4B94DB;
    margin: 0.75rem 0 0.4rem;
    padding-left: 4px;
`;

const EmptyHint = styled.div`
    font-size: 0.8rem;
    color: #bbb;
    text-align: center;
    padding: 0.75rem 0;
    font-style: italic;
`;

// ── Bottom Action Buttons ─────────────────────────────────────────────────────

const ActionRow = styled.div`
    position: relative;
    z-index: 2;
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    align-items: flex-start;
    animation: ${fadeIn} 0.3s ease;
`;

const ActionCol = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
`;

const ActionButton = styled.button<{ $yellow?: boolean; $active: boolean }>`
    cursor: ${({ $active }) => ($active ? "pointer" : "default")};
    background: ${({ $yellow }) => $yellow ? "#FFF59A" : "#AFDBFF"};
    border: 2.4px solid ${({ $yellow }) => $yellow ? "#FFF59A" : "#AFDBFF"};
    border-radius: 999px;
    padding: 0.65rem 1.6rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    opacity: ${({ $active }) => ($active ? 1 : 0.4)};
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

    &:hover {
        transform: ${({ $active }) => ($active ? "scale(1.08)" : "none")};
        box-shadow: ${({ $active }) => ($active ? "0 0 20px rgba(255,255,255,0.35)" : "none")};
    }
`;

const ActionLabel = styled.span`
    color: #4B94DB;
    font-size: 1.14rem;
    font-weight: 700;
    white-space: nowrap;
`;

const ActionSubText = styled.p<{ $active: boolean }>`
    font-size: 0.9rem;
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0;
    opacity: ${({ $active }) => ($active ? 1 : 0.4)};
    transition: opacity 0.2s ease;
    width: 160px;

    [data-theme="dark"] & {
        color: black;
    }
`;

const IconWrapper = styled.div`
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TimerTaskSelectionPage() {
    const { isDark } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("default");

    const navigate = useNavigate();
    const hasSelection = selectedTask !== null;

    useEffect(() => {
        getTasks().then(setTasks);
    }, []);

    function handleSelectTask(task: Task) {
        setSelectedTask(prev =>
            prev?.id === task.id ? null : task
        );
    }

    const filtered = tasks
        .filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.description ?? "").toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "importance") return (b.importance ?? 0) - (a.importance ?? 0);
            if (sortBy === "difficulty") return (b.difficulty ?? 0) - (a.difficulty ?? 0);
            if (sortBy === "duration") return (b.task_duration ?? 0) - (a.task_duration ?? 0);
            if (sortBy === "due_date") {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            return 0;
        });

    const scheduled = filtered.filter(t => t.status === "scheduled");
    const other = filtered.filter(t => t.status !== "scheduled");

    function handleStart() {
        if (!selectedTask) return;
        navigate("/timer/run", {
            state: { mode: "task", item: selectedTask, hasPlan: false },
        });
    }

    function handleAutomate() {
        if (!selectedTask) return;
        navigate("/timer/run", {
            state: { mode: "task", item: selectedTask, hasPlan: true },
        });
    }

    return (
        <>
            {isDark ? <NightBgSVG /> : <DayBgSVG />}
            <BackgroundOverlay />

            <PageWrapper>
                <PageBackButton to={ROUTES.TIMER_ENTRY_PAGE} />

                <ModalCard>
                    <ModalHeader>
                        <ModalTitle>Pick a Task</ModalTitle>
                        <ModalSubtitle $active={hasSelection}>
                            {hasSelection ? `Selected: ${selectedTask.title}` : "Select a task to focus on"}
                        </ModalSubtitle>

                        <SearchRow>
                            <SearchInput
                                placeholder="Search tasks..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <FilterSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="default">Sort: Default</option>
                                <option value="importance">Sort: Importance</option>
                                <option value="difficulty">Sort: Difficulty</option>
                                <option value="duration">Sort: Duration</option>
                                <option value="due_date">Sort: Due Date</option>
                            </FilterSelect>
                        </SearchRow>
                    </ModalHeader>

                    <ModalBody>
                        {scheduled.length > 0 && (
                            <>
                                <SectionLabel>Scheduled</SectionLabel>
                                <TaskList
                                    tasks={scheduled}
                                    mode="timer"
                                    onSelectTask={handleSelectTask}
                                    hideControls={true}
                                    selectedTaskIds={selectedTask ? [selectedTask.id!] : []}
                                />
                            </>
                        )}

                        {other.length > 0 ? (
                            <TaskList
                                tasks={other}
                                mode="timer"
                                onSelectTask={handleSelectTask}
                                hideControls={true}
                                selectedTaskIds={selectedTask ? [selectedTask.id!] : []}
                            />
                        ) : (
                            <EmptyHint>No tasks found</EmptyHint>
                        )}
                    </ModalBody>
                </ModalCard>

                {/* ── Action Buttons ── */}
                <ActionRow>
                    <ActionCol>
                        <ActionButton $active={hasSelection} onClick={handleStart}>
                            <IconWrapper>
                                <FreeModeIcon/>
                            </IconWrapper>
                            <ActionLabel>Start</ActionLabel>
                        </ActionButton>
                        <ActionSubText $active={hasSelection}>
                            Regular Study Mode
                        </ActionSubText>
                    </ActionCol>

                    <ActionCol>
                        <ActionButton $yellow $active={hasSelection} onClick={handleAutomate}>
                            <IconWrapper>
                                <TaskModeIcon />
                            </IconWrapper>
                            <ActionLabel>Atomize</ActionLabel>
                        </ActionButton>
                        <ActionSubText $active={hasSelection}>
                            Study with an AI-assisted breakdown!
                        </ActionSubText>
                    </ActionCol>
                </ActionRow>

            </PageWrapper>
        </>
    );
}