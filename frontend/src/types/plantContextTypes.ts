export interface UserPlants {
    [variety: string]: true;
}

export interface PlantContextType {
    plants: UserPlants | null;
    countMap: Record<string, number>;
    firstGrownMap: Record<string, string>;  // variety -> ISO date string
    refetchPlants: () => Promise<void>;
}