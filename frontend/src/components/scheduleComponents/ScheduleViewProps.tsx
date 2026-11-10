import type {Schedule} from "../../types/Schedule.ts";
import type {ScheduleBlock} from "../../types/ScheduleBlock.ts";
import type {Task} from "../../types/Task";

export type ScheduleViewProps = {
    schedule: Schedule | null;
    onBlockClick?: (item: ScheduleBlock | Task | null) => void;
    onGenerate?: () => void;
    onEdit?: () => void;
    onDoneEditing?: () => void;
    onBlocksChange?: (blocks: ScheduleBlock[]) => void;
    isLocked?: boolean;
    calendarMode?: "off" | "active" | "all";
    onSetCalendarMode?: (mode: "off" | "active" | "all") => void;
    hasGoogleCalendar?: boolean;
    onCalendarBlockToggle?: (blockId: string) => void;
}
