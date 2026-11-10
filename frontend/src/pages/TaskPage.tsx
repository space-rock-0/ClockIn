import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";

import { ROUTES } from "../constants/Routes.ts";
import type { Task } from "../types/Task";

import { getTasks, saveTask, deleteTask, updateTask, splitTask } from "../api/taskApi.ts";

import TaskSidebar from "../components/taskComponents/TaskSidebar.tsx";
import BackButton from "../components/navigation/BackButton";
import HomepageBlankIcon from "../components/icons/HomepageBlankIcon";
import NightHomepageIcon from "../components/icons/NightHomepageIcon";
import TutorialButton from "../components/onboardingComponents/TutorialButton.tsx";
import { TASKS_TUTORIAL_STEPS } from "../constants/TaskListTutorialSteps.ts";
import { useAutoTutorial } from "../hooks/useAutoTutorial.ts";
import { useUserVisits } from "../hooks/useUserVisits.ts";
import { useTheme } from "../context/ThemeContext";

export type ViewMode = "list" | "grid";

// ── Page Styled Components ────────────────────────────────────────────────────

const PageBackButton = styled(BackButton)`
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 10;
`;

const PageWrapper = styled.div`
    position: relative;
    min-height: 100vh;
    width: 100%;
`;

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

const Content = styled.div`
    position: relative;
    z-index: 2;
`;

// ── Split Modal Styled Components ─────────────────────────────────────────────

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalBackdrop = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: ${fadeIn} 0.2s ease;
`;

const ModalCard = styled.div`
    background: #ffffff;

    [data-theme="dark"] & {
        background: #9f95c6;
    }

    border-radius: 16px;
    padding: 32px;
    width: min(480px, 90vw);
    box-shadow:
            0 4px 6px rgba(0,0,0,0.05),
            0 20px 60px rgba(0,0,0,0.18);
    animation: ${slideUp} 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const ModalTitle = styled.h2`
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.4;
`;

const ModalTitleHighlight = styled.span`
    color: #3b82f6;
`;

const SliderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const SliderLabel = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #888;
`;

const SliderValue = styled.span`
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
`;

const Slider = styled.input`
    width: 100%;
    accent-color: #3b82f6;
    cursor: pointer;
`;

const SliderHints = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #bbb;
    font-style: italic;
`;

const BlockPreview = styled.div`
    background: #f5f8ff;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.85rem;
    color: #3b82f6;
    text-align: center;
`;

const ModalActions = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
`;

const SplitButton = styled.button`
    background: #1a1a1a;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;

    &:hover {
        background: #333;
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const CancelButton = styled.button`
    background: transparent;
    color: #888;
    border: 1.5px solid #e8e4d8;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;

    &:hover {
        border-color: #bbb;
        color: #555;
    }
`;

// ── Split Task Modal ──────────────────────────────────────────────────────────

interface SplitTaskModalProps {
    task: Task;
    onConfirm: (split: number) => void;
    onCancel: () => void;
}

function SplitTaskModal({ task, onConfirm, onCancel }: SplitTaskModalProps) {
    const maxSplit = Math.floor((task.task_duration ?? 120) / 60);
    const [split, setSplit] = useState(2);
    const blockDuration = Math.floor((task.task_duration ?? 0) / split);

    return (
        <ModalBackdrop>
            <ModalCard onClick={e => e.stopPropagation()}>
                <ModalTitle>
                    Split <ModalTitleHighlight>"{task.title}"</ModalTitleHighlight> into{" "}
                    <ModalTitleHighlight>{split}</ModalTitleHighlight> tasks
                </ModalTitle>

                <SliderWrapper>
                    <SliderLabel>
                        <span>Number of blocks</span>
                        <SliderValue>{split}</SliderValue>
                    </SliderLabel>
                    <Slider
                        type="range"
                        min={2}
                        max={maxSplit}
                        value={split}
                        onChange={e => setSplit(Number(e.target.value))}
                    />
                    <SliderHints>
                        <span>2 blocks</span>
                        <span>{maxSplit} blocks</span>
                    </SliderHints>
                </SliderWrapper>

                <BlockPreview>
                    Each block will be <strong>{blockDuration} minutes</strong>
                </BlockPreview>

                <ModalActions>
                    <CancelButton onClick={onCancel}>Cancel</CancelButton>
                    <SplitButton onClick={() => onConfirm(split)}>Split</SplitButton>
                </ModalActions>
            </ModalCard>
        </ModalBackdrop>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TaskPage() {
    const { isDark } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [splitTargetTask, setSplitTargetTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    useEffect(() => {
        getTasks().then(setTasks);
    }, []);

    // ---------------------------
    // TASK CRUD
    // ---------------------------
    async function handleUpdateTask(updated: Task) {
        setTasks(prev =>
            prev.map(t => (t.id === updated.id ? updated : t))
        );
        await updateTask(updated);
    }

    async function handleCreateTask(newTask: Omit<Task, "id">): Promise<Task> {
        const createdTask = await saveTask(newTask);
        setTasks(prev => [createdTask, ...prev]);
        return createdTask;
    }

    async function handleDeleteTask(taskId: string) {
        await deleteTask(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }

    // ---------------------------
    // SPLIT
    // ---------------------------
    async function handleConfirmSplit(split: number) {
        if (!splitTargetTask?.id) return;
        const newTasks = await splitTask(splitTargetTask.id, split);
        // remove the original task and add the split tasks
        setTasks(prev => [
            ...newTasks,
            ...prev.filter(t => t.id !== splitTargetTask.id),
        ]);
        setSplitTargetTask(null);
    }

    const { visits } = useUserVisits();
    useAutoTutorial(visits?.visited_tasks, TASKS_TUTORIAL_STEPS, "tasks");

    return (
        <PageWrapper>
            {isDark ? <NightBgSVG /> : <DayBgSVG />}
            <BackgroundOverlay />
            <Content>
                <PageBackButton to={ROUTES.HOME} label="Home" />
                <TaskSidebar
                    props={{
                        tasks,
                        mode: "tasklist",
                        onUpdateTask: handleUpdateTask,
                        viewMode,
                    }}
                    onAddTask={async (newTask) => {
                        await handleCreateTask({ ...newTask, can_schedule: false });
                    }}
                    onDeleteTask={handleDeleteTask}
                    onSplitTask={(task) => setSplitTargetTask(task)}
                    onAddToSchedule={(taskId) => {
                        console.log("Add to schedule:", taskId);
                    }}
                    onViewModeChange={setViewMode}
                />
            </Content>

            {splitTargetTask && (
                <SplitTaskModal
                    task={splitTargetTask}
                    onConfirm={handleConfirmSplit}
                    onCancel={() => setSplitTargetTask(null)}
                />
            )}
            <TutorialButton steps={TASKS_TUTORIAL_STEPS} />
        </PageWrapper>
    );
}