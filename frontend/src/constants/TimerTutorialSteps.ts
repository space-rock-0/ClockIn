import type { TutorialStep } from "../types/TutorialStep";

export const TIMER_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "start",
        title: "Study Timer",
        body: "Welcome to the study timer! Here you can set active timers to help you while you" +
            "complete your tasks. You have the options between free and task-based timers, but more on that in " +
            "other steps. As you use our timer, ",
        highlight: "you'll grow a garden of plants!",
        targetSelector: "[data-tutorial-id='timer-start']",
        modalPosition: { top: "30%", left: "70%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", right: "35%" },
        lineCurve: {offsetX: 200, offsetY: 400},
        spotlightOffset: {y: 50}
    },
    {
        id: 'free-timer',
        title: "Study Timer",
        body: "Here, you can use the timer in Free Mode! You can set a timer and complete your tasks ",
        highlight: "on your time!",
        targetSelector: "[data-tutorial-id='free-timer']",
        modalPosition: { top: "30%", left: "45%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", left: "38%" },
        lineCurve: {offsetX: -450}
    },
    {
        id: 'task-timer',
        title: "Study Timer",
        body: "Here, you can use the timer in Task Mode! You can set a timer and complete your tasks either on your own ",
        highlight: "or with our AI powered study suggestions!",
        targetSelector: "[data-tutorial-id='task-timer']",
        modalPosition: { top: "30%", left: "55%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", right: "37%" },
        lineCurve: {offsetX: -550, offsetY:50}
    }

]
