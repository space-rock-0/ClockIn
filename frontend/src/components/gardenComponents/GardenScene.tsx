import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import { PLANT_SLOTS} from "./gardenData";
import {ROUTES} from "../../constants/Routes.ts";
import { usePlants } from "../../context/usePlants.ts";
import type { PlantSlot, PlantState, PlantVariety } from "./gardenData";
import GardenBackground from "./GardenBackground";
import GardenSunflower from "./GardenSunflower";
import GardenTulip from "./GardenTulip";
import GardenSnakePlant from "./GardenSnakePlant";
import GardenMonstera from "./GardenMonstera";
import GardenBonsai from "./GardenBonsai";
import GardenCactus from "./GardenCactus";
import BackButton from "../navigation/BackButton.tsx";
import TutorialButton from "../onboardingComponents/TutorialButton.tsx";
import {GARDEN_TUTORIAL_STEPS} from "../../constants/GardenTutorialSteps.ts";
import {useUserVisits} from "../../hooks/useUserVisits.ts";
import {useAutoTutorial} from "../../hooks/useAutoTutorial.ts";

const Wrapper = styled.div`
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #afdbff;
    cursor: grab;
    &:active { cursor: grabbing; }
    user-select: none;
    overscroll-behavior: none;
`;

const PageBackButton = styled(BackButton)`
    position: fixed;
    top: 1.2rem;
    left: 1rem;
    z-index: 100;
`;

const PLANT_VIEWBOXES: Record<PlantVariety, { w: number; h: number }> = {
    sunflower:   { w: 417,  h: 1257 },
    tulip:       { w: 267,  h: 763  },
    snake_plant: { w: 515,  h: 747  },
    monstera:    { w: 854,  h: 904  },
    bonsai:      { w: 436,  h: 473  },
    cactus:      { w: 384,  h: 448  },
};

const PLANT_COMPONENTS: Record<PlantVariety, () => React.ReactElement> = {
    sunflower: GardenSunflower,
    tulip: GardenTulip,
    snake_plant: GardenSnakePlant,
    monstera: GardenMonstera,
    bonsai: GardenBonsai,
    cactus: GardenCactus,
};

interface PlantSlotSVGProps {
    slot: PlantSlot;
    state: PlantState;
    selected: boolean;
    onSelect: (svgX: number, svgY: number) => void;
    tutorialId?: string; // ✅ optional — only passed to one plant
}

function PlantSlotSVG({ slot, state, selected, onSelect, tutorialId }: PlantSlotSVGProps) {
    const vb = PLANT_VIEWBOXES[slot.variety];
    const PlantContent = PLANT_COMPONENTS[slot.variety];

    const renderH = 1024 * slot.scale;
    const scale = renderH / vb.h;

    return (
        <g
            data-tutorial-id={tutorialId} // ✅ undefined on all others = no attribute rendered
            transform={`
                translate(${slot.svgX}, ${slot.svgY})
                scale(${scale})
                translate(${-vb.w / 2}, ${-vb.h})
            `}
            onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onClick={() => onSelect(slot.svgX, slot.svgY)}
            style={{
                cursor: "pointer",
                pointerEvents: "all",
                opacity:
                    state === "empty" ? 0.15 :
                        state === "locked" ? 0.35 :
                            1,
                filter: selected
                    ? "url(#outlineFilter)"
                    : state === "owned" ? "none" : "grayscale(1)",
            }}
        >
            <PlantContent />
        </g>
    );
}

const SVG_W = 4948;
const SVG_H = 1024;

export default function GardenScene() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; above: boolean; screenH: number } | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { plants: userPlants, countMap, firstGrownMap } = usePlants();

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        return `${mm}/${dd}/${yy}`;
    };

    const drag = useRef({ active: false, startX: 0, startOffset: 0, moved: false });

    const getViewW = useCallback(() => {
        const el = wrapperRef.current;
        if (!el) return window.innerWidth;
        return el.clientWidth;
    }, []);

    const clampOffset = useCallback((v: number) => {
        const viewW = getViewW();
        const viewH = wrapperRef.current?.clientHeight ?? window.innerHeight;
        const vbW = SVG_W * (viewH / SVG_H);
        const maxOffset = Math.max(0, vbW - viewW);
        const svgUnitsPerPx = SVG_W / vbW;
        return Math.max(0, Math.min(v, maxOffset * svgUnitsPerPx));
    }, [getViewW]);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const viewH = el.clientHeight;
            const vbW = SVG_W * (viewH / SVG_H);
            const svgUnitsPerPx = SVG_W / vbW;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            setOffsetX(prev => clampOffset(prev + delta * svgUnitsPerPx));
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [clampOffset]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("a, button")) return;
        drag.current = { active: true, startX: e.clientX, startOffset: offsetX, moved: false };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [offsetX]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.startX;
        if (Math.abs(dx) > 6) drag.current.moved = true;
        if (!drag.current.moved) return;
        const viewH = wrapperRef.current?.clientHeight ?? window.innerHeight;
        const vbW = SVG_W * (viewH / SVG_H);
        const svgUnitsPerPx = SVG_W / vbW;
        setOffsetX(clampOffset(drag.current.startOffset - dx * svgUnitsPerPx));
    }, [clampOffset]);

    const onPointerUp = useCallback(() => {
        drag.current.active = false;
        drag.current.moved = false;
    }, []);

    const getState = (slot: PlantSlot): PlantState => {
        if (!userPlants) return "empty";
        if (userPlants[slot.variety]) return "owned";
        return "locked";
    };

    const handleSelect = (id: string, svgX: number, svgY: number) => {
        setSelectedId(prev => {
            if (prev === id) {
                setTooltipPos(null);
                return null;
            }

            const el = wrapperRef.current;
            if (el) {
                const viewH = el.clientHeight;
                const pxPerSvgUnit = viewH / SVG_H;

                const slot = PLANT_SLOTS.find(s => s.id === id);
                const renderedH = slot ? 1024 * slot.scale * pxPerSvgUnit : 0;

                const screenX = (svgX - offsetX) * pxPerSvgUnit;

                const screenBaseY = svgY * pxPerSvgUnit;
                const screenTopY = screenBaseY - renderedH;
                const isAboveHalf = screenTopY < viewH * 0.5;

                setTooltipPos({
                    x: screenX,
                    y: isAboveHalf ? screenBaseY : screenTopY,
                    above: !isAboveHalf,
                    screenH: viewH,
                });
            }

            return id;
        });
    };

    const selectedSlot = PLANT_SLOTS.find(s => s.id === selectedId);
    const selectedState = selectedSlot ? getState(selectedSlot) : null;
    const { visits } = useUserVisits();
    useAutoTutorial(visits?.visited_garden, GARDEN_TUTORIAL_STEPS, "garden");

    return (
        <Wrapper
            ref={wrapperRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <PageBackButton to={ROUTES.HOME} />

            {/* Tooltip */}
            {selectedSlot && tooltipPos && (() => {
                const screenH = tooltipPos.screenH;
                const offset = screenH * 0.04;
                const top = tooltipPos.above
                    ? tooltipPos.y - offset - 90
                    : tooltipPos.y + offset;

                return (
                    <div style={{
                        position: "absolute",
                        top,
                        left: tooltipPos.x,
                        transform: "translateX(-50%)",
                        background: "white",
                        borderRadius: 20,
                        padding: "14px 36px 14px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                        boxShadow: "0 4px 24px rgba(75,148,219,0.22)",
                        zIndex: 50,
                        animation: "fadeUp 0.2s ease",
                        minWidth: 180,
                        pointerEvents: "auto",
                    }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#4B94DB" }}>
                            {selectedSlot.label}
                        </span>
                        {selectedState === "locked" && (
                            <span style={{ fontSize: 13, color: "#4B94DB", opacity: 0.5 }}>
                                Not yet found 🔒
                            </span>
                        )}
                        {selectedState === "owned" && (
                            <>
                                <span style={{ fontSize: 13, color: "#4B94DB" }}>
                                    Grown <strong>{countMap[selectedSlot.variety] ?? 0}</strong> time{(countMap[selectedSlot.variety] ?? 0) !== 1 ? "s" : ""}
                                </span>
                                {firstGrownMap[selectedSlot.variety] && (
                                    <span style={{ fontSize: 12, color: "#4B94DB", opacity: 0.6 }}>
                                        First grown {formatDate(firstGrownMap[selectedSlot.variety])}
                                    </span>
                                )}
                            </>
                        )}
                        <button
                            onClick={() => { setSelectedId(null); setTooltipPos(null); }}
                            style={{
                                position: "absolute", top: 8, right: 10,
                                background: "none", border: "none",
                                cursor: "pointer", color: "#4B94DB",
                                fontSize: 16, opacity: 0.4, lineHeight: 1,
                            }}
                        >×</button>
                    </div>
                );
            })()}

            <svg
                style={{ width: "auto", height: "100%", transition: "none", display: "block" }}
                viewBox={`${offsetX} 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="xMinYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="g_bg" x1="2676" y1="-897" x2="2676" y2="1655.5" gradientUnits="userSpaceOnUse">
                        <stop offset="0.294576" stopColor="#AFDBFF"/>
                        <stop offset="0.858336" stopColor="white"/>
                    </linearGradient>
                    <linearGradient id="g_sun1" x1="3765.58" y1="194.976" x2="4288.77" y2="933.899" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="g_sun2" x1="4075.48" y1="92.6028" x2="4642.8" y2="672.264" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="g_sun3" x1="3093.62" y1="139.976" x2="2570.44" y2="878.899" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="g_sun4" x1="2783.72" y1="37.6028" x2="2216.4" y2="617.264" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="g_sun5" x1="352.583" y1="186.698" x2="875.766" y2="925.622" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="g_sun6" x1="662.483" y1="82.6028" x2="1229.8" y2="662.264" gradientUnits="userSpaceOnUse">
                        <stop offset="0.572115" stopColor="#FFF59A"/>
                        <stop offset="1" stopColor="#FFFBD6" stopOpacity="0"/>
                    </linearGradient>
                    <clipPath id="gardenClip">
                        <rect width="4948" height="1024" fill="white"/>
                    </clipPath>
                    <filter id="outlineFilter" x="-10%" y="-10%" width="120%" height="120%">
                        <feMorphology in="SourceAlpha" operator="dilate" radius="8" result="expanded"/>
                        <feFlood floodColor="white" result="color"/>
                        <feComposite in="color" in2="expanded" operator="in" result="outline"/>
                        <feMerge>
                            <feMergeNode in="outline"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <GardenBackground />

                {PLANT_SLOTS.map((slot, i) => (
                    <PlantSlotSVG
                        key={slot.id}
                        slot={slot}
                        state={getState(slot)}
                        selected={selectedId === slot.id}
                        onSelect={(svgX, svgY) => handleSelect(slot.id, svgX, svgY)}
                        tutorialId={i === 0 ? "garden-plant" : undefined} // ✅ only the first plant gets the spotlight
                    />
                ))}
            </svg>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
            <TutorialButton steps={GARDEN_TUTORIAL_STEPS} />
        </Wrapper>
    );
}