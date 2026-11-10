import { motion } from "framer-motion";
import { PlantVisual } from "./PlantVisual";
import { useEffect, useRef, useState } from "react";
import { PLANT_CONFIG } from "../../types/PlantConfig";

type PlantVariety = keyof typeof PLANT_CONFIG;

export default function PlantStageAnimator({
                                               variety,
                                               stage,
                                           }: {
    variety: PlantVariety;
    stage: number;
}) {
    const [displayStage, setDisplayStage] = useState(stage);
    const [showSparkle, setShowSparkle] = useState(false);

    const [isStageIncrease, setIsStageIncrease] = useState(false);
    const [isNewPlant, setIsNewPlant] = useState(false);

    const prevStageRef = useRef(stage);

    const config = PLANT_CONFIG[variety];
    const maxStage = config?.stages.length ?? 1;

    const [randomOffsets] = useState(() =>
        Array.from({ length: 16 }).map(() => ({
            x: 150 + Math.random() * 100,
            y: 80 + Math.random() * 120,
        }))
    );

    useEffect(() => {
        const prevStage = prevStageRef.current;

        const increase = stage > prevStage;
        const newPlant = stage === 1 && prevStage !== 1;
        const sparkle = stage === 1 && prevStage === maxStage;

        setIsStageIncrease(increase);
        setIsNewPlant(newPlant);

        // 🌱 Growth timing
        if (increase) {
            setTimeout(() => {
                setDisplayStage(stage);
            }, 120);
        } else {
            setDisplayStage(stage);
        }

        // ✨ Sparkle trigger
        if (sparkle) {
            setShowSparkle(true);

            setTimeout(() => {
                setShowSparkle(false);
            }, 600);
        }

        prevStageRef.current = stage;
    }, [stage, maxStage]);

    return (
        <div style={container}>

            {/* 🌱 PLANT */}
            <motion.div
                key={displayStage}
                initial={false}
                animate={
                    isNewPlant
                        ? {
                            scale: [0.6, 1],
                            opacity: [0, 1],
                        }
                        : isStageIncrease
                            ? {
                                scaleY: [1, 1.18, 1],
                                scaleX: [1, 1.03, 1],
                            }
                            : {}
                }
                transition={{
                    duration: 0.35,
                    ease: "easeOut",
                }}
                style={plantWrapper}
            >
                <PlantVisual variety={variety} stage={displayStage} />
            </motion.div>

            {/* ✨ SPARKLES */}
            {showSparkle && (
                <div style={sparkleContainer}>
                    {Array.from({ length: stage === maxStage ? 16 : 12 }).map((_, i) => {
                        const angle = (i / 16) * Math.PI * 2;

                        const distanceX = Math.cos(angle) * randomOffsets[i].x;
                        const distanceY = Math.sin(angle) * randomOffsets[i].y;

                        return (
                            <motion.div
                                key={i}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: distanceX,
                                    y: -distanceY,
                                    opacity: 0,
                                    scale: 0.6,
                                    rotate: 180,
                                }}
                                transition={{
                                    duration: 1.1,
                                    ease: "easeOut",
                                }}
                                style={{
                                    ...sparkle,
                                    background: "white",
                                }}
                            />
                        );
                    })}
                </div>
            )}

        </div>
    );
}

/* ================= STYLES ================= */

const container: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative",
};

const plantWrapper: React.CSSProperties = {
    transformOrigin: "bottom center",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%",
    height: "100%",
};

const sparkleContainer: React.CSSProperties = {
    position: "absolute",
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
};

const sparkle: React.CSSProperties = {
    width: "5px",
    height: "22px",
    background: "white",
    borderRadius: "1px",
    position: "absolute",
};