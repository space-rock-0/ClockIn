import type { TutorialStep } from "../types/TutorialStep";

export const STICKY_NOTE_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "start",
        title: "Sticky Notes",
        body: "This is the Sticky Notes page! Here you can jot down a quick thought.",
        highlight: "Press the '+' button to make a new sticky note!",
        targetSelector: "[data-tutorial-id='add-note-btn']",
        modalPosition: { top: "30%", left: "50%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", right: "35%" },
    },
    {
        id: "send",
        title: "Send to Planner",
        body: "Drag a sticky note here to turn your quick thoughts into formal tasks! Our AI tool can extract multiple tasks from a single note.",
        targetSelector: "[data-tutorial-id='calendar-zone']",
        modalPosition: { top: "30%", left: "35%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", right: "53%" },
    },
    {
        id: "delete",
        title: "Delete Notes",
        body: "Drag a sticky note here to delete it. Once deleted, it's gone for good — so be sure before you drop!",
        targetSelector: "[data-tutorial-id='trash-zone']",
        modalPosition: { top: "45%", left: "35%", transform: "translate(-50%, -50%)" },
        beePosition: { top: "18%", right: "53%" },
    },
]