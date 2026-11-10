// SVG canvas is 4948 wide × 1024 tall
// All x/y coords are in that space — viewBox handles the rest

export type PlantVariety = "sunflower" | "snake_plant" | "tulip" | "monstera" | "bonsai" | "cactus";
export type PlantState = "owned" | "locked" | "empty";

export interface PlantSlot {
    id: string;
    variety: PlantVariety;
    label: string;
    // anchor point in SVG space — bottom-center of where the pot should sit
    svgX: number;
    svgY: number;
    // scale relative to the 1024px tall canvas
    scale: number;
}

export const PLANT_SLOTS: PlantSlot[] = [
    // Left section — sunflower stands alone left of left table (table left post at x=315)
    {
        id: "sunflower",
        variety: "sunflower",
        label: "Sunflower",
        svgX: 190,
        svgY: 940,
        scale: 0.28,
    },
    // Left table — snake plant on left side (table spans x=315 to x=720, shelf top at y=672)
    {
        id: "snake_plant",
        variety: "snake_plant",
        label: "Snake Plant",
        svgX: 430,
        svgY: 672,
        scale: 0.22,
    },
    // Left table — tulip on right side
    {
        id: "tulip",
        variety: "tulip",
        label: "Tulip",
        svgX: 620,
        svgY: 672,
        scale: 0.18,
    },
    // Monstera — big, on floor next to right ladder shelf (shelf left post x=820)
    {
        id: "monstera",
        variety: "monstera",
        label: "Monstera",
        svgX: 1030,
        svgY: 940,
        scale: 0.38,
    },
    // Bonsai — on small center table (table around x=1691-2096, shelf at y=757)
    {
        id: "bonsai",
        variety: "bonsai",
        label: "Bonsai",
        svgX: 1870,
        svgY: 757,
        scale: 0.22,
    },
    // Cactus — on right ladder shelf (shelf right post x=2453, shelf top y=408)
    {
        id: "cactus",
        variety: "cactus",
        label: "Cactus",
        svgX: 2320,
        svgY: 590,
        scale: 0.18,
    },
];