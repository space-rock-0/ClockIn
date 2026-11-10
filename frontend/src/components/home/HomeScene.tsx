import { useState } from "react";
import styled, { keyframes } from "styled-components";

import PotObject from "./PotObject";
import PlannerObject from "./PlannerObject";
import ClockObject from "./ClockObject";
import StickyNotesOnDeskObject from "./StickyNotesOnDeskObject";
import HomepageBlankObject from "./HomepageBlankObject";
import ProfileSidebar from "./ProfileSidebar";
import HomeIcon from "../icons/HomeIcon.tsx";
import TaskBookObject from "./TaskBookObject.tsx";
import { HOME_TUTORIAL_STEPS } from "../../constants/HomeTutorialSteps.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useAutoTutorial } from "../../hooks/useAutoTutorial.ts";
import { useUserVisits } from "../../hooks/useUserVisits.ts";
import { useTutorial } from "../../constants/useTutorial.ts";

const pulse = keyframes`
    0%   { box-shadow: 0 0 0 0 rgba(75, 148, 219, 0.5); }
    70%  { box-shadow: 0 0 0 10px rgba(75, 148, 219, 0); }
    100% { box-shadow: 0 0 0 0 rgba(75, 148, 219, 0); }
`;

const QuestionBtn = styled.button`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 500;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: white;
    border: 2.5px solid #4B94DB;
    color: #4B94DB;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(75, 148, 219, 0.25);
    transition: transform 0.15s, background 0.15s;
    animation: ${pulse} 2.5s ease-out infinite;

    &:hover {
        background: #4B94DB;
        color: white;
        transform: scale(1.1);
    }
`;

export const SceneWrapper = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
`;

const HomeBtn = styled.button<{ $open: boolean }>`
    position: fixed;
    top: 16px;
    left: ${p => (p.$open ? `${350 + 8}px` : "16px")};
    z-index: 200;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
`;

export default function HomeScene() {
    const { user } = useAuth();
    const { visits } = useUserVisits();
    const { setSteps, setOnComplete, start } = useTutorial();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const surveyDone = !!localStorage.getItem(`clockin_onboarding_done:${user?.id}`);
    useAutoTutorial(visits?.visited_home, HOME_TUTORIAL_STEPS, "home", surveyDone);

    function handleReplayTutorial() {
        setSteps(HOME_TUTORIAL_STEPS);
        setOnComplete(() => {});
        start();
    }

    return (
        <SceneWrapper>
            <ProfileSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <HomepageBlankObject />
            <PotObject />
            <PlannerObject />
            <ClockObject />
            <StickyNotesOnDeskObject />
            <TaskBookObject />

            <HomeBtn
                data-tutorial="home-btn"
                $open={sidebarOpen}
                onClick={() => setSidebarOpen(prev => !prev)}
            >
                <HomeIcon className="w-[53px] h-[53px]" />
            </HomeBtn>

            {/* ? button — replays the home tutorial */}
            <QuestionBtn onClick={handleReplayTutorial} title="Replay tutorial">
                ?
            </QuestionBtn>
        </SceneWrapper>
    );
}
