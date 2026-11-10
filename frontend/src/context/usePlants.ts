import { useContext } from "react";
import { PlantContext } from "./PlantContext";

export function usePlants() {
    const ctx = useContext(PlantContext);
    if (!ctx) throw new Error("usePlants must be used within PlantProvider");
    return ctx;
}