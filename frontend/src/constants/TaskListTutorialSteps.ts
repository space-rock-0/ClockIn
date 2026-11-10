import type { TutorialStep } from "../types/TutorialStep";

export const TASKS_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "start",
        title: "Task List",
        body: "Here is where you can create and manage your tasks!" +
            "You can organize your tasks as you please, you can also schedule tasks!",
        highlight: "Click the '+' button to create a new task!",
        modalPosition: {top: "50%", left: "50%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        targetSelector: "[data-tutorial-id='add-task']",
        lineCurve: {offsetX: 200}
    },
    {
        id: "search-bar",
        title: "Task List",
        body: "You can search for a specific task by its title or description",
        highlight: "using this search bar!",
        modalPosition: {top: "50%", left: "50%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        lineCurve: {offsetX: 200},
        targetSelector: "[data-tutorial-id='search-bar']",
    },
    {
        id: "filters",
        title: "Task List",
        body: "Here you can sort your tasks by a few categories! If you prefer seeing your tasks" +
            "sorted by their due dates or difficulty,",
        highlight: " this is where you can do that!",
        modalPosition: {top: "50%", left: "50%", transform: "translate(-50%, -50%)"},
        beePosition: { top: "39%", right: "39%" },
        lineCurve: {offsetX: 200},
        targetSelector: "[data-tutorial-id='filters']",
    }
]