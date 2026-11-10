import type {TutorialStep} from "../types/TutorialStep.ts";

export const GARDEN_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "start",
        title: "Your Carden",
        body: "Welcome to your garden! Here, you can scroll through the garden can can see " +
            "all of the plants you've collected as you've ",
        highlight: "worked on tasks with the Study Timer!",
        modalPosition: {top: "30%", left: "70%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        targetSelector: "",

    },
    {
        id: "plant",
        title: "Your Garden",
        body: "Here you will see your plants, if a plant is greyed out, it means " +
            "you haven't found the plant yet. Keep timing tasks to grow",
        highlight:"every kind of plant!",
        modalPosition: {top: "30%", left: "70%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        targetSelector: "[data-tutorial-id='garden-plant']",

    }
]