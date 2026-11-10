import styled from "styled-components";
import type { Task } from "../../types/Task.ts";

// ── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div<{ isSelected: boolean }>`
    max-width: 80%;
    display: flex;
    margin: 7% auto;
    flex-direction: column;
    position: relative;
    border: 2px solid ${({ isSelected }) => (isSelected ? "#3b82f6" : "lightgray")};
    box-shadow: ${({ isSelected }) =>
    isSelected ? "0 0 0 3px rgba(59,130,246,0.15), -3px 3px 10px 0px #b5b5b5" : "-3px 3px 10px 0px #b5b5b5"};
    background-color: white;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
`;

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    background-color: #fff59a;
    width: 100%;
`;

const Checkbox = styled.input<{ isSelected: boolean }>`
    margin: 0 6px;
    cursor: pointer;
    accent-color: ${({ isSelected }) => (isSelected ? "#3b82f6" : "#555")};
    flex-shrink: 0;
    position: relative;
    z-index: 11;
`;

const TitleText = styled.p`
    background-color: #fff59a;
    color: black;
    font-weight: bold;
    font-size: 1rem;
    padding: 4px 6px;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    user-select: none;
`;

const CollapsedFieldContainer = styled.div`
    padding-left: 2%;
    padding-right: 2%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const DescriptionText = styled.p`
    min-height: 48px;
    color: #636363;
    font-size: 0.9rem;
    padding: 4px 6px;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    user-select: none;
    white-space: pre-wrap;
`;

const FieldRow = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px auto;
    width: 100%;
`;

const FieldLabel = styled.div`
    font-size: 0.8rem;
    color: #888;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 80px;
`;

const FieldLabelText = styled.span`
    font-size: 0.8rem;
    color: #888;
`;

const FieldValue = styled.p`
    color: #636363;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    padding: 3px 6px;
    font-size: 0.9rem;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    user-select: none;
    background-color: #ffffff;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 6px;
    margin-top: 2px;
    justify-content: flex-start;
`;

const RadioOption = styled.div<{ selected: boolean }>`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid ${({ selected }) => (selected ? "#555" : "#ccc")};
    background-color: ${({ selected }) => (selected ? "#555" : "#fff")};
    color: ${({ selected }) => (selected ? "#fff" : "#888")};
    font-size: 0.8rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
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

    &:hover {
        color: #333;
        background-color: #fafafa;
    }
`;

const ClickOverlay = styled.div`
    position: absolute;
    inset: 0;
    z-index: 10;
    cursor: pointer;
`;

// ── Component ────────────────────────────────────────────────────────────────

type TaskSelectableProps = {
    task: Task;
    isSelected?: boolean;
    onClick?: () => void;
};

import { useState } from "react";

export default function TaskSelectable({
                                           task,
                                           isSelected = false,
                                           onClick,
                                       }: TaskSelectableProps) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <Container isSelected={isSelected}>
            <ClickOverlay onClick={onClick} />

            {/* ── Title Row ── */}
            <TitleRow>
                <Checkbox
                    type="checkbox"
                    checked={isSelected}
                    isSelected={isSelected}
                    onChange={onClick}
                    onClick={e => e.stopPropagation()}
                />
                <TitleText>{task.title || "Untitled task"}</TitleText>
            </TitleRow>

            {/* ── Expanded Fields ── */}
            {!collapsed && (
                <CollapsedFieldContainer>
                    <DescriptionText>
                        {task.description || "No description"}
                    </DescriptionText>

                    <FieldRow>
                        <FieldLabel>
                            <FieldLabelText>Due Date</FieldLabelText>
                            <FieldValue>{task.due_date ?? "—"}</FieldValue>
                        </FieldLabel>

                        <FieldLabel>
                            <FieldLabelText>Duration (min)</FieldLabelText>
                            <FieldValue>{task.task_duration || "—"}</FieldValue>
                        </FieldLabel>
                    </FieldRow>

                    <FieldRow style={{ justifyContent: "flex-start" }}>
                        <FieldLabel style={{ flex: "none" }}>
                            <FieldLabelText>Importance</FieldLabelText>
                            <RadioGroup>
                                {[1, 2, 3].map(val => (
                                    <RadioOption key={val} selected={task.importance === val}>
                                        {val}
                                    </RadioOption>
                                ))}
                            </RadioGroup>
                        </FieldLabel>

                        <FieldLabel style={{ flex: "none" }}>
                            <FieldLabelText>Difficulty</FieldLabelText>
                            <RadioGroup>
                                {[1, 2, 3].map(val => (
                                    <RadioOption key={val} selected={task.difficulty === val}>
                                        {val}
                                    </RadioOption>
                                ))}
                            </RadioGroup>
                        </FieldLabel>
                    </FieldRow>
                </CollapsedFieldContainer>
            )}

            {/* ── Collapse Toggle ── */}
            <CollapseButton
                onClick={e => {
                    e.stopPropagation();
                    setCollapsed(prev => !prev);
                }}
            >
                {collapsed ? "∨" : "∧"}
            </CollapseButton>
        </Container>
    );
}