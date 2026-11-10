import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/Routes";

const PAGE_NAMES: Record<string, string> = {
    [ROUTES.HOME]: "Home",
    [ROUTES.STICKY_NOTES]: "Sticky Notes",
    [ROUTES.PLANNER]: "Planner",
    [ROUTES.TIMER_ENTRY_PAGE]: "Timer",
    [ROUTES.TIMER_TASK_SELECTION_PAGE]: "Timer",
    [ROUTES.TIMER_SCREEN]: "Timer",
    [ROUTES.AVAILABILITY]: "Availability",
    [ROUTES.BUSY_TIMES]: "Busy Times",
    [ROUTES.SETTINGS]: "Settings",
    [ROUTES.GARDEN]: "Garden",
};

const CircleBtn = styled.button`
    position: fixed;
    top: 28px;
    right: 28px;
    z-index: 500;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #4B94DB;
    box-shadow: 0 4px 16px rgba(75, 148, 219, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;

    &:hover {
        background: #2e6abf;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(75, 148, 219, 0.55);
    }

    &:hover::after {
        content: "My Tasks";
        position: absolute;
        right: 60px;
        background: #1a2035;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 6px;
        white-space: nowrap;
        pointer-events: none;
    }
`;

const ReturnPill = styled.button`
    position: fixed;
    top: 28px;
    right: 28px;
    z-index: 500;
    height: 40px;
    padding: 0 18px;
    border-radius: 20px;
    background: #4B94DB;
    box-shadow: 0 4px 16px rgba(75, 148, 219, 0.45);
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    cursor: pointer;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;

    &:hover {
        background: #2e6abf;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(75, 148, 219, 0.55);
    }
`;

const TasksIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="2" width="13" height="18" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.8"/>
        <path d="M8 7h7M8 11h7M8 15h4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="15" y="14" width="6" height="6" rx="1.5" fill="#4B94DB" stroke="white" strokeWidth="1.5"/>
        <path d="M17 17l1 1 2-2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function FloatingTaskButton() {
    const { pathname, state } = useLocation();
    const navigate = useNavigate();

    if (pathname === ROUTES.HOME) return null;

    if (pathname === ROUTES.TASKS) {
        const prevPath = (state as { from?: string } | null)?.from;
        if (!prevPath || prevPath === ROUTES.HOME) return null;
        const prevName = PAGE_NAMES[prevPath] ?? "Previous Page";
        return (
            <ReturnPill onClick={() => navigate(-1)}>
                ← Return to {prevName}
            </ReturnPill>
        );
    }

    return (
        <CircleBtn onClick={() => navigate(ROUTES.TASKS, { state: { from: pathname } })}>
            <TasksIcon />
        </CircleBtn>
    );
}
