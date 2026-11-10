import { PLANT_CONFIG, STAGE_SCALE_DEFAULTS } from "../../types/PlantConfig";

export function PlantVisual({ variety, stage }: { variety: string; stage: number }) {
    const config = PLANT_CONFIG[variety as keyof typeof PLANT_CONFIG];
    if (!config) return null;

    const StageComponent = config.stages[stage - 1] ?? config.stages[config.stages.length - 1];
    if (!StageComponent) return null;

    const scale = STAGE_SCALE_DEFAULTS[stage - 1] ?? 1.0;


    return (
        <div style={{ height: "100%", display: "flex", alignItems: "flex-end" }}>
            <StageComponent style={{
                height: `${scale * 100}%`,
                width: "auto",
                display: "block",
            }} />
        </div>
    );
}
