import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../navigation/BackButton.tsx";
import { ROUTES } from "../../constants/Routes.ts";
import { createTimerSession, generateWorkflow } from "../../api/timerApi.ts";
import type { TimerSession } from "../../types/TimerSession.ts";
import digital7 from "../../assets/fonts/digital-7.ttf";
import type { ScheduleBlock } from "../../types/ScheduleBlock.ts";
import type { Task } from "../../types/Task.ts";
import {deleteTask, getTask, updateTaskStatus} from "../../api/taskApi.ts";
import { fetchActivePlant, growPlant, fetchCompletedPlants  } from "../../api/plantApi.ts";
import TaskEditable from "../taskComponents/TaskEditable.tsx";
import { PLANT_CONFIG, type PlantVariety } from "../../types/PlantConfig.ts";
import {PlantVisual} from "../plantComponents/PlantVisual.tsx";
import PlantRevealSequence from "../plantComponents/PlantRevealSequence";
import PlantStageAnimator from "../plantComponents/PlantStageAnimator.tsx";
import { usePlants } from "../../context/usePlants.ts";
import TutorialButton from "../onboardingComponents/TutorialButton.tsx";                  
import { TIMER_SCREEN_TUTORIAL_STEPS } from "../../constants/TimerScreenTutorialSteps.ts"; 
import { useUserVisits } from "../../hooks/useUserVisits.ts";                              
import { useAutoTutorial } from "../../hooks/useAutoTutorial.ts";                          

/* ─────────────────────────────────────────
TYPES
───────────────────────────────────────── */

type Status = "idle" | "running" | "paused";

type PlantEarned = {
    variety: string;
    is_new: boolean;
};

interface LocationState {
    mode?: "task" | "free";
    item?: Task | ScheduleBlock | null;
    hasPlan?: boolean;
}

interface Session {
    startTime: number;
    lastActive: number;
    paused: boolean;
    activeTabId?: string;
    endTime?: number;
    remainingOnPause?: number;
    totalPausedMs?: number;
    pausedAt?: number;
    hasStartedWork?: boolean;
    currentStepIndex?: number;
    stepElapsedSecs?: number;
}

interface WorkflowStep {
    label: string;
    duration_seconds: number;
}

interface PersistedContext {
    mode: "task" | "free";
    item: Task | ScheduleBlock | null;
    hasPlan: boolean;
    savedAt: number;
}

interface PersistedWorkflow {
    taskId: string;
    steps: WorkflowStep[];
    isPomodoro: boolean;
    savedAt: number;
}

interface SummaryData {
    active_seconds?: number;
    plantsEarned?: number;
    plantsEarnedList?: PlantEarned[];
    [key: string]: unknown;
}

type CompletedPlant = {
    variety: string;
    count: number;
};

/* ═══════════════════════════════════════════════════════
   SESSION ENGINE
═══════════════════════════════════════════════════════ */

const TAB_ID = (() => {
    const existing = sessionStorage.getItem("tabId");
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem("tabId", id);
    return id;
})();

function loadSession(): Session | null {
    const raw = localStorage.getItem("activeSession");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function saveSession(session: Session) {
    localStorage.setItem("activeSession", JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem("activeSession");
}

const CONTEXT_KEY  = "timerContext";
const WORKFLOW_KEY = "timerWorkflow";

function saveContext(ctx: PersistedContext) {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

function loadContext(): PersistedContext | null {
    try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) ?? "null"); }
    catch { return null; }
}

function clearContext() { localStorage.removeItem(CONTEXT_KEY); }

function saveWorkflow(data: PersistedWorkflow) {
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(data));
}

function loadWorkflow(taskId: string): PersistedWorkflow | null {
    try {
        const data: PersistedWorkflow = JSON.parse(
            localStorage.getItem(WORKFLOW_KEY) ?? "null"
        );
        if (!data) return null;
        if (data.taskId !== taskId) return null;
        if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) return null;
        return data;
    } catch { return null; }
}

function clearWorkflow() { localStorage.removeItem(WORKFLOW_KEY); }

function clearAll() {
    clearSession();
    clearContext();
    clearWorkflow();
}

function isController(session: Session | null): boolean {
    if (!session) return true;
    return !session.activeTabId || session.activeTabId === TAB_ID;
}

function claimControl(session: Session): Session {
    session.activeTabId = TAB_ID;
    saveSession(session);
    return session;
}

function computeActiveSeconds(session: Session, now: number): number {
    const totalPausedMs = session.totalPausedMs ?? 0;
    const currentPauseMs = session.pausedAt ? (now - session.pausedAt) : 0;
    return Math.max(0, Math.floor((now - session.startTime - totalPausedMs - currentPauseMs) / 1000));
}

type ResumeAction = "fresh" | "continue" | "reuse_prompt" | "force_end";

interface MountResolution {
    session: Session | null;
    resumeAction: ResumeAction;
    timerStatus: Status;
    timerSeconds: number;
    timerDigits: string;
    isOwner: boolean;
}

function resolveSessionOnMount(): MountResolution {
    const existing = loadSession();
    const now = Date.now();

    if (!existing) {
        return {
            session: null,
            resumeAction: "fresh",
            timerStatus: "idle",
            timerSeconds: 0,
            timerDigits: "000000",
            isOwner: true,
        };
    }

    const gapMs = now - (existing.lastActive ?? existing.startTime);
    const gapHours = gapMs / (1000 * 60 * 60);

    let timerStatus: Status = "idle";
    let timerSeconds = 0;
    let timerDigits = "000000";

    if (existing.paused && existing.remainingOnPause != null) {
        timerStatus = "paused";
        timerSeconds = existing.remainingOnPause;
        timerDigits = secondsToDigits(timerSeconds);
    } else if (!existing.paused && existing.endTime != null) {
        const remaining = Math.ceil((existing.endTime - now) / 1000);
        if (remaining > 0) {
            timerStatus = "running";
            timerSeconds = remaining;
        } else {
            delete existing.endTime;
            saveSession(existing);
            timerStatus = "idle";
        }
    }

    const owner = isController(existing);

    let resumeAction: ResumeAction = "continue";
    if (gapHours <= 2) {
        existing.lastActive = now;
        if (owner) existing.activeTabId = TAB_ID;
        saveSession(existing);
        resumeAction = "continue";
    } else if (gapHours <= 8) {
        resumeAction = "reuse_prompt";
    } else {
        resumeAction = "force_end";
    }

    return { session: existing, resumeAction, timerStatus, timerSeconds, timerDigits, isOwner: owner };
}

/* ═══════════════════════════════════════════════════════
   TIMER ENGINE
═══════════════════════════════════════════════════════ */

const DIGIT_COUNT = 6;

function digitsToSeconds(digits: string): number {
    const padded = digits.padStart(DIGIT_COUNT, "0");
    const h = parseInt(padded.slice(0, 2), 10);
    const m = parseInt(padded.slice(2, 4), 10);
    const s = parseInt(padded.slice(4, 6), 10);
    return h * 3600 + m * 60 + s;
}

function secondsToDigits(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, "0")}${m.toString().padStart(2, "0")}${s.toString().padStart(2, "0")}`;
}

function formatDigits(digits: string): { h: string; mm: string; ss: string } {
    const padded = digits.padStart(DIGIT_COUNT, "0");
    return {
        h:  padded.slice(0, 2).replace(/^0/, "") || "0",
        mm: padded.slice(2, 4),
        ss: padded.slice(4, 6),
    };
}

function formatSeconds(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatHMS(total: number) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return {
        h: h.toString().padStart(2, "0"),
        m: m.toString().padStart(2, "0"),
        s: s.toString().padStart(2, "0"),
    };
}

function formatStepDuration(s: number): string {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

function getTaskId(item: Task | ScheduleBlock): string | undefined {
    return "task_id" in item ? (item as ScheduleBlock).task_id : (item as Task).id;
}

/* ═══════════════════════════════════════════════════════
   SYNC ENGINE
═══════════════════════════════════════════════════════ */

const SESSION_BEACON_URL = "/api/timer-sessions/beacon";

function beaconSession(payload: object) {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon) {
        navigator.sendBeacon(SESSION_BEACON_URL, blob);
    }
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */

const GlobalFont = createGlobalStyle`
    @font-face {
        font-family: 'Digital7';
        src: url(${digital7}) format('truetype');
        font-weight: normal;
        font-style: normal;
    }
`;

const Outer = styled.div`
    width: 100vw;
    height: 100vh;
    background: #4B94DB;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const SkyBackground = styled.div`
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    margin: 0;
`;

const scrollSky = keyframes`
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
`;

const SkyScroller = styled.div`
    display: flex;
    width: 200%;
    height: 100%;
    animation: ${scrollSky} 120s linear infinite;
    will-change: transform;
`;

const SkyTile = styled.div`
    width: 100%;
    height: 100%;
    background-image: url('/timer_sky.svg');
    background-size: cover;
    background-repeat: no-repeat;
    flex-shrink: 0;
`;

const Frame = styled.div`
    position: relative;
    width: 90%;
    height: 100%;
    border: 40px solid #F1F1F1;
    border-top: none;
    border-bottom: none;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Window = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: transparent;
`;

const Sill = styled.div`
    position: absolute;
    bottom: 0;
    width: 95%;
    z-index: 10;
    &::before {
        content: "";
        display: block;
        width: 100%;
        height: 28px;
        border-radius: 8px 8px 0 0;
        background: #F1F1F1;
    }
    &::after {
        content: "";
        display: block;
        width: 100%;
        height: 20px;
        background: #F1F1F1;
        border-radius: 0;
    }
`;

const Main = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 130px;
    position: relative;
    z-index: 4;
`;

const TaskCompleteGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 480px;
`;

const TaskCompleteOption = styled.button<{ $primary?: boolean }>`
    background: ${({ $primary }) => $primary ? "#FFF59A" : "rgba(255,255,255,0.12)"};
    border: 2px solid ${({ $primary }) => $primary ? "#FFF59A" : "rgba(255,255,255,0.4)"};
    border-radius: 16px;
    padding: 1.2rem 1rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.15s, box-shadow 0.15s;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }
    &:active { transform: scale(0.97); }
`;

const TaskCompleteOptionTitle = styled.div<{ $primary?: boolean }>`
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ $primary }) => $primary ? "#14406C" : "white"};
`;

const TaskCompleteOptionDesc = styled.div<{ $primary?: boolean }>`
    font-size: 0.75rem;
    color: ${({ $primary }) => $primary ? "#2a6096" : "rgba(255,255,255,0.65)"};
    text-align: center;
    line-height: 1.5;
`;

const OverlayTaskTitle = styled.p`
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    margin: 0;
    font-style: italic;
    text-align: center;
    max-width: 360px;
`;

const TimerInputRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0;
    outline: none;
    font-family: 'Digital7', monospace;
    font-size: clamp(5rem, 14vw, 10rem);
    color: rgba(255,255,255,0.62);
    text-shadow: 0 0 10px rgba(255,255,255,0.2);
    margin-bottom: 0.5rem;
    letter-spacing: 0.02em;
`;

const DigitGroup = styled.span<{ $active?: boolean }>`
    color: inherit;
    opacity: 1;
`;

const Colon = styled.span`
    color: inherit;
    opacity: 0.6;
    margin: 0 0.08em;
`;

const TimeDisplay = styled.div`
    font-family: 'Digital7', monospace;
    font-size: clamp(5rem, 14vw, 10rem);
    color: rgba(255,255,255,0.62);
    text-shadow: 0 0 10px rgba(255,255,255,0.2);
    margin-bottom: 0.75rem;
    letter-spacing: 0.02em;
`;

const Controls = styled.div`
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
`;

const Btn = styled.button`
    padding: 0.7rem 1.6rem;
    border-radius: 10px;
    border: 2px solid rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(8px);
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    color: white;
    letter-spacing: 0.04em;
    transition: background 0.15s, transform 0.1s;
    &:active { transform: scale(0.95); }
    &:hover { background: rgba(255,255,255,0.3); }
`;

const EndSessionButton = styled.button`
    position: absolute;
    top: 1.2rem;
    left: 4rem;
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1.5px solid rgba(255,80,80,0.8);
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(6px);
    cursor: pointer;
    color: rgba(255,100,100,1);
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    z-index: 10;
    transition: background 0.15s;
    &:hover { background: rgba(255,80,80,0.15); }
`;

const PageBackButton = styled(BackButton)`
    position: absolute;
    top: 1.2rem;
    left: 1rem;
    z-index: 10;
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(20, 40, 80, 0.35);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
`;

const OverlayContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1.5rem;
    color: white;
`;

const PrimaryBtn = styled.button`
    padding: 0.96rem 2.4rem;
    border-radius: 999px;
    border: none;
    background: #FFF59A;
    color: #14406C;
    font-weight: 600;
    font-size: 1.14rem;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.15s;
    &:hover { opacity: 0.9; }
    &:active { transform: scale(0.96); }
`;

const SecondaryBtn = styled.button`
    padding: 0.6rem 1.6rem;
    border-radius: 999px;
    border: 3px solid #AFDBFF;
    background: white;
    color: #0E4F87;
    font-size: 0.9rem;
    cursor: pointer;
`;

const OverlayTitle = styled.h2`
    font-size: clamp(1.4rem, 2rem, 3rem);
    font-weight: 600;
    letter-spacing: 0.03em;
    margin: 0;
`;

const OverlayBtn = styled.button`
    padding: 0.7rem 1.4rem;
    border-radius: 10px;
    border: 2px solid #1a1a2e;
    background: white;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    color: #1a1a2e;
    transition: background 0.15s, transform 0.1s;
    &:active { transform: scale(0.95); }
    &:hover { background: #f0f4ff; }
`;

const SummaryCard = styled.div`
    background: #F5F5F5;
    border-radius: 20px;
    padding: 2.8rem 2.2rem;
    width: 460px;
    max-width: 92vw;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
`;

const SummaryTitle = styled.h2`
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0;
`;

const SummarySubtitle = styled.p`
    font-size: 0.9rem;
    color: #555;
    margin-top: 0.4rem;
    margin-bottom: 1.5rem;
`;

const PlantContainer = styled.div`
    position: absolute;
    bottom: 45px;
    left: 50%;
    transform: translateX(-50%);
    height: clamp(140px, 22vw, 220px);
    max-height: 35%;
    width: auto;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
`;

const TimeBox = styled.div`
    background: #EAEAEA;
    border-radius: 16px;
    padding: 1.8rem 1.4rem;
    margin: 1.8rem 0;
    font-family: 'Digital7', monospace;
    font-size: 3.6rem;
    letter-spacing: 0.08em;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ButtonStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    margin-top: 1.5rem;
`;

const BlockedBanner = styled.div`
    position: absolute;
    top: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.7);
    color: white;
    text-align: center;
    padding: 0.5rem 1rem;
    font-size: 0.82rem;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    backdrop-filter: blur(4px);
    button {
        background: white;
        color: black;
        border: none;
        border-radius: 6px;
        padding: 0.2rem 0.7rem;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.78rem;
    }
`;

const Sidebar = styled.div<{ $open: boolean }>`
    position: absolute;
    top: 0; right: 0;
    height: 100%;
    width: 500px;
    background: #EFEFEF;
    backdrop-filter: blur(12px);
    color: #1a1a2e;
    transform: translateX(${({ $open }) => ($open ? "0" : "100%")});
    transition: transform 0.3s ease;
    z-index: 15;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    box-sizing: border-box;
    overflow-y: hidden;
`;

const SidebarHandle = styled.button<{ $open: boolean }>`
    position: absolute;
    top: 50%;
    right: ${({ $open }) => ($open ? "500px" : "0px")};
    transform: translateY(-50%);
    transition: right 0.3s ease;
    z-index: 16;
    width: 22px;
    height: 56px;
    background: #F1F1F1;
    border: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    &::after {
        content: "";
        display: block;
        width: 6px; height: 6px;
        border-left: 2px solid black;
        border-bottom: 2px solid black;
        transform: ${({ $open }) => ($open ? "rotate(-45deg)" : "rotate(135deg)")};
        margin-left: ${({ $open }) => ($open ? "-2px" : "2px")};
        transition: transform 0.3s ease, margin-left 0.3s ease;
    }
`;

const SidebarTaskName = styled.div`
    font-size: 1.2rem;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1.3;
    margin-bottom: 0.2rem;
`;

const SidebarTimeRemaining = styled.div`
    font-size: 0.78rem;
    color: #b07800;
    font-weight: 600;
    margin-bottom: 0.6rem;
    letter-spacing: 0.02em;
`;

const SidebarDivider = styled.div`
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 0.75rem 0;
`;

const TaskCardWrapper = styled.div`
    width: 100%;
    margin-bottom: 0.25rem;
    border-radius: 12px;
    overflow: visible;
    & > div {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
    }
`;

const SidebarEmpty = styled.div`
    font-size: 0.82rem;
    opacity: 0.35;
    margin-top: 1rem;
    color: #999;
`;

const PomodoroWarning = styled.div`
    font-size: 0.75rem;
    color: #b07800;
    margin-bottom: 0.75rem;
    line-height: 1.4;
`;

const StudyPlanCard = styled.div`
    background: white;
    border-radius: 12px;
    border: 1.5px solid #e0e0e0;
    padding: 1rem;
    margin-top: 0.25rem;
`;

const StudyPlanCardTitle = styled.div`
    font-size: 0.72rem;
    font-weight: 700;
    color: #888;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    &::before {
        content: "✦";
        color: #4B94DB;
        font-size: 0.65rem;
    }
`;

const StepItem = styled.div<{ $active: boolean; $done: boolean }>`
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    background: ${({ $active, $done }) =>
    $active ? "rgba(75,148,219,0.12)" : $done ? "rgba(0,0,0,0.03)" : "transparent"};
    border-left: 3px solid ${({ $active }) => ($active ? "#FFF59A" : "transparent")};
    opacity: ${({ $done }) => ($done ? 0.4 : 1)};
    transition: background 0.3s ease, border-color 0.3s ease, opacity 0.3s ease;
`;

const StepLabel = styled.div`font-size: 0.8rem; font-weight: 600; color: #1a1a2e;`;
const StepDuration = styled.div`font-size: 0.72rem; color: #888; margin-top: 0.2rem;`;

const StepProgressBar = styled.div<{ $pct: number }>`
    height: 2px;
    border-radius: 1px;
    background: rgba(0,0,0,0.08);
    margin-top: 0.4rem;
    overflow: hidden;
    &::after {
        content: "";
        display: block;
        height: 100%;
        width: ${({ $pct }) => $pct}%;
        background: #FFF59A;
        transition: width 1s linear;
    }
`;

const StepEllipsis = styled.div`
    text-align: center;
    color: #aaa;
    font-size: 0.75rem;
    padding: 0.4rem 0 0.1rem;
    letter-spacing: 0.08em;
    font-style: italic;
`;

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */

export default function TimerScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    const locationState = (location.state as LocationState) || {};

    const resolvedContext = useMemo<PersistedContext>(() => {
        if (locationState.mode) {
            const ctx: PersistedContext = {
                mode:    locationState.mode,
                item:    locationState.item  ?? null,
                hasPlan: !!locationState.hasPlan,
                savedAt: Date.now(), // eslint-disable-line react-hooks/purity
            };
            saveContext(ctx);
            return ctx;
        }
        const persisted = loadContext();
        if (persisted) return persisted;
        return { mode: "free", item: null, hasPlan: false, savedAt: Date.now() }; // eslint-disable-line react-hooks/purity
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { mode, item, hasPlan } = resolvedContext;
    const currentTask = mode === "task" ? (item as Task) : null;

    // Timer state
    const [digits, setDigits] = useState("000000");
    const [seconds, setSeconds] = useState(0);
    const [status, setStatus] = useState<Status>("idle");
    const [isOwner, setIsOwner] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    // UI state
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [showTaskComplete, setShowTaskComplete] = useState(false);
    const [showReusePrompt, setShowReusePrompt] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Plant state
    const [plantStage, setPlantStage] = useState(1);
    const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
    const [showReveal, setShowReveal] = useState(false);
    const [plantVariety, setPlantVariety] = useState<PlantVariety | null>(null);

    // Workflow state
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [workflowLoading, setWorkflowLoading] = useState(false);
    const [isPomodoro, setIsPomodoro] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepProgressPct, setStepProgressPct] = useState(0);

    const [sidebarTask, setSidebarTask] = useState<Task | null>(currentTask);

    const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(() => {
        const s = loadSession();
        return s ? computeActiveSeconds(s, Date.now()) : 0;
    });

    // Refs
    const channelRef = useRef<BroadcastChannel | null>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<Status>("idle");
    const workflowStepsRef = useRef<WorkflowStep[]>([]);
    const stepIndexRef = useRef(0);
    const stepElapsedRef = useRef(0);
    const localPlantProgressRef = useRef(0);
    const lastPlantSyncRef = useRef(0);
    const midSessionEarnedRef = useRef<PlantEarned[]>([]);
    const previousTaskStatusRef = useRef<string | null>(null);

    // ✅ Tutorial hooks
    const { visits } = useUserVisits();
    useAutoTutorial(visits?.visited_timer, TIMER_SCREEN_TUTORIAL_STEPS, "timer");

    useEffect(() => {
        if (currentTask?.status) {
            previousTaskStatusRef.current = currentTask.status;
        }
    }, [currentTask]);

    useEffect(() => {
        lastPlantSyncRef.current = Date.now();
    }, []);

    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { workflowStepsRef.current = workflowSteps; }, [workflowSteps]);

    useEffect(() => {
        if (currentTask) {
            setSidebarTask(currentTask);
            return;
        }
        if (!item) return;
        const taskId = getTaskId(item);
        if (!taskId) return;
        getTask(taskId).then(setSidebarTask).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ══════════════════════════════════════════
       PLANT SYNC
    ══════════════════════════════════════════ */
    const syncPlantProgress = useCallback(async () => {
        const session = loadSession();
        if (!session || session.paused) return;
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastPlantSyncRef.current) / 1000);
        if (deltaSeconds <= 0) return;
        try {
            const result = await growPlant(deltaSeconds);
            if (result?.plants_earned_count > 0) {
                const last = result.plants_earned[result.plants_earned.length - 1];
                if (last?.variety) {
                    setPlantVariety(last.variety as PlantVariety);
                    setPlantStage(1);
                }
            }
            if (result?.stage != null) setPlantStage(result.stage);
            localPlantProgressRef.current = result.progress ?? 0;
            lastPlantSyncRef.current = now;
            return result;
        } catch (e) {
            console.warn("Plant sync failed", e);
        }
    }, []);

    useEffect(() => {
        function handleVisibilityChange() {
            if (document.hidden) void syncPlantProgress();
        }
        window.addEventListener("beforeunload", syncPlantProgress);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("beforeunload", syncPlantProgress);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [syncPlantProgress]);

    async function saveSessionToDB(session: Session, now: number, taskCompleted = false) {
        if (!session.hasStartedWork) return null;
        const elapsed = Math.floor((now - session.startTime) / 1000);
        if (elapsed < 10) return null;
        const payload: TimerSession = {
            ...(currentTask?.id ? { task_id: currentTask.id } : {}),
            mode: currentTask ? "task" : "free",
            started_at: new Date(session.startTime).toISOString(),
            ended_at: new Date(now).toISOString(),
            elapsed_seconds: elapsed,
            active_seconds: computeActiveSeconds(session, now),
            task_completed: taskCompleted,
        };
        try {
            const res = await createTimerSession(payload);
            return { session: res.data };
        } catch (e) {
            console.error("Failed to save session", e);
            return null;
        }
    }

    async function forceEndSession(session: Session) {
        const data = await saveSessionToDB(session, Date.now());
        clearAll();
        return data;
    }

    /* ══════════════════════════════════════════
       MOUNT — session resolution + plant fetch
    ══════════════════════════════════════════ */
    useEffect(() => {
        const { resumeAction, timerStatus, timerSeconds, timerDigits, isOwner: owner } =
            resolveSessionOnMount();

        async function loadActivePlant() {
            try {
                const data = await fetchActivePlant();
                console.log("🌱 Plant on mount:", data);
                if (data?.progress_seconds != null) {
                    localPlantProgressRef.current = data.progress_seconds;
                    setPlantStage(data.stage ?? 1);
                    if (data.variety && PLANT_CONFIG[data.variety as PlantVariety]) {
                        setPlantVariety(data.variety as PlantVariety);
                    }
                }
            } catch (e) {
                console.warn("Could not fetch active plant", e);
            }
        }
        void loadActivePlant();

        setIsOwner(owner);
        setStatus(timerStatus);
        statusRef.current = timerStatus;
        setSeconds(timerSeconds);
        if (timerStatus === "idle") {
            if (mode === "task" && currentTask?.task_duration) {
                const totalSeconds = currentTask.task_duration * 60;
                setDigits(secondsToDigits(totalSeconds));
            } else {
                setDigits(timerDigits);
            }
        }

        if (resumeAction === "reuse_prompt") {
            setShowReusePrompt(true);
        } else if (resumeAction === "force_end") {
            const session = loadSession();
            if (session) {
                forceEndSession(session).then(data => {
                    if (data) { setSummaryData(data); setShowSummary(true); }
                    else navigate(ROUTES.TIMER_ENTRY_PAGE);
                });
            } else {
                navigate(ROUTES.TIMER_ENTRY_PAGE);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ══════════════════════════════════════════
       MOUNT — workflow generation
    ══════════════════════════════════════════ */
    useEffect(() => {
        if (!hasPlan || !item) return;
        const taskId = getTaskId(item);
        if (!taskId) return;

        const cached = loadWorkflow(taskId);
        if (cached) {
            setWorkflowSteps(cached.steps);
            workflowStepsRef.current = cached.steps;
            setIsPomodoro(cached.isPomodoro);
            const session = loadSession();
            if (session?.currentStepIndex != null) {
                stepIndexRef.current   = session.currentStepIndex;
                stepElapsedRef.current = session.stepElapsedSecs ?? 0;
                setCurrentStepIndex(session.currentStepIndex);
            }
            return;
        }

        setWorkflowLoading(true);
        getTask(taskId)
            .then((task: Task) => {
                setSidebarTask(task);
                return generateWorkflow({ title: task.title, description: task.description });
            })
            .then((data: { steps: WorkflowStep[]; is_pomodoro: boolean }) => {
                setWorkflowSteps(data.steps);
                workflowStepsRef.current = data.steps;
                setIsPomodoro(data.is_pomodoro);
                saveWorkflow({ taskId, steps: data.steps, isPomodoro: data.is_pomodoro, savedAt: Date.now() });
            })
            .catch(() => setWorkflowSteps([]))
            .finally(() => setWorkflowLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ══════════════════════════════════════════
       SINGLE UNIFIED TICK LOOP
    ══════════════════════════════════════════ */
    useEffect(() => {
        const interval = setInterval(async () => {
            const now = Date.now();
            if (statusRef.current !== "running") return;
            const session = loadSession();
            if (!session || session.paused || !session.endTime) return;
            const remaining = Math.max(0, Math.ceil((session.endTime - now) / 1000));
            setSeconds(remaining);
            setSessionElapsedSeconds(computeActiveSeconds(session, now));
            localPlantProgressRef.current += 1;
            if (localPlantProgressRef.current % 30 === 0) {
                const result = await syncPlantProgress();
                if (result?.stage != null) setPlantStage(result.stage);
                if (result?.plants_earned_count > 0) {
                    midSessionEarnedRef.current = [
                        ...midSessionEarnedRef.current,
                        ...(result.plants_earned ?? []),
                    ];
                }
            }
            if (remaining <= 0) {
                await syncPlantProgress();
                session.paused = true;
                session.pausedAt = now;
                delete session.endTime;
                saveSession(session);
                setStatus("idle");
                statusRef.current = "idle";
                setSeconds(0);
                return;
            }
            const steps = workflowStepsRef.current;
            if (steps.length > 0) {
                stepElapsedRef.current += 1;
                const currentDuration = steps[stepIndexRef.current]?.duration_seconds ?? 0;
                if (stepElapsedRef.current >= currentDuration) {
                    const nextIndex = Math.min(stepIndexRef.current + 1, steps.length - 1);
                    stepIndexRef.current = nextIndex;
                    stepElapsedRef.current = 0;
                    setCurrentStepIndex(nextIndex);
                    setStepProgressPct(0);
                } else {
                    setStepProgressPct(
                        Math.min(100, Math.round((stepElapsedRef.current / currentDuration) * 100))
                    );
                }
            }
            session.currentStepIndex = stepIndexRef.current;
            session.stepElapsedSecs  = stepElapsedRef.current;
            saveSession(session);
        }, 1000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ══════════════════════════════════════════
       TAB CONTROL
    ══════════════════════════════════════════ */
    useEffect(() => {
        const channel = new BroadcastChannel("timer_tab_control");
        channelRef.current = channel;
        channel.onmessage = (event) => {
            const { type, tabId } = event.data ?? {};
            if (type === "CLAIM" && tabId !== TAB_ID) {
                setIsOwner(false);
                const session = loadSession();
                if (session) { session.activeTabId = tabId; saveSession(session); }
            }
        };
        const session = loadSession();
        if (!session || isController(session)) {
            channel.postMessage({ type: "CLAIM", tabId: TAB_ID });
        }
        return () => {
            channel.postMessage({ type: "RELEASE", tabId: TAB_ID });
            channel.close();
        };
    }, []);

    /* ══════════════════════════════════════════
       ACTIVITY TRACKING
    ══════════════════════════════════════════ */
    useEffect(() => {
        let lastUpdate = 0;
        function updateActivity() {
            const now = Date.now();
            if (now - lastUpdate < 5000) return;
            lastUpdate = now;
            const session = loadSession();
            if (!session) return;
            session.lastActive = now;
            saveSession(session);
        }
        function handleVisibility() {
            if (document.visibilityState === "visible") updateActivity();
        }
        window.addEventListener("click", updateActivity);
        window.addEventListener("keydown", updateActivity);
        window.addEventListener("mousemove", updateActivity, { passive: true });
        window.addEventListener("scroll", updateActivity, { passive: true });
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.removeEventListener("click", updateActivity);
            window.removeEventListener("keydown", updateActivity);
            window.removeEventListener("mousemove", updateActivity);
            window.removeEventListener("scroll", updateActivity);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    /* ══════════════════════════════════════════
       UNLOAD SAFETY
    ══════════════════════════════════════════ */
    useEffect(() => {
        function handleUnload() {
            const session = loadSession();
            if (!session || !session.hasStartedWork) { clearAll(); return; }
            const now = Date.now();
            const elapsed = Math.floor((now - session.startTime) / 1000);
            if (elapsed < 10) { clearAll(); return; }
            const payload: TimerSession = {
                ...(currentTask?.id ? { task_id: currentTask.id } : {}),
                mode: currentTask ? "task" : "free",
                started_at: new Date(session.startTime).toISOString(),
                ended_at: new Date(now).toISOString(),
                elapsed_seconds: elapsed,
                active_seconds: computeActiveSeconds(session, now),
                task_completed: false,
            };
            beaconSession(payload);
            clearAll();
        }
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [currentTask]);

    const { refetchPlants } = usePlants();

    /* ══════════════════════════════════════════
       DIGIT INPUT
    ══════════════════════════════════════════ */
    function handleKeyDown(e: React.KeyboardEvent) {
        if (status !== "idle") return;
        if (e.key >= "0" && e.key <= "9") {
            setDigits(prev => (prev + e.key).slice(-DIGIT_COUNT));
        } else if (e.key === "Backspace") {
            setDigits(prev => ("0" + prev).slice(0, DIGIT_COUNT));
        }
    }

    /* ══════════════════════════════════════════
       ACTIONS
    ══════════════════════════════════════════ */
    const ensureControl = useCallback(() => {
        if (isOwner) return true;
        const session = loadSession();
        if (session) claimControl(session);
        channelRef.current?.postMessage({ type: "CLAIM", tabId: TAB_ID });
        setIsOwner(true);
        return true;
    }, [isOwner]);

    function start() {
        ensureControl();
        const padded = digits.padStart(6, "0");
        const h = parseInt(padded.slice(0, 2), 10);
        const m = parseInt(padded.slice(2, 4), 10);
        const s = parseInt(padded.slice(4, 6), 10);
        if (m > 59 || s > 59 || h > 24 || (h === 0 && m === 0 && s === 0)) {
            setToast("Invalid time entered!");
            setTimeout(() => setToast(null), 3000);
            return;
        }
        const totalSeconds = h * 3600 + m * 60 + s;
        if (!totalSeconds) return;
        const now = Date.now();
        let session = loadSession();
        if (!session) {
            session = { startTime: now, lastActive: now, paused: false, activeTabId: TAB_ID, totalPausedMs: 0, hasStartedWork: true };
        }
        if (session.pausedAt) {
            session.totalPausedMs = (session.totalPausedMs ?? 0) + (now - session.pausedAt);
            delete session.pausedAt;
        }
        session.hasStartedWork = true;
        session.endTime = now + totalSeconds * 1000;
        session.paused = false;
        session.activeTabId = TAB_ID;
        if (session.totalPausedMs == null) session.totalPausedMs = 0;
        lastPlantSyncRef.current = now;
        midSessionEarnedRef.current = [];
        saveSession(session);
        setSeconds(totalSeconds);
        setStatus("running");
        statusRef.current = "running";
    }

    function pause() {
        ensureControl();
        const session = loadSession();
        if (!session || !session.endTime) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((session.endTime - now) / 1000));
        session.paused = true;
        session.remainingOnPause = remaining;
        session.pausedAt = now;
        delete session.endTime;
        saveSession(session);
        setStatus("paused");
        statusRef.current = "paused";
        lastPlantSyncRef.current = now;
    }

    function resume() {
        ensureControl();
        const session = loadSession();
        if (!session || session.remainingOnPause == null) return;
        const now = Date.now();
        if (session.pausedAt) {
            session.totalPausedMs = (session.totalPausedMs ?? 0) + (now - session.pausedAt);
            delete session.pausedAt;
        }
        session.paused = false;
        session.endTime = now + session.remainingOnPause * 1000;
        delete session.remainingOnPause;
        saveSession(session);
        setStatus("running");
        statusRef.current = "running";
        lastPlantSyncRef.current = now;
    }

    async function reset() {
        ensureControl();
        await syncPlantProgress();
        lastPlantSyncRef.current = Date.now();
        const session = loadSession();
        if (session) {
            delete session.endTime;
            delete session.remainingOnPause;
            delete session.pausedAt;
            delete session.currentStepIndex;
            delete session.stepElapsedSecs;
            session.totalPausedMs = 0;
            session.paused = false;
            saveSession(session);
        }
        setStatus("idle");
        statusRef.current = "idle";
        setSeconds(0);
        setDigits("000000");
        setSessionElapsedSeconds(0);
        stepIndexRef.current = 0;
        stepElapsedRef.current = 0;
        setCurrentStepIndex(0);
        setStepProgressPct(0);
    }

    async function confirmEndSession(taskCompleted?: boolean) {
        const session = loadSession();
        if (!session) {
            setShowEndConfirm(false);
            setShowTaskComplete(false);
            navigate(ROUTES.HOME);
            return;
        }
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastPlantSyncRef.current) / 1000);
        let finalEarned: PlantEarned[] = [];
        if (deltaSeconds > 0) {
            try {
                const syncResult = await growPlant(deltaSeconds);
                finalEarned = syncResult?.plants_earned ?? [];
                if (syncResult?.stage != null) setPlantStage(syncResult.stage);
                if (finalEarned.length > 0) {
                    const last = finalEarned[finalEarned.length - 1];
                    if (last?.variety) setPlantVariety(last.variety as PlantVariety);
                }
            } catch (e) {
                console.warn("Final plant sync failed", e);
            }
        }
        const earnedList = [...midSessionEarnedRef.current, ...finalEarned];
        const result = await saveSessionToDB(session, now, taskCompleted ?? false);
        if (currentTask?.id) {
            if (taskCompleted) {
                await deleteTask(currentTask.id);
            } else {
                await updateTaskStatus(currentTask.id, previousTaskStatusRef.current ?? "to_do");
            }
        }
        clearAll();
        midSessionEarnedRef.current = [];
        setStatus("idle");
        statusRef.current = "idle";
        setSeconds(0);
        setDigits("000000");
        if (result) {
            setSummaryData({
                ...result.session,
                plantsEarned: earnedList.length,
                plantsEarnedList: earnedList,
            });
            setShowSummary(true);
        }
        await refetchPlants();
        setShowEndConfirm(false);
        setShowTaskComplete(false);
    }

    function handleEndSessionClick() { setShowEndConfirm(true); }

    function handleReuseYes() {
        const session = loadSession()!;
        session.lastActive = Date.now();
        claimControl(session);
        setIsOwner(true);
        channelRef.current?.postMessage({ type: "CLAIM", tabId: TAB_ID });
        setShowReusePrompt(false);
    }

    function handleReuseNo() {
        clearAll();
        setShowReusePrompt(false);
        setIsOwner(true);
        setStatus("idle");
        statusRef.current = "idle";
        setSeconds(0);
        setDigits("000000");
    }

    async function handleOpenReveal() {
        try {
            const data: CompletedPlant[] = await fetchCompletedPlants();
            const map: Record<string, number> = {};
            data.forEach((p: CompletedPlant) => { map[p.variety] = p.count; });
            setCompletedCounts(map);
            setShowReveal(true);
        } catch (e) {
            console.error("Failed to fetch completed plants", e);
        }
    }

    /* ─────────────────────────────────────
       DERIVED VALUES FOR SIDEBAR
    ───────────────────────────────────── */
    const taskDurationSeconds = (sidebarTask?.task_duration ?? 0) * 60;
    const taskTimeRemaining   = taskDurationSeconds > 0
        ? Math.max(0, taskDurationSeconds - sessionElapsedSeconds)
        : null;

    /* ─────────────────────────────────────
       RENDER
    ───────────────────────────────────── */
    const { h, mm, ss } = formatDigits(digits);
    const totalTyped = digitsToSeconds(digits);
    const canStart = totalTyped > 0;
    const showControlBanner = !isOwner;
    const showSidebar = hasPlan || !!currentTask;

    return (
        <>
            <GlobalFont />
            <Outer>
                <Frame>
                    <Window>
                        <SkyBackground>
                            <SkyScroller>
                                <SkyTile/>
                                <SkyTile/>
                            </SkyScroller>
                        </SkyBackground>

                        {showControlBanner && (
                            <BlockedBanner>
                                Timer is active in another tab.
                                <button onClick={() => { ensureControl(); setIsOwner(true); }}>
                                    Take control
                                </button>
                            </BlockedBanner>
                        )}

                        <PageBackButton to={ROUTES.HOME} />
                        <EndSessionButton onClick={handleEndSessionClick}>End Session</EndSessionButton>

                        <Main>

                            {/* ✅ data-tutorial-id wraps the whole timer display area */}
                            <div data-tutorial-id="active-timer">
                                {status === "idle" && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <TimerInputRow
                                            ref={inputRef}
                                            tabIndex={0}
                                            onKeyDown={handleKeyDown}
                                            onClick={() => inputRef.current?.focus()}
                                        >
                                            <DigitGroup $active={digits.length >= 5}>{h}</DigitGroup>
                                            <Colon>:</Colon>
                                            <DigitGroup $active={digits.length >= 3 && digits.length < 5}>{mm}</DigitGroup>
                                            <Colon>:</Colon>
                                            <DigitGroup $active={digits.length < 3}>{ss}</DigitGroup>
                                        </TimerInputRow>

                                        <div style={{
                                            fontSize: "1.3rem",
                                            fontWeight: 600,
                                            color: "rgba(255,255,255,0.85)",
                                            marginTop: "0.1rem",
                                            marginBottom: "0.5rem",
                                            textAlign: "center",
                                            letterSpacing: "0.02em"
                                        }}>
                                            Click the digits and start typing to set a time!
                                        </div>
                                    </div>
                                )}

                                {status !== "idle" && (
                                    <TimeDisplay>{formatSeconds(seconds)}</TimeDisplay>
                                )}
                            </div>

                            <Controls>
                                {status === "idle"    && <Btn onClick={start} disabled={!canStart} style={{ opacity: canStart ? 1 : 0.35 }}>Start</Btn>}
                                {status === "running" && <Btn onClick={pause}>Pause</Btn>}
                                {status === "paused"  && (<><Btn onClick={resume}>Resume</Btn><Btn onClick={reset}>Reset</Btn></>)}
                            </Controls>
                        </Main>

                        <PlantContainer>
                            {plantVariety ? (
                                <PlantStageAnimator variety={plantVariety} stage={plantStage} />
                            ) : (
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontWeight: 600 }}>
                                    Loading...
                                </div>
                            )}
                        </PlantContainer>

                        {showSidebar && (
                            <>
                                <SidebarHandle
                                    $open={sidebarOpen}
                                    onClick={() => setSidebarOpen(o => !o)}
                                    aria-label={sidebarOpen ? "Close plan" : "Open plan"}
                                />
                                <Sidebar $open={sidebarOpen}>
                                    <SidebarTaskName>
                                        {sidebarTask?.title ?? "Study Session"}
                                    </SidebarTaskName>

                                    {taskTimeRemaining !== null && (
                                        <SidebarTimeRemaining>
                                            Total Time Remaining: {formatSeconds(taskTimeRemaining)}
                                        </SidebarTimeRemaining>
                                    )}

                                    <SidebarDivider />

                                    {sidebarTask && (
                                        <TaskCardWrapper>
                                            <TaskEditable task={sidebarTask} isEditable={false} />
                                        </TaskCardWrapper>
                                    )}

                                    {hasPlan && (
                                        <>
                                            <SidebarDivider />
                                            <StudyPlanCard>
                                                <StudyPlanCardTitle>
                                                    AI — Suggested Study Plan
                                                </StudyPlanCardTitle>

                                                {workflowLoading && (
                                                    <SidebarEmpty>Generating your plan…</SidebarEmpty>
                                                )}

                                                {!workflowLoading && isPomodoro && (
                                                    <PomodoroWarning>
                                                        ⚠️ Not enough info for a custom plan — using Pomodoro.
                                                        Add more to your task description for a tailored workflow.
                                                    </PomodoroWarning>
                                                )}

                                                {!workflowLoading && workflowSteps.length > 0 && (() => {
                                                    const start          = currentStepIndex;
                                                    const end            = Math.min(start + 5, workflowSteps.length);
                                                    const visible        = workflowSteps.slice(start, end);
                                                    const remainingCount = workflowSteps.length - end;
                                                    return (
                                                        <>
                                                            {visible.map((step, offset) => {
                                                                const i = start + offset;
                                                                return (
                                                                    <StepItem key={i} $active={i === currentStepIndex} $done={false}>
                                                                        <StepLabel>{step.label}</StepLabel>
                                                                        <StepDuration>{formatStepDuration(step.duration_seconds)}</StepDuration>
                                                                        {i === currentStepIndex && <StepProgressBar $pct={stepProgressPct} />}
                                                                    </StepItem>
                                                                );
                                                            })}
                                                            {remainingCount > 0 && (
                                                                <StepEllipsis>
                                                                    · · · ({remainingCount} more step{remainingCount !== 1 ? "s" : ""})
                                                                </StepEllipsis>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {!workflowLoading && workflowSteps.length === 0 && (
                                                    <SidebarEmpty>Could not generate a plan.</SidebarEmpty>
                                                )}
                                            </StudyPlanCard>
                                        </>
                                    )}
                                </Sidebar>
                            </>
                        )}

                        {/* ✅ TutorialButton — no targetSelector on step 1 so no wrapper needed */}
                        <TutorialButton steps={TIMER_SCREEN_TUTORIAL_STEPS} />
                    </Window>
                </Frame>

                <Sill />

                {showReusePrompt && (
                    <Overlay>
                        <OverlayContent>
                            <h3>Welcome back!</h3>
                            <p>You have a session from earlier. Continue it?</p>
                            <div className="actions">
                                <OverlayBtn onClick={handleReuseYes}>Continue</OverlayBtn>
                                <OverlayBtn onClick={handleReuseNo}>Start fresh</OverlayBtn>
                            </div>
                        </OverlayContent>
                    </Overlay>
                )}

                {showEndConfirm && (
                    <Overlay>
                        <OverlayContent onClick={e => e.stopPropagation()}>
                            <OverlayTitle>End Timer Session?</OverlayTitle>
                            <PrimaryBtn onClick={() => setShowEndConfirm(false)}>Continue</PrimaryBtn>
                            <SecondaryBtn onClick={() => {
                                setShowEndConfirm(false);
                                if (currentTask) { setShowTaskComplete(true); }
                                else { confirmEndSession(); }
                            }}>
                                End Timer
                            </SecondaryBtn>
                        </OverlayContent>
                    </Overlay>
                )}

                {showTaskComplete && (
                    <Overlay>
                        <OverlayContent onClick={e => e.stopPropagation()}>
                            <OverlayTitle>Did you finish your task?</OverlayTitle>
                            <OverlayTaskTitle>"{currentTask?.title}"</OverlayTaskTitle>
                            <TaskCompleteGrid>
                                <TaskCompleteOption $primary onClick={() => confirmEndSession(true)}>
                                    <TaskCompleteOptionTitle $primary>Yes ✓</TaskCompleteOptionTitle>
                                    <TaskCompleteOptionDesc $primary>
                                        Marked as complete and removed from your task list. Shows as done on your schedule.
                                    </TaskCompleteOptionDesc>
                                </TaskCompleteOption>
                                <TaskCompleteOption onClick={() => confirmEndSession(false)}>
                                    <TaskCompleteOptionTitle>Not yet</TaskCompleteOptionTitle>
                                    <TaskCompleteOptionDesc>
                                        Keeps the task on your list so you can come back to it later.
                                    </TaskCompleteOptionDesc>
                                </TaskCompleteOption>
                            </TaskCompleteGrid>
                        </OverlayContent>
                    </Overlay>
                )}

                {showSummary && (
                    <Overlay>
                        <SummaryCard>
                            <SummaryTitle>Good Job!</SummaryTitle>

                            {(summaryData?.plantsEarned ?? 0) > 0 ? (() => {
                                const earnedList = (summaryData?.plantsEarnedList as PlantEarned[]) ?? [];
                                const lastPlant = earnedList[earnedList.length - 1];
                                const variety: PlantVariety =
                                    (lastPlant?.variety && PLANT_CONFIG[lastPlant.variety as PlantVariety])
                                        ? (lastPlant.variety as PlantVariety)
                                        : (plantVariety ?? "sunflower");
                                const maxStage = PLANT_CONFIG[variety].stages.length;
                                return (
                                    <>
                                        <SummarySubtitle>
                                            You grew {summaryData?.plantsEarned ?? 0} plant{(summaryData?.plantsEarned ?? 0) > 1 ? "s" : ""}!
                                        </SummarySubtitle>
                                        <div style={{ margin: "1rem 0" }}>
                                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.6rem" }}>
                                                <div style={{ transform: "scale(0.75)" }}>
                                                    <PlantVisual variety={variety} stage={maxStage} />
                                                </div>
                                            </div>
                                            <div
                                                onClick={handleOpenReveal}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "8px",
                                                    marginTop: "0.4rem",
                                                    padding: "8px 19px",
                                                    borderRadius: "999px",
                                                    fontSize: "1.05rem",
                                                    fontWeight: 700,
                                                    color: "#3A7BD5",
                                                    background: "rgba(58,123,213,0.08)",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                🌱 See what you grew
                                            </div>
                                        </div>
                                    </>
                                );
                            })() : (() => {
                                const progress = localPlantProgressRef.current;
                                const safeVariety = plantVariety ?? "sunflower";
                                const maxStage = PLANT_CONFIG[safeVariety].stages.length;
                                const remaining = 30 * maxStage - progress;
                                return (
                                    <SummarySubtitle>
                                        Your next plant will grow in {remaining}s 🌱
                                    </SummarySubtitle>
                                );
                            })()}

                            <div style={{ fontSize: "0.85rem", marginTop: "1rem", color: "#333" }}>
                                You studied for
                            </div>

                            {(() => {
                                const active = summaryData?.active_seconds ?? 0;
                                const { h, m, s } = formatHMS(active);
                                return <TimeBox>{h}:{m}:{s}</TimeBox>;
                            })()}

                            <div style={{
                                display: "flex",
                                justifyContent: "space-around",
                                fontSize: "0.8rem",
                                color: "#666",
                                marginTop: "0.5rem"
                            }}>
                                <span>hours</span><span>minutes</span><span>seconds</span>
                            </div>

                            <ButtonStack>
                                <PrimaryBtn onClick={() => navigate(ROUTES.TIMER_ENTRY_PAGE)}>
                                    Study Again
                                </PrimaryBtn>
                                <SecondaryBtn onClick={() => navigate(ROUTES.HOME)}>
                                    Leave Timer
                                </SecondaryBtn>
                            </ButtonStack>
                        </SummaryCard>

                        {showReveal && (
                            <PlantRevealSequence
                                plants={(summaryData?.plantsEarnedList as PlantEarned[]) ?? []}
                                completedCounts={completedCounts}
                                onClose={() => setShowReveal(false)}
                            />
                        )}
                    </Overlay>
                )}

                {toast && (
                    <div style={{
                        position: "fixed",
                        top: "10%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#D45884",
                        color: "white",
                        padding: "0.7rem 1.4rem",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        zIndex: 999,
                        animation: "fadeInOut 3s ease"
                    }}>
                        {toast}
                    </div>
                )}
            </Outer>
        </>
    );
}