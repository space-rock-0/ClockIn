export type StickyNoteTheme = {
    background: string
    fold: string
    text: string
}

export type StickyNoteColor = keyof typeof StickyNoteThemes;
export const StickyNoteThemes: Record<string, StickyNoteTheme> = {
    red: {
        background: "#FFAFB1",
        fold: "#C9595B",
        text: "#C9595B"
    },
    orange: {
        background: "#F6C98A",
        fold: "#B56F39",
        text: "#B56F39"
    },
    yellow: {
        background: "#FFF59A",
        fold: "#989847",
        text: "#989847"
    },
    green: {
        background: "#C0E8AA",
        fold: "#3D9D8B",
        text: "#3D9D8B"
    },
    blue: {
        background: "#AFDBFF",
        fold: "#0E4F87",
        text: "#0E4F87"
    },
    pink: {
        background: "#FFC7E8",
        fold: "#D45884",
        text: "#D45884"
    },
    purple: {
        background: "#C5AFFF",
        fold: "#9143A1",
        text: "#9143A1"
    },
}