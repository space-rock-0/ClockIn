import styled, { keyframes, css } from "styled-components";
import { useTutorial } from "../../constants/useTutorial";
import TutorialBeeIcon from "../icons/TutorialBeeIcon.tsx";
import { useEffect, useState, useRef } from "react";

/* ── Animations ── */
const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const slideIn = keyframes`
    0%   { opacity: 0; transform: scale(0.6) translateY(20px); }
    60%  { opacity: 1; transform: scale(1.04) translateY(-4px); }
    80%  { transform: scale(0.98) translateY(2px); }
    100% { transform: scale(1) translateY(0); }
`;

const OverlaySvg = styled.svg`
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    pointer-events: all;
    animation: ${fadeIn} 0.3s ease;
`;

const lineFadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const LineSvg = styled.svg`
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 10000;
    overflow: visible;
    animation: ${lineFadeIn} 0.2s ease 0.1s both;
`;

const CardWrapper = styled.div<{ $centered?: boolean }>`
    position: fixed;
    z-index: 10001;
    ${p => p.$centered && css`transform: translate(-50%, -50%);`}
`;

const Card = styled.div`
    background: white;
    border-radius: 12px;
    padding: 36px 44px 28px;
    min-width: 300px;
    max-width: 420px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.15);
    transform-origin: left center;
    animation: ${slideIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const CardTitle = styled.h2`
    font-size: 1.65rem;
    font-weight: 800;
    font-style: italic;
    color: #1a1a1a;
    margin: 0 0 10px;
    text-align: center;
`;

const CardBody = styled.p`
    font-size: 1rem;
    color: #333;
    text-align: center;
    margin: 0;
    line-height: 1.5;
`;

const CardHighlight = styled.span`
    color: #4B94DB;
    font-weight: 500;
`;

const BeeWrapper = styled.div`
    position: absolute;
    top: -52px;
    left: -20px;
    width: 72px;
    pointer-events: none;
    z-index: 1;
`;

const DotsRow = styled.div`
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;        /* 8 × 2 */
    z-index: 10003;
`;

const Dot = styled.div<{ $active: boolean }>`
    width: ${p => p.$active ? "24px" : "18px"};   /* 12×2, 9×2 */
    height: ${p => p.$active ? "24px" : "18px"};
    border-radius: 50%;
    background: ${p => p.$active ? "#4B94DB" : "rgba(255,255,255,0.6)"};
    border: 2px solid ${p => p.$active ? "#4B94DB" : "rgba(255,255,255,0.8)"};
    transition: all 0.2s ease;
`;

const ArrowBtn = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 5rem;      /* 2.5 × 2 */
    cursor: pointer;
    padding: 4px 12px;    /* 2×2, 6×2 */
    opacity: 0.8;
    transition: opacity 0.15s;
    line-height: 1;

    &:hover { opacity: 1; }
    &:disabled { opacity: 0.3; cursor: default; }
`;

const SkipBtn = styled.button`
    position: fixed;
    top: 20px;
    right: 24px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.75);
    font-size: 0.85rem;
    cursor: pointer;
    z-index: 10003;
    transition: color 0.15s;

    &:hover { color: white; }
`;

interface SpotlightRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const SPOTLIGHT_PADDING = 16;

const BEE_TAIL_VB_X = 343;
const BEE_TAIL_VB_Y = 253;
const BEE_VB_W = 343;
const BEE_VB_H = 387;

export default function TutorialOverlay() {
    const { isActive, currentStep, step, totalSteps, next, prev, stop } = useTutorial();
    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
    const beeRef = useRef<HTMLDivElement>(null);
    const [beeTail, setBeeTail] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handle = () => setDims({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
    }, []);

    useEffect(() => {
        if (!isActive || !step?.targetSelector) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpotlight(null);
            return;
        }

        const timer = setTimeout(() => {
            const el = document.querySelector(step.targetSelector!);
            if (!el) {
                setSpotlight(null); // ✅ Element not found — clear spotlight
                return;
            }

            const rect = el.getBoundingClientRect();
            setSpotlight({
                x: rect.left - SPOTLIGHT_PADDING,
                y: rect.top - SPOTLIGHT_PADDING,
                width: rect.width + SPOTLIGHT_PADDING * 2,
                height: rect.height + SPOTLIGHT_PADDING * 2,
            });
        }, 50);

        return () => clearTimeout(timer);
    }, [isActive, currentStep, step?.targetSelector]);

    useEffect(() => {
        if (!beeRef.current) return;

        const timer = setTimeout(() => {
            const rect = beeRef.current!.getBoundingClientRect();
            const scaleX = rect.width / BEE_VB_W;
            const scaleY = rect.height / BEE_VB_H;
            setBeeTail({
                x: rect.left + BEE_TAIL_VB_X * scaleX,
                y: rect.top  + BEE_TAIL_VB_Y * scaleY,
            });
        }, 60);

        return () => clearTimeout(timer);
    }, [isActive, currentStep, dims]);

    if (!isActive || !step) return null;

    const { w, h } = dims;

    const offsetX = step.spotlightOffset?.x ?? 0;
    const offsetY = step.spotlightOffset?.y ?? 0;

    const targetX = spotlight ? spotlight.x + spotlight.width  / 2 + offsetX : 0;
    const targetY = spotlight ? spotlight.y + spotlight.height / 2 + offsetY : 0;

    // ✅ No more hard-coded step IDs — line shows only when there's a real spotlight
    const spotlightPath = spotlight
        ? `M 0 0 H ${w} V ${h} H 0 Z M ${spotlight.x} ${spotlight.y} h ${spotlight.width} v ${spotlight.height} h -${spotlight.width} Z`
        : null;

    const showLine = spotlightPath !== null; // ✅ null path = no line, full stop

    const cpX = (beeTail.x + targetX) / 2 + (targetY - beeTail.y) * 0.3 + (step.lineCurve?.offsetX ?? 0);
    const cpY = (beeTail.y + targetY) / 2 - Math.abs(targetX - beeTail.x) * 0.25 + (step.lineCurve?.offsetY ?? 0);

    return (
        <>
            <OverlaySvg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                <defs>
                    {spotlight && (
                        <filter id="spotlight-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    )}
                </defs>

                {/* ✅ spotlightPath null = plain overlay, no cutout */}
                {spotlightPath ? (
                    <path
                        d={spotlightPath}
                        fill="rgba(50, 90, 150, 0.55)"
                        fillRule="evenodd"
                    />
                ) : (
                    <rect width={w} height={h} fill="rgba(50, 90, 150, 0.55)" />
                )}

                {spotlight && (
                    <rect
                        x={spotlight.x}
                        y={spotlight.y}
                        width={spotlight.width}
                        height={spotlight.height}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.85)"
                        strokeWidth="2.5"
                        rx="8"
                        style={{
                            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(175,219,255,0.6))"
                        }}
                    />
                )}
            </OverlaySvg>

            <SkipBtn onClick={stop}>Skip ✕</SkipBtn>

            {/* ✅ Line only renders when there's a real spotlight to point at */}
            {showLine && (
                <LineSvg key={currentStep}>
                    <path
                        d={`M ${beeTail.x} ${beeTail.y} Q ${cpX} ${cpY} ${targetX} ${targetY}`}
                        stroke="#FFF59A"
                        strokeWidth="6"
                        strokeDasharray="16 10"
                        fill="none"
                        strokeLinecap="round"
                    />
                </LineSvg>
            )}

            <CardWrapper
                key={step.id}
                $centered={!!step.modalPosition.transform}
                style={{
                    top: step.modalPosition.top,
                    bottom: step.modalPosition.bottom,
                    left: step.modalPosition.left,
                    right: step.modalPosition.right,
                }}
            >
                <BeeWrapper ref={beeRef}>
                    <TutorialBeeIcon style={{ width: "100%", height: "auto" }} />
                </BeeWrapper>
                <Card>
                    <CardTitle>{step.title}</CardTitle>
                    {(step.body || step.highlight) && (
                        <CardBody>
                            {step.body}{step.body ? " " : ""}
                            <CardHighlight>{step.highlight}</CardHighlight>
                            {step.id === "timer" && " and complete a task!"}
                        </CardBody>
                    )}
                </Card>
            </CardWrapper>

            <DotsRow>
                <ArrowBtn onClick={prev} disabled={currentStep === 0}>‹</ArrowBtn>
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <Dot key={i} $active={i === currentStep} />
                ))}
                <ArrowBtn onClick={next}>
                    {currentStep === totalSteps - 1 ? "✓" : "›"}
                </ArrowBtn>
            </DotsRow>
        </>
    );
}