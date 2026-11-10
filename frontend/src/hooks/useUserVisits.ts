import { useContext } from "react";
import {UserVisitsContext}  from "../context/UserVisitContext.tsx";

export function useUserVisits() {
    const ctx = useContext(UserVisitsContext);
    if (!ctx) throw new Error("useUserVisits must be used within UserVisitsProvider");
    return ctx;
}