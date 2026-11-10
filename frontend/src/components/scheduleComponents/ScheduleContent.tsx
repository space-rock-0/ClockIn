import type { ScheduleViewProps } from "./ScheduleViewProps";
import ScheduleBlock from "./ScheduleBlock";

export default function ScheduleContent({ schedule, onBlockClick }: ScheduleViewProps) {
    if (!schedule) return null;
    return (
        <>
            {schedule.blocks.map(block => (
                <ScheduleBlock
                    key={block.id}
                    block={block}
                    onClick={() => onBlockClick?.(block)}
                />
            ))}
        </>
    );
}