import { useState } from "react";
import { PlantVisual } from "./PlantVisual";
import { PLANT_CONFIG } from "../../types/PlantConfig";
type PlantVariety = keyof typeof PLANT_CONFIG;

const rarityColors: Record<string, string> = {
    common: "#888888",
    rare: "#AFDBFF",
    epic: "#C5AFFF",
    legendary: "#FFC7E8",
};

export default function PlantRevealSequence({
                                                plants,
                                                completedCounts,
                                                onClose,
                                            }: {
    plants: { variety: string; is_new: boolean }[];
    completedCounts: Record<string, number>;
    onClose: () => void;
}) {
    const [index, setIndex] = useState(0);

    const current = plants[index];
    if (!current) return null;

    const config = PLANT_CONFIG[current.variety as keyof typeof PLANT_CONFIG];

    const totalOwned = completedCounts[current.variety] ?? 0;
    const remainingThisSession = plants
        .slice(index + 1)
        .filter(p => p.variety === current.variety).length;

    const priorCount = Math.max(1, totalOwned - remainingThisSession);

    const isLast = index === plants.length - 1;

    const rarityStyle = getRarityStyle(config.rarity);

    return (
        <div style={overlay}>
            <div style={card}>

                {/* SKIP ALL */}
                <button style={skipAll} onClick={onClose}>
                    Skip all ✕
                </button>

                {/* TITLE */}
                <h2 style={title}>
                    {config.name}
                </h2>

                {/* PLANT */}
                <div style={plantSection}>
                    <PlantVisual
                        variety={current.variety as PlantVariety}
                        stage={config.stages.length}
                    />
                </div>

                {/* TEXT */}
                <div style={text}>
                    {current.is_new
                        ? "🌟 New species found!"
                        : `You now have ${priorCount} of this plant!`}
                </div>

                {/* RARITY */}
                <div style={rarityStyle}>
                    {config.rarity}
                </div>

                {/* BUTTON ROW */}
                <div style={buttonRow}>
                    {!isLast ? (
                        <button
                            onClick={() => setIndex(i => i + 1)}
                            style={primaryBtn}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            style={primaryBtn}
                        >
                            Return →
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

/* ================= RARITY STYLE ================= */

function getRarityStyle(rarity: string): React.CSSProperties {
    const color = rarityColors[rarity.toLowerCase()] ?? "#888";

    return {
        fontSize: "1.6rem", // 2x bigger
        fontWeight: 700,
        marginTop: "0.6rem",
        color,
        textTransform: "capitalize",
        textShadow: `0 0 8px ${color}55`, // subtle glow
    };
}

/* ================= STYLES ================= */

const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
};

const card: React.CSSProperties = {
    background: "#F5F5F5",
    borderRadius: "20px",
    padding: "2.8rem 2.2rem",
    width: "460px",
    maxWidth: "92vw",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    position: "relative",
};

const skipAll: React.CSSProperties = {
    position: "absolute",
    top: "15px",
    right: "20px",
    background: "transparent",
    border: "none",
    fontSize: "0.8rem",
    color: "#666",
    cursor: "pointer",
};

const title: React.CSSProperties = {
    marginBottom: "0.5rem",
    fontSize: "1.4rem",
    fontWeight: 700,
};

const plantSection: React.CSSProperties = {
    height: "260px",
    margin: "1rem 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const text: React.CSSProperties = {
    fontSize: "0.95rem",
    marginTop: "0.3rem",
};

const buttonRow: React.CSSProperties = {
    marginTop: "1.6rem",
    display: "flex",
    justifyContent: "flex-end",
};

const primaryBtn: React.CSSProperties = {
    padding: "0.5rem 1.1rem",
    background: "#F2D16B",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.85rem",
};