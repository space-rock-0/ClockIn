import type {Task} from "../../types/Task.ts";
import {useState} from "react";
import WarningIcon from "../icons/WarningIcon.tsx";
import {
    getMissingFields,
    computeCanSchedule,
    toHoursMinutes,
    toTotalMinutes,
    getColorHex,
    getDarkColorHex,
    colors
} from "../../utils/taskHelpers";
import styled from "styled-components";

interface ModalTaskEditableProps {
    task: Task;
    onChange: (updated: Task) => void;
    onRemove: () => void;
}

export default function ModalTaskEditable({ task, onChange , onRemove}: ModalTaskEditableProps) {
    const [local, setLocal] = useState<Task>({ ...task });
    const [colorSubmenuOpen, setColorSubmenuOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const { hours: initHours, minutes: initMins } = toHoursMinutes(task.task_duration);
    const [durationHours, setDurationHours] = useState(initHours);
    const [durationMinutes, setDurationMinutes] = useState(initMins);

    const currentColorHex = getColorHex(local.color);
    const currentDarkHex = getDarkColorHex(local.color);
    const missingFields = getMissingFields(local);
    const isSchedulable = missingFields.size === 0;

    const update = (fields: Partial<Task>) => {
        const updated = { ...local, ...fields };
        updated.can_schedule = computeCanSchedule(updated);
        setLocal(updated);
        onChange(updated);
    };


    const handleColorChange = (colorName: string) => {
        const updated = { ...local, color: colorName };
        updated.can_schedule = computeCanSchedule(updated);
        setLocal(updated);
        onChange(updated);
        setColorSubmenuOpen(false);
        setMenuOpen(false);
    };

    const handleDurationChange = (hours: number, minutes: number) => {
        setDurationHours(hours);
        setDurationMinutes(minutes);
        update({ task_duration: toTotalMinutes(hours, minutes) });
    };

    const tooltipText = missingFields.size > 0
        ? `Missing: ${[...missingFields]
            .map(f => f === "task_duration" ? "time to complete" : f.replace("_", " "))
            .join(", ")}`
        : "";

    return (
        <TaskEditableContainer style={{ position: "relative" }}>
            {!isSchedulable && (
                <WarningBadge
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <WarningIcon size={20} />
                    {showTooltip && <Tooltip>{tooltipText}</Tooltip>}
                </WarningBadge>
            )}

            <TitleRow colorHex={currentColorHex}>
                <TitleInput
                    colorHex={currentColorHex}
                    hasError={missingFields.has("title")}
                    value={local.title}
                    onChange={e => update({ title: e.target.value })}
                    placeholder="Task title"
                />
                <MenuButton
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(prev => !prev);
                        setColorSubmenuOpen(false);
                    }}
                    title="Options"
                >
                    ⋮
                </MenuButton>
                <RemoveButton onClick={onRemove} title="Remove task">✕</RemoveButton>
                {menuOpen && (
                    <ContextMenu>
                        <ColorMenuItem
                            onMouseEnter={() => setColorSubmenuOpen(true)}
                            onMouseLeave={() => setColorSubmenuOpen(false)}
                            onClick={e => e.stopPropagation()}
                        >
                            Color
                            <ColorDot
                                hex={currentColorHex}
                                onClick={e => {
                                    e.stopPropagation();
                                    setColorSubmenuOpen(prev => !prev);
                                }}
                            />
                            {colorSubmenuOpen && (
                                <ColorSubmenu>
                                    {Object.entries(colors).map(([name, hex]) => (
                                        <ColorDot
                                            key={name}
                                            hex={hex}
                                            title={name}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleColorChange(name);
                                            }}
                                        />
                                    ))}
                                </ColorSubmenu>
                            )}
                        </ColorMenuItem>
                    </ContextMenu>
                )}
            </TitleRow>

            <CollapsedFieldContainer>
                <DescriptionTextarea
                    value={local.description}
                    onChange={e => update({ description: e.target.value })}
                    placeholder="Description"
                />

                <FieldRow>
                    <FieldLabel hasError={missingFields.has("due_date")}>
                        Due Date{missingFields.has("due_date") ? " *" : ""}
                        <FieldInput
                            hasError={missingFields.has("due_date")}
                            type="datetime-local"
                            value={
                                local.due_date
                                    ? local.due_date.length === 10
                                        ? local.due_date + "T00:00"
                                        : local.due_date.slice(0, 16)
                                    : ""
                            }
                            onChange={e => update({ due_date: e.target.value || null })}
                        />
                    </FieldLabel>

                    <FieldLabel hasError={missingFields.has("task_duration")}>
                        Time to Complete{missingFields.has("task_duration") ? " *" : ""}
                        <DurationRow>
                            <DurationUnit>
                                <FieldInput
                                    hasError={missingFields.has("task_duration")}
                                    type="number"
                                    min={0}
                                    value={durationHours || ""}
                                    onChange={e =>
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
                                    hasError={missingFields.has("task_duration")}
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={durationMinutes || ""}
                                    onChange={e =>
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

                <RatingRow>
                    <FieldLabel style={{ alignItems: "center" }}>
                        Importance
                        <RadioGroup>
                            {[1, 2, 3].map(val => (
                                <RadioOption
                                    key={val}
                                    selected={local.importance === val}
                                    selectedColor={currentColorHex}
                                    selectedDark={currentDarkHex}
                                    onClick={e => { e.stopPropagation(); update({ importance: val }); }}
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
                            {[1, 2, 3].map(val => (
                                <RadioOption
                                    key={val}
                                    selected={local.difficulty === val}
                                    selectedColor={currentColorHex}
                                    selectedDark={currentDarkHex}
                                    onClick={e => { e.stopPropagation(); update({ difficulty: val }); }}
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
        </TaskEditableContainer>
    );
}

// ─── Modal Task Editable Styled Components ────────────────────────────────────

const TaskEditableContainer = styled.div`
    display: flex;
    flex-direction: column;
    border: 2px solid lightgray;
    box-shadow: -3px 3px 10px 0px #b5b5b5;
    background-color: white;
    border-radius: 4px;
`;

const TitleRow = styled.div<{ colorHex: string }>`
    display: flex;
    background-color: ${({ colorHex }) => colorHex};
    width: 100%;
    border-radius: 2px 2px 0 0;
    align-items: center;
`;

const TitleInput = styled.input<{ colorHex: string; hasError?: boolean }>`
    background-color: ${({ colorHex }) => colorHex};
    color: black;
    font-weight: bold;
    font-size: 1rem;
    border: none;
    outline: none;
    padding: 4px 6px;
    width: 100%;
    box-sizing: border-box;
    cursor: text;
    border-bottom: ${({ hasError }) => (hasError ? "2px solid #ef4444" : "2px solid transparent")};
`;

const MenuButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #636363;
    font-size: 1.1rem;
    padding: 0 6px;
    flex-shrink: 0;
    position: relative;
    z-index: 11;
    &:hover { color: black; }
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
    padding: 4px;
`;

const ColorMenuItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    cursor: pointer;
    font-size: 0.9rem;
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

const CollapsedFieldContainer = styled.div`
    padding: 8px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-sizing: border-box;
`;

const DescriptionTextarea = styled.textarea`
    min-height: 48px;
    background-color: #ffffff;
    color: #636363;
    border: 1px solid transparent;
    resize: vertical;
    font-size: 0.9rem;
    padding: 4px 6px;
    width: 100%;
    box-sizing: border-box;
    cursor: text;
    font-family: inherit;

    &:focus {
        outline: 2px solid #d0d0d0;
        border-color: #d0d0d0;
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
    font-size: 0.8rem;
    color: ${({ hasError }) => (hasError ? "#ef4444" : "#888")};
    font-weight: ${({ hasError }) => (hasError ? "600" : "400")};
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 80px;
`;

const FieldInput = styled.input<{ hasError?: boolean }>`
    background-color: ${({ hasError }) => (hasError ? "#fef2f2" : "#ffffff")};
    color: #636363;
    border: 1px solid ${({ hasError }) => (hasError ? "#ef4444" : "#e0e0e0")};
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
    cursor: text;

    &:focus {
        outline: 2px solid #d0d0d0;
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
    font-size: 0.7rem;
    color: #bbb;
    text-align: center;
`;

const RatingHints = styled.div`
    display: flex;
    justify-content: space-between;
    width: 90px;
`;

const RatingHint = styled.span`
    font-size: 0.6rem;
    color: #bbb;
    font-style: italic;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 6px;
    margin-top: 2px;
    justify-content: center;
`;

const RadioOption = styled.button<{ selected: boolean; selectedColor?: string; selectedDark?: string }>`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid ${({ selected, selectedDark }) => (selected ? (selectedDark ?? "#555") : "#ccc")};
    background-color: ${({ selected, selectedColor }) => (selected ? (selectedColor ?? "#555") : "#fff")};
    color: ${({ selected, selectedDark }) => (selected ? (selectedDark ?? "#fff") : "#aaa")};
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    &:hover { border-color: ${({ selectedDark }) => selectedDark ?? "#555"}; }
`;

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
    font-size: 0.72rem;
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

const RemoveButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    color: #636363;
    font-size: 0.9rem;
    padding: 0 8px;
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.15s, color 0.15s;
    margin-left: 20px;
    &:hover { opacity: 1; color: #d9534f; }
`;
