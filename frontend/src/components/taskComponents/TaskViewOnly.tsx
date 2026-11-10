import type {Task} from "../../types/Task.ts";
import styled from "styled-components";
import {useState} from "react";

const StyledDiv = styled.div`
    max-width: 80%;
    display: flex;
    flex-direction: column;
`

const StyledTitleBlock = styled.h5`
    background-color: #FFF59A;
    color: black;
    margin-bottom: 0;
`
const CollapseButton = styled.button`
    color: #CFCFCF;
    background: none;
    border: none;
    margin: 0 auto;
    padding: 2%;
`

const StyledDescription = styled.p`
    min-height: 48px;
    background-color: #FFFFFF;
    color: #636363;
`

const StyledField = styled.p`
    background-color: #FFFFFF;
    color: #636363;
`


const StyledAttributes = styled.div`
    display: flex;
    flex-direction: row;
    margin: auto
`


export default function TaskViewOnly({task, onClick}: {task: Task, onClick: () => void}) {
    const [collapsed, setCollapsed] = useState<boolean>(true)

    return (
        <StyledDiv onClick={onClick}>
            <StyledTitleBlock>{task.title}</StyledTitleBlock>
            {!collapsed && (
                <>
                    <StyledDescription>
                        Description: {task.description}
                    </StyledDescription>
                    <StyledAttributes>
                        <StyledField>Importance: {task.importance}
                        </StyledField>
                        <StyledField>Task Duration: {task.task_duration}
                        </StyledField>
                        <StyledField>Due Date: {task.due_date}
                        </StyledField>
                    </StyledAttributes>
                </>
            )}
            <CollapseButton onClick = {() => setCollapsed(!collapsed)}>^</CollapseButton>
        </StyledDiv>
    )
}