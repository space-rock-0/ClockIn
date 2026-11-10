import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./Root.tsx";
import { NotesProvider } from "./context/NoteContext.tsx";
import { TutorialProvider } from "./context/TutorialContext.tsx";
import { PlantProvider } from "./context/PlantProvider";
import { UserVisitsProvider } from "./context/UserVisitContext.tsx";
import TutorialOverlay from "./components/onboardingComponents/TutorialOverlay.tsx";
import OnboardingSurvey from "./components/onboardingComponents/OnboardingSurvey.tsx";
import { useAuth } from "./context/AuthContext.tsx";
import { useTutorial } from "./constants/useTutorial.ts";
import { HOME_TUTORIAL_STEPS } from "./constants/HomeTutorialSteps.ts";

const router = createBrowserRouter([{ path: "*", Component: Root }]);

function OnboardingController() {
    const { user } = useAuth();
    const { setSteps, start } = useTutorial();
    const [surveyed, setSurveyed] = useState(false);

    if (!user) return null;
    // user.onboardingDone comes from Supabase user metadata — works across devices.
    // localStorage is kept as a fast-path cache to avoid a flicker on the same device.
    const needsOnboarding = !surveyed && !user.onboardingDone && !localStorage.getItem(`clockin_onboarding_done:${user.id}`);
    if (!needsOnboarding) return null;

    function handleSurveyComplete() {
        setSurveyed(true);
        setSteps(HOME_TUTORIAL_STEPS);
        setTimeout(start, 400);
    }

    return <OnboardingSurvey userId={user.id} onComplete={handleSurveyComplete} />;
}

export default function App() {
    return (
        <TutorialProvider>
            <TutorialOverlay />
            <UserVisitsProvider>
                <NotesProvider>
                    <PlantProvider>
                        <RouterProvider router={router} />
                    </PlantProvider>
                </NotesProvider>
            </UserVisitsProvider>
            <OnboardingController />
        </TutorialProvider>
    );
}
