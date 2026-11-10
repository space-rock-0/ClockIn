import type { TutorialStep } from "../types/TutorialStep";

export const SCHEDULE_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "start",
        title: "Schedule",
        body: "The schedule is where you can create schedules with your tasks easily with a few clicks starting at ",
        highlight: "the 'Create Schedule' button!",
        modalPosition: {top: "50%", left: "50%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        targetSelector: "[data-tutorial-id='schedule']",
    }
]