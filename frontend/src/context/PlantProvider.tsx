import React, { useEffect, useState } from "react";
import { fetchCompletedPlants, fetchFirstGrownDates } from "../api/plantApi";
import { PlantContext } from "./PlantContext";
import type { UserPlants } from "../types/plantContextTypes";

export function PlantProvider({ children }: { children: React.ReactNode }) {
    const [plants, setPlants]           = useState<UserPlants | null>(null);
    const [countMap, setCountMap]       = useState<Record<string, number>>({});
    const [firstGrownMap, setFirstGrownMap] = useState<Record<string, string>>({});

    async function loadPlants() {
        try {
            const [completed, firstGrown] = await Promise.all([
                fetchCompletedPlants(),
                fetchFirstGrownDates(),
            ]);

            const map: UserPlants = {};
            const counts: Record<string, number> = {};
            completed.forEach((p: { variety: string; count: number }) => {
                map[p.variety] = true;
                counts[p.variety] = p.count;
            });

            const dates: Record<string, string> = {};
            firstGrown.forEach((p: { variety: string; first_grown: string }) => {
                dates[p.variety] = p.first_grown;
            });

            setPlants(map);
            setCountMap(counts);
            setFirstGrownMap(dates);
        } catch (e) {
            console.error("Failed to load plants", e);
            setPlants({});
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [completed, firstGrown] = await Promise.all([
                    fetchCompletedPlants(),
                    fetchFirstGrownDates(),
                ]);
                if (cancelled) return;

                const map: UserPlants = {};
                const counts: Record<string, number> = {};
                completed.forEach((p: { variety: string; count: number }) => {
                    map[p.variety] = true;
                    counts[p.variety] = p.count;
                });

                const dates: Record<string, string> = {};
                firstGrown.forEach((p: { variety: string; first_grown: string }) => {
                    dates[p.variety] = p.first_grown;
                });

                setPlants(map);
                setCountMap(counts);
                setFirstGrownMap(dates);
            } catch (e) {
                if (!cancelled) {
                    console.error("Failed to load plants", e);
                    setPlants({});
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <PlantContext.Provider value={{ plants, countMap, firstGrownMap, refetchPlants: loadPlants }}>
            {children}
        </PlantContext.Provider>
    );
}