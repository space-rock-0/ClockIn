import { Navigate } from "react-router-dom";
import { ROUTES } from "../../constants/Routes";
import { getActiveSession } from "../../utils/session.ts";
import type { ReactNode } from "react";

export default function TimerRouteGuard({ children }: { children: ReactNode }) {
    const session = getActiveSession();

    if (session) {
        return <Navigate to={ROUTES.TIMER_SCREEN} replace />;
    }

    return <>{children}</>;
}
