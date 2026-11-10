import {StickyNoteHome} from "./pages/StickyNoteHome.tsx";
import Home from "./pages/Home.tsx";
import { ROUTES } from "./constants/Routes";
import { Route, Routes } from "react-router-dom";
import PlannerPage from "./pages/PlannerPage";
import TaskPage from "./pages/TaskPage.tsx";
import TimerEntryPage from "./components/timerComponents/TimerEntryPage.tsx";
import TimerScreen from "./components/timerComponents/TimerScreen.tsx";
import TimerTaskSelectionPage from "./pages/TimerTaskSelectionPage.tsx";
import TimerRouteGuard from "./components/timerComponents/TimerRouteGuard.tsx";
import Settings from "./pages/Settings.tsx";
import Availability from "./pages/Availability.tsx";
import BusyTimes from "./pages/BusyTimes.tsx";
import GardenScene from "./components/gardenComponents/GardenScene.tsx";
import FloatingTaskButton from "./components/navigation/FloatingTaskButton";


export default function Root() {
    return (
        <>
            <FloatingTaskButton />
            <Routes>

                <Route
                    path={ROUTES.HOME}
                    element={<Home/>}
                />

                <Route
                    path={ROUTES.STICKY_NOTES}
                    element={<StickyNoteHome/>}
                />

                <Route
                    path="/planner"
                    element={<PlannerPage />}
                />

                <Route path={ROUTES.GARDEN} element={<GardenScene />} />

                {/*Timer routes*/}
                <Route path={ROUTES.TIMER_ENTRY_PAGE} element={
                    <TimerRouteGuard>
                        <TimerEntryPage />
                    </TimerRouteGuard>
                } />
                <Route path={ROUTES.TIMER_TASK_SELECTION_PAGE} element={
                    <TimerRouteGuard>
                        <TimerTaskSelectionPage />
                    </TimerRouteGuard>
                } />
                <Route path={ROUTES.TIMER_SCREEN} element={<TimerScreen />} />

                <Route
                    path={ROUTES.TASKS}
                    element={<TaskPage/>}
                    />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                <Route path={ROUTES.AVAILABILITY} element={<Availability />} />
                <Route path={ROUTES.BUSY_TIMES} element={<BusyTimes />} />
            </Routes>
        </>
    )
}