import { useNavigate } from "react-router-dom";
import TaskOpenModal from "../modal/TaskOpenModal.tsx"
import styled from "styled-components";
import BackButton from "../navigation/BackButton.tsx";
import { ROUTES } from "../../constants/Routes.ts";
import {TIMER_TUTORIAL_STEPS} from "../../constants/TimerTutorialSteps.ts";
import TutorialButton from "../onboardingComponents/TutorialButton.tsx";
import {useAutoTutorial} from "../../hooks/useAutoTutorial.ts";
import {useUserVisits} from "../../hooks/useUserVisits.ts";

const PageBackButton = styled(BackButton)`
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 1100;
`;

export default function TimerEntryPage() {
    const navigate = useNavigate();
    const { visits } = useUserVisits();
    useAutoTutorial(visits?.visited_timer, TIMER_TUTORIAL_STEPS, "timer");
    console.log("TimerEntryPage mounted");

    return (
        <>
            <PageBackButton to={ROUTES.HOME}/>
            <TaskOpenModal
                onFree={() =>
                    navigate(ROUTES.TIMER_SCREEN, {
                        state: { mode: "free" }
                    })
                }
                onTask={() =>
                    navigate(ROUTES.TIMER_TASK_SELECTION_PAGE)
                }
            />
            <TutorialButton steps={TIMER_TUTORIAL_STEPS} />
        </>
    );
}