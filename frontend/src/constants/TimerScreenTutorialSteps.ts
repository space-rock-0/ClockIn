import type {TutorialStep} from "../types/TutorialStep.ts";

export const TIMER_SCREEN_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "screen-start",
        title: "Active Timer",
        body: "Here, you can time your tasks, either in the free timer mode " +
            "or in the task timer mode. You will grow plants here as you ",
        highlight: "time your sessions!",
        targetSelector: "",
        modalPosition: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "50%", right: "35%" },
    },
    {
        id: "screen-timer",
        title: "Active Timer",
        body: "Click the timer numbers to set a time! For example: If you wanted to  " +
            "set a 25 minute timer, click the timer and type '2500'",
        targetSelector: "[data-tutorial-id='active-timer']",
        modalPosition: { top: "70%", left: "50%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "50%", right: "35%" },
    }
]