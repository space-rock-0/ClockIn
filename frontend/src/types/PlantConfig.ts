// src/config/plantConfig.ts

import * as Sunflower from "../assets/plants/sunflower";
import * as Cactus from "../assets/plants/cactus";
import * as Tulip from "../assets/plants/tulip";
import * as SnakePlant from "../assets/plants/snake_plant";
import * as Monstera from "../assets/plants/monstera";
import * as Bonsai from "../assets/plants/bonsai";


export const STAGE_SCALE_DEFAULTS = [0.4, 0.6, 0.7, 0.8, 0.9, 1.0];


export const PLANT_CONFIG = {
    sunflower: {
        name: "Sunflower",
        rarity: "Common",
        stages: [
            Sunflower.PlantStage1,
            Sunflower.PlantStage2,
            Sunflower.PlantStage3,
            Sunflower.PlantStage4,
            Sunflower.PlantStage5,
        ],
    },

    tulip: {
        name: "Tulip",
        rarity: "Common",
        stages: [
            Tulip.PlantStage1,
            Tulip.PlantStage2,
            Tulip.PlantStage3,
            Tulip.PlantStage4,
            Tulip.PlantStage5,
        ],
    },

    snake_plant: {
        name: "Snake Plant",
        rarity: "Common",
        stages: [
            SnakePlant.PlantStage1,
            SnakePlant.PlantStage2,
            SnakePlant.PlantStage3,
            SnakePlant.PlantStage4,
        ],
    },

    monstera: {
        name: "Monstera",
        rarity: "Rare",
        stages: [
            Monstera.PlantStage1,
            Monstera.PlantStage2,
            Monstera.PlantStage3,
            Monstera.PlantStage4,
            Monstera.PlantStage5,
        ],
    },

    bonsai: {
        name: "Bonsai",
        rarity: "Rare",
        stages: [
            Bonsai.PlantStage1,
            Bonsai.PlantStage2,
            Bonsai.PlantStage3,
            Bonsai.PlantStage4,
            Bonsai.PlantStage5,
            Bonsai.PlantStage6,
        ],
    },

    cactus: {
        name: "Cactus",
        rarity: "Rare",
        stages: [
            Cactus.PlantStage1,
            Cactus.PlantStage2,
            Cactus.PlantStage3,
            Cactus.PlantStage4,
            Cactus.PlantStage5,
            Cactus.PlantStage6,
        ],
    },
} as const;

export type PlantVariety = keyof typeof PLANT_CONFIG;