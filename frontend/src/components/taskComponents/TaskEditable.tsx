import { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import type { Task } from "../../types/Task.ts";
import { useDebounce } from "../../hooks/useDebounce.ts";
import WarningIcon from "../icons/WarningIcon.tsx"
import type { ViewMode } from "../../pages/TaskPage.tsx";

// ── Color Map ────────────────────────────────────────────────────────────────

const colors: Record<string, string> = {
    red: "#FFAFB1",
    orange: "#F6C98A",
    yellow: "#FFF59A",
    green: "#C0E8AA",
    blue: "#AFDBFF",
    purple: "#C5AFFF",
    pink: "#FFC7E8",
};

const darkColors: Record<string, string> = {
    red: "#e57373",
    orange: "#ef9c3a",
    yellow: "#c8a800",
    green: "#5aab2e",
    blue: "#2a7fcf",
    purple: "#7c52e0",
    pink: "#e05fa8",
};

const getColorHex = (colorName?: string) =>
    colors[colorName ?? "yellow"] ?? colors["yellow"];

const getDarkColorHex = (colorName?: string) =>
    darkColors[colorName ?? "yellow"] ?? darkColors["yellow"];

// ── Schedulability helpers ────────────────────────────────────────────────────

function getMissingFields(task: Task): Set<"title" | "due_date" | "task_duration"> {
    const missing = new Set<"title" | "due_date" | "task_duration">();
    if (!task.title?.trim()) missing.add("title");
    if (!task.due_date) missing.add("due_date");
    if (!task.task_duration || task.task_duration <= 0) missing.add("task_duration");
    return missing;
}

function computeCanSchedule(task: Task): boolean {
    return getMissingFields(task).size === 0;
}

// ── Duration helpers ──────────────────────────────────────────────────────────

function toHoursMinutes(totalMinutes: number | null | undefined) {
    if (!totalMinutes) return { hours: 0, minutes: 0 };
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function toTotalMinutes(hours: number, minutes: number) {
    return hours * 60 + minutes;
}

// ── New Styled Icons ─────────────────────────────────────────────────────────

const IconSvg = styled.svg`
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  display: block;
`;

const StyledPencil = () => (
    <IconSvg viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </IconSvg>
);

const StyledCheck = () => (
    <IconSvg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
    </IconSvg>
);

// ── Styled Components ─────────────────────────────────────────────────────────

const Container = styled.div<{ isEditing: boolean; $viewMode: ViewMode }>`
    max-width: ${({ $viewMode }) => ($viewMode === "grid" ? "90%" : "70%")};
    display: flex;
    border-radius: 12px;
    margin: ${({ $viewMode }) => ($viewMode === "grid" ? "4px auto" : "1.5% auto")};
    flex-direction: column;
    position: relative;
    background-color: white;
    cursor: ${({ isEditing }) => (isEditing ? "text" : "pointer")};
    transition: border-color 0.15s, box-shadow 0.15s;
    border: 2px solid ${({ isEditing }) => (isEditing ? "#3b82f6" : "lightgray")};
    box-shadow: ${({ isEditing }) =>
    isEditing
        ? "0 0 0 3px rgba(59, 130, 246, 0.2), -3px 3px 10px 0px #b5b5b5"
        : "-3px 3px 10px 0px #b5b5b5"};
    overflow: visible;
`;

const TitleInput = styled.input<{ isEditing: boolean; colorHex: string; hasError: boolean }>`
    background-color: ${({ colorHex }) => colorHex};
    color: black;
    font-weight: bold;
    font-size: 1.15rem;
    margin-left: 1%;
    border: none;
    outline: none;
    padding: 10px 6px;
    width: 100%;
    box-sizing: border-box;
    cursor: ${({ isEditing }) => (isEditing ? "text" : "pointer")};
    user-select: ${({ isEditing }) => (isEditing ? "auto" : "none")};
    border-bottom: ${({ hasError }) => (hasError ? "2px solid #ef4444" : "2px solid transparent")};
`;

const TitleRow = styled.div<{ colorHex: string }>`
    display: flex;
    background-color: ${({ colorHex }) => colorHex};
    width: 100%;
    border-radius: 9px 9px 0 0;
    align-items: center;
`;

const MenuButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #636363;
    font-size: 1.1rem;
    padding: 0 10px;
    flex-shrink: 0;
    position: relative;
    z-index: 11;
    &:hover { color: black; }
`;

const EditToggleButton = styled.button<{ isEditing: boolean; activeColor: string }>`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 12px;
    flex-shrink: 0;
    position: relative;
    z-index: 11;
    color: ${({ activeColor }) => activeColor};
    transition: color 0.15s, transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        transform: scale(1.1);
    }
`;

const ContextMenu = styled.div`
    position: absolute;
    top: 32px;
    right: 0;
    background: #ffffff;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 100;
    min-width: 180px;
    overflow: visible;
    padding-left: 2%;
    padding-right: 2%;
`;

const MenuItem = styled.button<{ danger?: boolean }>`
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 14px;
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ danger }) => (danger ? "#d9534f" : "#333")};
    font-size: 1rem;
    &:hover { background-color: #f5f5f5; }
`;

const ColorMenuItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    cursor: pointer;
    font-size: 1rem;
    color: #333;
    position: relative;
    &:hover { background-color: #f5f5f5; }
`;

const ColorDot = styled.button<{ hex: string }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${({ hex }) => hex};
    border: 1.5px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: transform 0.1s;
    &:hover { transform: scale(1.2); }
`;

const ColorSubmenu = styled.div`
    position: absolute;
    left: 100%;
    top: 0;
    background: #ffffff;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 101;
    padding: 8px;
    display: flex;
    gap: 6px;
`;

const DescriptionTextarea = styled.textarea<{ isEditing: boolean }>`
    min-height: 48px;
    background-color: #ffffff;
    color: #636363;
    border: 1px solid transparent;
    resize: ${({ isEditing }) => (isEditing ? "vertical" : "none")};
    font-size: 1.05rem;
    padding: 4px 6px;
    width: 100%;
    box-sizing: border-box;
    cursor: ${({ isEditing }) => (isEditing ? "text" : "pointer")};
    user-select: ${({ isEditing }) => (isEditing ? "auto" : "none")};
    &:focus {
        outline: ${({ isEditing }) => (isEditing ? "2px solid #d0d0d0" : "none")};
        border-color: ${({ isEditing }) => (isEditing ? "#d0d0d0" : "transparent")};
    }
`;

const FieldRow = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px auto;
    width: 100%;
`;

const RatingRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    margin: 4px auto;
    align-items: start;
`;

const FieldLabel = styled.label<{ hasError?: boolean }>`
    font-size: 0.95rem;
    color: ${({ hasError }) => (hasError ? "#ef4444" : "#888")};
    font-weight: ${({ hasError }) => (hasError ? "600" : "400")};
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 80px;
`;

const FieldInput = styled.input<{ isEditing: boolean; hasError?: boolean }>`
    color: #636363;
    border: 1px solid ${({ hasError }) => (hasError ? "#ef4444" : "#e0e0e0")};
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 1.05rem;
    width: 100%;
    box-sizing: border-box;
    cursor: ${({ isEditing }) => (isEditing ? "text" : "pointer")};
    user-select: ${({ isEditing }) => (isEditing ? "auto" : "none")};
    background-color: ${({ hasError }) => (hasError ? "#fef2f2" : "#ffffff")};
    &:focus {
        outline: ${({ isEditing }) => (isEditing ? "2px solid #d0d0d0" : "none")};
    }
`;

const DurationRow = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const DurationUnit = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
`;

const DurationUnitLabel = styled.span`
    font-size: 0.85rem;
    color: #bbb;
    text-align: center;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 6px;
    margin-top: 2px;
    justify-content: center;
`;

const RadioOption = styled.button<{
    selected: boolean;
    selectedColor: string;
    selectedDark: string;
}>`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid ${({ selected, selectedDark }) => (selected ? selectedDark : "#ccc")};
    background-color: ${({ selected, selectedColor }) => (selected ? selectedColor : "#fff")};
    color: ${({ selected, selectedDark }) => (selected ? selectedDark : "#aaa")};
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    &:hover { border-color: ${({ selectedDark }) => selectedDark}; }
`;

const CollapseButton = styled.button`
    color: #888;
    background: none;
    border: none;
    margin: 0 auto;
    padding: 6px 40px;
    cursor: pointer;
    display: block;
    position: relative;
    z-index: 11;
    font-size: 1.2rem;
    letter-spacing: 4px;
    width: 100%;
    border-top: 1px solid #f0f0f0;
    border-radius: 12px;
    &:hover {
        color: #333;
        background-color: #fafafa;
    }
`;

const CollapsedFieldContainer = styled.div`
    padding-left: 2%;
    padding-right: 2%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const ClickOverlay = styled.div`
    position: absolute;
    inset: 0;
    z-index: 10;
    cursor: pointer;
`;

const RatingHints = styled.div`
    display: flex;
    justify-content: space-between;
    width: 90px;
    margin: 0 auto;
`;

const RatingHint = styled.span`
    font-size: 0.75rem;
    color: #bbb;
    font-style: italic;
`;

// ── Warning badge ─────────────────────────────────────────────────────────────

const WarningBadge = styled.div`
    position: absolute;
    top: -8px;
    left: -8px;
    z-index: 12;
    cursor: default;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
`;

const Tooltip = styled.div`
    position: absolute;
    top: 110%;
    left: 0;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.85rem;
    border-radius: 6px;
    padding: 5px 9px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &::before {
        content: "";
        position: absolute;
        bottom: 100%;
        left: 10px;
        border: 5px solid transparent;
        border-bottom-color: #1a1a1a;
    }
`;

// ── Component ─────────────────────────────────────────────────────────────────

type TaskEditableProps = {
    task: Task;
    isEditable?: boolean;
    initialEditing?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onChange?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onAddToSchedule?: (taskId: string) => void;
    onSplit?: (task: Task) => void;
    viewMode?: ViewMode;
};

export default function TaskEditable({
                                         task,
                                         isEditable = true,
                                         initialEditing = false,
                                         onClick,
                                         onChange,
                                         onDelete,
                                         onSplit,
                                         viewMode = "list",
                                     }: TaskEditableProps) {
    const [collapsed, setCollapsed] = useState<boolean>(viewMode === "grid" ? false : !initialEditing);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCollapsed(viewMode !== "grid");
        }, 0);
        return () => clearTimeout(timer);
    }, [viewMode]);

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [colorSubmenuOpen, setColorSubmenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<boolean>(initialEditing);
    const [local, setLocal] = useState<Task>({ ...task });
    const [showTooltip, setShowTooltip] = useState(false);

    const { hours: initHours, minutes: initMins } = toHoursMinutes(task.task_duration);
    const [durationHours, setDurationHours] = useState(initHours);
    const [durationMinutes, setDurationMinutes] = useState(initMins);

    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const dueDateRef = useRef<HTMLInputElement>(null);
    const isDirty = useRef(false);

    const currentColorHex = getColorHex(local.color);
    const currentDarkHex = getDarkColorHex(local.color);

    // Derived — recomputed every render from local state
    const missingFields = getMissingFields(local);
    const isSchedulable = missingFields.size === 0;

    useDebounce(local, 800, (updatedTask) => {
        if (updatedTask.id && isDirty.current) {
            onChange?.(updatedTask);
        }
    });

    useEffect(() => {
        if (initialEditing) setTimeout(() => titleRef.current?.focus(), 0);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Central update — always recomputes can_schedule
    const updateLocal = (patch: Partial<Task>) => {
        const next = { ...local, ...patch };
        next.can_schedule = computeCanSchedule(next);
        isDirty.current = true;
        setLocal(next);
    };

    const handleColorChange = (colorName: string) => {
        const updated = { ...local, color: colorName };
        updated.can_schedule = computeCanSchedule(updated);
        setLocal(updated);
        isDirty.current = true;
        onChange?.(updated);
        setColorSubmenuOpen(false);
        setMenuOpen(false);
    };

    const handleDurationChange = (hours: number, minutes: number) => {
        setDurationHours(hours);
        setDurationMinutes(minutes);
        updateLocal({ task_duration: toTotalMinutes(hours, minutes) });
    };

    const tooltipText = missingFields.size > 0
        ? `Missing: ${[...missingFields]
            .map(f => f === "task_duration" ? "time to complete" : f.replace("_", " "))
            .join(", ")}`
        : "";

    return (
        <Container ref={containerRef} isEditing={isEditing} $viewMode={viewMode}>
            {!isEditing && <ClickOverlay onClick={onClick} />}

            {/* ── Warning badge — only shown when not schedulable ── */}
            {!isSchedulable && (
                <WarningBadge
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <WarningIcon size={20} />
                    {showTooltip && <Tooltip>{tooltipText}</Tooltip>}
                </WarningBadge>
            )}

            {/* ── Title Row ── */}
            <TitleRow colorHex={currentColorHex}>
                <TitleInput
                    ref={titleRef}
                    isEditing={isEditing}
                    colorHex={currentColorHex}
                    hasError={missingFields.has("title")}
                    value={local.title}
                    readOnly={!isEditing}
                    onChange={(e) => updateLocal({ title: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            setCollapsed(false);
                            setTimeout(() => descriptionRef.current?.focus(), 0);
                        }
                    }}
                    placeholder="Task title"
                />
                {isEditable && (
                    <EditToggleButton
                        isEditing={isEditing}
                        activeColor={currentDarkHex}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) {
                                setIsEditing(false);
                            } else {
                                setIsEditing(true);
                                setCollapsed(false);
                            }
                        }}
                        title={isEditing ? "Done editing" : "Edit task"}
                    >
                        {isEditing ? <StyledCheck /> : <StyledPencil />}
                    </EditToggleButton>
                )}
                {isEditable && (
                    <MenuButton
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                            setColorSubmenuOpen(false);
                        }}
                        title="Options"
                    >
                        ⋮
                    </MenuButton>
                )}
            </TitleRow>

            {/* ── Context Menu ── */}
            {isEditable && menuOpen && (
                <ContextMenu>
                    <ColorMenuItem
                        onMouseEnter={() => setColorSubmenuOpen(true)}
                        onMouseLeave={() => setColorSubmenuOpen(false)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Color
                        <ColorDot
                            hex={currentColorHex}
                            onClick={(e) => {
                                e.stopPropagation();
                                setColorSubmenuOpen((prev) => !prev);
                            }}
                        />
                        {colorSubmenuOpen && (
                            <ColorSubmenu>
                                {Object.entries(colors).map(([name, hex]) => (
                                    <ColorDot
                                        key={name}
                                        hex={hex}
                                        title={name}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleColorChange(name);
                                        }}
                                    />
                                ))}
                            </ColorSubmenu>
                        )}
                    </ColorMenuItem>

                    {(task.task_duration ?? 0) >= 120 && (
                        <MenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(false);
                                onSplit?.(task);
                            }}
                        >
                            Split task
                        </MenuItem>
                    )}

                    <MenuItem
                        danger
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onDelete?.(task.id!);
                        }}
                    >
                        Delete task
                    </MenuItem>
                </ContextMenu>
            )}

            {/* ── Expanded Fields ── */}
            {!collapsed && (
                <CollapsedFieldContainer>
                    <DescriptionTextarea
                        ref={descriptionRef}
                        isEditing={isEditing}
                        value={local.description}
                        readOnly={!isEditing}
                        onChange={(e) => updateLocal({ description: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                dueDateRef.current?.focus();
                            }
                        }}
                        placeholder="Description"
                    />

                    <FieldRow>
                        {/* ── Due Date ── */}
                        <FieldLabel hasError={missingFields.has("due_date")}>
                            Due Date{missingFields.has("due_date") ? " *" : ""}
                            <FieldInput
                                ref={dueDateRef}
                                isEditing={isEditing}
                                hasError={missingFields.has("due_date")}
                                type="datetime-local"
                                value={
                                    local.due_date
                                        ? local.due_date.length === 10
                                            ? local.due_date + "T00:00"
                                            : local.due_date.slice(0, 16)
                                        : ""
                                }
                                readOnly={!isEditing}
                                onChange={(e) => updateLocal({ due_date: e.target.value })}
                            />
                        </FieldLabel>

                        {/* ── Time to Complete ── */}
                        <FieldLabel hasError={missingFields.has("task_duration")}>
                            Time to Complete{missingFields.has("task_duration") ? " *" : ""}
                            <DurationRow>
                                <DurationUnit>
                                    <FieldInput
                                        isEditing={isEditing}
                                        hasError={missingFields.has("task_duration")}
                                        type="number"
                                        min={0}
                                        value={durationHours || ""}
                                        readOnly={!isEditing}
                                        onChange={(e) =>
                                            handleDurationChange(
                                                Math.max(0, Number(e.target.value)),
                                                durationMinutes
                                            )
                                        }
                                        placeholder="0"
                                    />
                                    <DurationUnitLabel>hrs</DurationUnitLabel>
                                </DurationUnit>
                                <DurationUnit>
                                    <FieldInput
                                        isEditing={isEditing}
                                        hasError={missingFields.has("task_duration")}
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={durationMinutes || ""}
                                        readOnly={!isEditing}
                                        onChange={(e) =>
                                            handleDurationChange(
                                                durationHours,
                                                Math.min(59, Math.max(0, Number(e.target.value)))
                                            )
                                        }
                                        placeholder="0"
                                    />
                                    <DurationUnitLabel>min</DurationUnitLabel>
                                </DurationUnit>
                            </DurationRow>
                        </FieldLabel>
                    </FieldRow>

                    {/* ── Importance + Difficulty ── */}
                    <RatingRow>
                        <FieldLabel style={{ alignItems: "center" }}>
                            Importance
                            <RadioGroup>
                                {[1, 2, 3].map((val) => (
                                    <RadioOption
                                        key={val}
                                        selected={local.importance === val}
                                        selectedColor={currentColorHex}
                                        selectedDark={currentDarkHex}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isEditing) return;
                                            updateLocal({ importance: val });
                                        }}
                                        type="button"
                                    >
                                        {val}
                                    </RadioOption>
                                ))}
                            </RadioGroup>
                            <RatingHints>
                                <RatingHint>low</RatingHint>
                                <RatingHint>critical</RatingHint>
                            </RatingHints>
                        </FieldLabel>

                        <FieldLabel style={{ alignItems: "center" }}>
                            Difficulty
                            <RadioGroup>
                                {[1, 2, 3].map((val) => (
                                    <RadioOption
                                        key={val}
                                        selected={local.difficulty === val}
                                        selectedColor={currentColorHex}
                                        selectedDark={currentDarkHex}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isEditing) return;
                                            updateLocal({ difficulty: val });
                                        }}
                                        type="button"
                                    >
                                        {val}
                                    </RadioOption>
                                ))}
                            </RadioGroup>
                            <RatingHints>
                                <RatingHint>easy</RatingHint>
                                <RatingHint>hard</RatingHint>
                            </RatingHints>
                        </FieldLabel>
                    </RatingRow>
                </CollapsedFieldContainer>
            )}

            {/* ── Collapse Toggle ── */}
            <CollapseButton
                onClick={(e) => {
                    e.stopPropagation();
                    setCollapsed((prev) => !prev);
                }}
            >
                {collapsed ? "∨" : "∧"}
            </CollapseButton>
        </Container>
    );
}