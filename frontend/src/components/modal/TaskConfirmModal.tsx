import type {Task} from "../../types/Task.ts";
import LottieLoading from "../ui/LottieLoading.tsx";
import {
    CancelButton,
    ConfirmButton,
    ModalActions,
    ModalBackdrop,
    ModalCard,
    ModalSubtitle,
    ModalTitle,
    TaskList
} from "./modalStyles.ts";
import ModalTaskEditable from "./ModalTaskEditable.tsx";

interface TaskConfirmModalProps {
    tasks: Task[];
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    onRemoveTask: (modalId: number) => void;
    onUpdateTask: (modalId: number, updated: Task) => void;
}

export default function TaskConfirmModal({ tasks, isLoading, onUpdateTask, onConfirm, onCancel, onRemoveTask }: TaskConfirmModalProps) {
    return (
        <ModalBackdrop onClick={(e) => {e.stopPropagation();}}>
            <ModalCard onClick={e => e.stopPropagation()}>
                <div>
                    <ModalTitle>Confirm Tasks</ModalTitle>
                    <ModalSubtitle>
                        {isLoading
                            ? "Extracting tasks from your note..."
                            : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} — edit before confirming`}
                    </ModalSubtitle>
                </div>

                {isLoading ? (
                    <LottieLoading size={200} />
                ) : (
                    <TaskList>
                        {tasks.map((task, i) => (
                            <ModalTaskEditable
                                key={task._modalId ?? i}
                                task={task}
                                onChange={updated => onUpdateTask(updated._modalId ?? i, updated)}
                                onRemove={() => onRemoveTask(task._modalId ?? i)}
                            />
                        ))}
                    </TaskList>
                )}

                <ModalActions>
                    <CancelButton onClick={onCancel}>Cancel</CancelButton>
                    <ConfirmButton onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Add to List"}
                    </ConfirmButton>
                </ModalActions>
            </ModalCard>
        </ModalBackdrop>
    );
}