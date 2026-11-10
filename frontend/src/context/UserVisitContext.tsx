import { createContext, useEffect, useState, type ReactNode } from "react";
import { getUserVisits, markPageVisited, type VisitFlags } from "../api/userVisits.ts";

type Page = "home" | "notes" | "tasks" | "schedule" | "timer" | "garden";

type UserVisitsContextType = {
    visits: VisitFlags | null;
    markVisited: (page: Page) => Promise<void>;
    loading: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const UserVisitsContext = createContext<UserVisitsContextType | null>(null);

export function UserVisitsProvider({ children }: { children: ReactNode }) {
    const [visits, setVisits] = useState<VisitFlags | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserVisits()
            .then((data) => {
                console.log("visits fetched:", data);
                setVisits(data);
            })
            .catch((err) => console.error("visits fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    const markVisited = async (page: Page) => {
        setVisits(prev => prev ? { ...prev, [`visited_${page}`]: true } : prev);
        await markPageVisited(page);
    };

    return (
        <UserVisitsContext.Provider value={{ visits, markVisited, loading }}>
            {children}
        </UserVisitsContext.Provider>
    );
}