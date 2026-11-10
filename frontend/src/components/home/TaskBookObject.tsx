import styled from "styled-components";
import TaskBookIcon from "../icons/TaskBookIcon";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/Routes";

const Wrapper = styled.div`
    position: absolute;
    left: 18%;
    top: 75%;
    width: 20%;
    transform: scale(1.7);
    cursor: pointer;

    & * {
        pointer-events: none;
    }

    &:hover::after {
        content: "Task List";
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #4B94DB;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 0 8px rgba(255, 255, 255, 1),
        0 0 16px rgba(255, 255, 255, 0.9),
        0 0 32px rgba(255, 255, 255, 0.7),
        0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
`;

const StyledTaskBook = styled(TaskBookIcon)`
    width: 100%;
    height: auto;
    display: block;

    [data-theme="dark"] & path[fill="#4B94DB"] { fill: #272336; stroke: #8b7fd4; }
    [data-theme="dark"] & path[stroke="#4B94DB"] { stroke: #8b7fd4; }
    [data-theme="dark"] & path[fill="#D9D9D9"] { fill: #5c5270; }
    [data-theme="dark"] & path[fill="#F1F1F1"] { fill: #9f95c6; }
`;

const StyledLink = styled(Link)`
    position: absolute;
    inset: 0;
    cursor: pointer;
    z-index: 100;
    pointer-events: all;
`;

export default function TaskBookObject() {
    return (
        <Wrapper data-tutorial="task-book">
            <StyledTaskBook />
            <StyledLink to={ROUTES.TASKS} />
        </Wrapper>
    );
}