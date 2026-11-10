import styled from "styled-components";

type TaskSplitModalProps = {
    isShown: boolean;
    taskTitle: string;
    taskDescription: string;
    taskDuration: number;
}

const StyledTaskTitle = styled.h2`
    font-size: calc(1px + 0.9vw);
`;

const StyledTaskDescription = styled.p`
    font-size: calc(1px + 0.5vw);
`;

const StyledTaskDuration = styled.p`
    font-size: calc(1px + 0.5vw);
`



export default function TaskSplitModal(props: TaskSplitModalProps) {
    if (props.isShown) {
        return (
            <>
                <StyledTaskTitle>
                    {props.taskTitle}
                </StyledTaskTitle>
                <StyledTaskDescription>
                    {props.taskDescription}
                </StyledTaskDescription>
                <StyledTaskDuration>
                    {props.taskDuration}
                </StyledTaskDuration>
            </>

        )
    }
}