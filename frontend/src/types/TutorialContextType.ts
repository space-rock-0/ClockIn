import type {TutorialStep} from './TutorialStep';

export interface TutorialContextType {
    isActive: boolean;
    currentStep: number;
    step: TutorialStep | null;
    totalSteps: number;
    setSteps: (steps: TutorialStep[]) => void;
    setOnComplete: (cb: () => void) => void;
    start: () => void;
    stop: () => void;
    next: () => void;
    prev: () => void;
}