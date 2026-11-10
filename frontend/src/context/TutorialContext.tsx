import { createContext, useState, useRef, type ReactNode } from "react";
import type { TutorialStep } from "../types/TutorialStep.ts";
import type { TutorialContextType } from "../types/TutorialContextType.ts";

// eslint-disable-next-line react-refresh/only-export-components
export const TutorialContext = createContext<TutorialContextType | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setStepsState] = useState<TutorialStep[]>([]);
    const onCompleteRef = useRef<(() => void) | null>(null);

    const setSteps = (newSteps: TutorialStep[]) => setStepsState(newSteps);

    const setOnComplete = (cb: () => void) => {
        onCompleteRef.current = cb;
    };

    const start = () => {
        console.log("Starting Tutorial");
        setCurrentStep(0);
        setIsActive(true);
    };

    const stop = () => {
        setIsActive(false);
        setCurrentStep(0);
        onCompleteRef.current?.();
        onCompleteRef.current = null;
    };

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            stop();
        }
    };

    const prev = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    return (
        <TutorialContext.Provider value={{
            isActive,
            currentStep,
            step: steps[currentStep] ?? null,
            totalSteps: steps.length,
            setSteps,
            setOnComplete,
            start,
            stop,
            next,
            prev,
        }}>
            {children}
        </TutorialContext.Provider>
    );
}