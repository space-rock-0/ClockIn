export interface TutorialStep {
    id: string;
    title: string;
    body: string;
    highlight?: string;
    targetSelector?: string; // e.g. "[data-tutorial='sticky-notes']" — element to spotlight
    modalPosition: {
        top?: string; bottom?: string;
        left?: string; right?: string;
        transform?: string;
    };
    beePosition: {
        top?: string; bottom?: string;
        left?: string; right?: string;
    };
    lineTarget?: {
        top?: string; bottom?: string;
        left?: string; right?: string;
    };
    lineCurve?: {
        offsetX?: number; // pushes the arc left (-) or right (+)
        offsetY?: number; // pushes the arc up (-) or down (+)
    };
    spotlightOffset?: {
        x?: number;
        y?: number;
    };
}