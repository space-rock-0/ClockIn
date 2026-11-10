import {createContext} from "react";
import type {PlantContextType} from "../types/plantContextTypes.ts";

export const PlantContext = createContext<PlantContextType | null>(null);
