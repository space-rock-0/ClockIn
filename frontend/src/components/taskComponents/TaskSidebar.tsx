import styled from "styled-components";
import TaskList from "./TaskList";
import type { TaskSidebarProps } from "./TaskSidebarProps.ts";
import type { Task } from "../../types/Task.ts";
import { useState } from "react";
import TaskConfirmModal from "../modal/TaskConfirmModal.tsx";
import FileUploadModal from "../modal/FileUploadModal.tsx";
import type { ViewMode } from "../../pages/TaskPage.tsx";

// ── Styled Components ────────────────────────────────────────────────────────

const SidebarContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    padding: 12px 16px;
`;

const Heading = styled.h4`
    text-align: center;
    font-size: calc(2px + 3.5vh);
    font-family: "clother", sans-serif;
    font-weight: 700;
    font-style: italic;
    color: white;

    [data-theme="dark"] & {
        color: black;
    }
`;

const SubHeader = styled.h4`
    font-size: calc(2px + 1vh);
    font-family: "clother", sans-serif;
    font-weight: 400;
    font-style: italic;
    color: white;
    margin: 0;
    text-align: center;

    [data-theme="dark"] & {
        color: black;
    }
`;

const ScrollableTaskList = styled.div`
    flex: 1;
    overflow-y: auto;
    width: 100%;
    border-radius: 5px;
    margin: 1% auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
`;

// ── Component ────────────────────────────────────────────────────────────────

type TaskSidebarFullProps = {
    props: TaskSidebarProps & { viewMode?: ViewMode };
    onAddTask: (task: Omit<Task, "id" | "can_schedule">) => Promise<void>;
    onDeleteTask?: (taskId: string) => void;
    onAddToSchedule?: (taskId: string) => void;
    onSplitTask?: (task: Task) => void;
    onViewModeChange?: (mode: ViewMode) => void;
};

export default function TaskSidebar({
    props,
    onAddTask,
    onDeleteTask,
    onAddToSchedule,
    onSplitTask,
    onViewModeChange,
}: TaskSidebarFullProps) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [proposedTasks, setProposedTasks] = useState<Task[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleOpenUpload = () => {
        setShowUploadModal(true);
    };

    const handleAdd = async () => {
        await onAddTask({
            title: "",
            description: "",
            due_date: null,
            task_duration: 0,
            importance: 0,
            difficulty: 0,
            status: "to do",
        });
    };

    const handleConfirm = async () => {
        for (const task of proposedTasks) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _modalId, ...cleanTask } = task;
            console.log("Saving task color:", cleanTask.color); // checking color
            await onAddTask({
                title: cleanTask.title,
                description: cleanTask.description,
                due_date: cleanTask.due_date ?? null,
                task_duration: cleanTask.task_duration ?? 0,
                importance: cleanTask.importance ?? 1,
                difficulty: cleanTask.difficulty ?? 1,
                status: "to do",
                color: cleanTask.color ?? "yellow",
            });
        }
        setShowConfirmModal(false);
        setShowUploadModal(false);
        setProposedTasks([]);
    };

    return (
        <SidebarContainer>
            {/* ── Header ── */}
            <Header>
                <Heading>Your Task List</Heading>
                <SubHeader>things you need to get done...</SubHeader>
            </Header>

            {/* ── Task List ── */}
            <ScrollableTaskList>
                <TaskList
                    tasks={props.tasks ?? []}
                    selectedTaskIds={props.selectedTaskIds}
                    onToggleSelect={props.onToggleSelect}
                    onUpdateTask={props.onUpdateTask}
                    onSelectTask={props.onSelectTask}
                    onDeleteTask={onDeleteTask}
                    onAddToSchedule={onAddToSchedule}
                    onAddTask={handleAdd}
                    mode={props.mode}
                    onSplitTask={onSplitTask}
                    onOpenUpload={handleOpenUpload}
                    viewMode={props.viewMode ?? "list"}       // ← grid/list toggle
                    onViewModeChange={onViewModeChange}       // ← grid/list toggle
                />

                {showUploadModal && (
                    <FileUploadModal
                        onClose={() => setShowUploadModal(false)}
                        onTasksGenerated={(tasks) => {
                            setShowUploadModal(false);
                            setProposedTasks(tasks.map((t, i) => ({ ...t, _modalId: i })));
                            setShowConfirmModal(true);
                        }}
                    />
                )}

                {showConfirmModal && (
                    <TaskConfirmModal
                        tasks={proposedTasks}
                        isLoading={false}
                        onUpdateTask={(_, updated) => {
                            console.log("Updated task color:", updated.color);
                            setProposedTasks(prev =>
                                prev.map(t => t._modalId === updated._modalId ? updated : t)
                            );
                        }}
                        onRemoveTask={(modalId) => {
                            setProposedTasks(prev =>
                                prev.filter(t => t._modalId !== modalId)
                            );
                        }}
                        onConfirm={handleConfirm}
                        onCancel={() => setShowConfirmModal(false)}
                    />
                )}
            </ScrollableTaskList>
        </SidebarContainer>
    );
}