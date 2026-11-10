import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { createPortal } from "react-dom";
import type { ScheduleBlock } from "../../types/ScheduleBlock";

export const HOUR_HEIGHT = 36;
export const GRID_START = 0;
const GRID_END = 24;
const SNAP_MINUTES = 15;

const DARK_COLOR_MAP: Record<string, string> = {
    "#FFF59A": "#9a7c10",
    "#4B94DB": "#1e5fa8",
    "#FFAFB1": "#b03848",
    "#C0E8AA": "#3d8030",
    "#C5AFFF": "#6040b8",
    "#F6C98A": "#b06818",
    "#FFC7E8": "#a03070",
};
import { TIME_COL_WIDTH, getWeekDays } from "../../utils/weekGridUtils";

function pad(n: number) { return String(n).padStart(2, "0"); }

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(mins: number): string {
    const clamped = Math.max(0, Math.min(GRID_END * 60, mins));
    return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}


const GridWrapper = styled.div`
  display: flex;
  overflow-y: auto;
  overflow-x: auto;
  flex: 1;
  align-items: flex-start;
`;

const TimeCol = styled.div<{ $noHeaderPad?: boolean }>`
  width: ${TIME_COL_WIDTH}px;
  flex-shrink: 0;
  padding-top: ${({ $noHeaderPad }) => ($noHeaderPad ? "0" : "22px")};
`;

const TimeLabel = styled.div`
  height: ${HOUR_HEIGHT}px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-right: 8px;
  padding-top: 2px;
  font-size: 10px;
  color: #9aabb8;
  box-sizing: border-box;
  [data-theme="dark"] & { color: #000000; }
`;

const DaysContainer = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
`;

const DayCol = styled.div<{ $isOver: boolean; $lightBg?: boolean; $isEnabled?: boolean }>`
  flex: 1;
  min-width: 80px;
  border-left: 1px solid ${({ $lightBg }) => ($lightBg ? "#e8e8e8" : "#ebebeb")};
  background: ${({ $isOver, $lightBg, $isEnabled }) =>
      $isOver
          ? "#e8f0fb"
          : $lightBg
          ? ($isEnabled ? "#ffffff" : "#f0f0f0")
          : "transparent"};
  transition: background 0.1s;
  [data-theme="dark"] & {
      border-left-color: rgba(0,0,0,0.2);
      background: ${({ $isOver, $lightBg, $isEnabled }) =>
          $isOver
              ? "#d8d4ee"
              : $lightBg
              ? ($isEnabled ? "#eeeeee" : "#e0e0e0")
              : "transparent"};
  }
`;

const DayHeaderArea = styled.div<{ $lightBg?: boolean }>`
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid ${({ $lightBg }) => ($lightBg ? "#e8e8e8" : "#e8eef4")};
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 10;
`;

const TodayPill = styled.div`
  background: #3a7bd5;
  color: white;
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const DayLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: #aab8c8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  [data-theme="dark"] & { color: black; }
`;

const DayBody = styled.div`
  position: relative;
  height: ${(GRID_END - GRID_START) * HOUR_HEIGHT}px;
`;

const HourLine = styled.div<{ $index: number; $lightBg?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $index }) => $index * HOUR_HEIGHT}px;
  border-top: 1px solid ${({ $lightBg }) => ($lightBg ? "#e8eaee" : "#e8eaee")};
  pointer-events: none;
  [data-theme="dark"] & { border-top-color: rgba(0,0,0,0.15); }
`;

const BlockEl = styled.div<{
    $top: number;
    $height: number;
    $isDragging: boolean;
    $bg?: string;
    $textColor?: string;
    $isCalendarEvent?: boolean;
    $isIgnored?: boolean;
    $dayDisabled?: boolean;
    $readOnly?: boolean;
}>`
  position: absolute;
  left: 1px;
  right: 1px;
  top: ${({ $top }) => $top}px;
  height: ${({ $height }) => Math.max(20, $height)}px;
  background: ${({ $bg, $isCalendarEvent, $isIgnored }) =>
      $isIgnored
          ? "rgba(180,180,180,0.18)"
          : $isCalendarEvent
          ? "rgba(58,123,213,0.12)"
          : ($bg ?? "#C5AFFF")};
  border: ${({ $isCalendarEvent, $isIgnored }) =>
      $isIgnored
          ? "1.5px dashed #bbb"
          : $isCalendarEvent
          ? "1.5px dashed #3a7bd5"
          : "1.5px solid rgba(0,0,0,0.1)"};
  color: ${({ $textColor, $isCalendarEvent, $isIgnored }) =>
      $isIgnored ? "#ffffff" : $isCalendarEvent ? "#2a5ba8" : ($textColor ?? "white")};
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  cursor: ${({ $isCalendarEvent, $readOnly }) =>
      $readOnly ? "default" : $isCalendarEvent ? "pointer" : "grab"};
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: ${({ $isDragging, $isIgnored, $dayDisabled }) =>
      $isDragging ? 0.4 : $dayDisabled ? 0.22 : $isIgnored ? 0.6 : 1};
  filter: ${({ $dayDisabled }) => $dayDisabled ? "grayscale(1)" : "none"};
  z-index: ${({ $isIgnored, $isCalendarEvent }) =>
      $isIgnored ? 1 : $isCalendarEvent ? 5 : 4};
  transition: ${({ $isCalendarEvent }) =>
      $isCalendarEvent
          ? "opacity 0.15s"
          : "opacity 0.15s, filter 0.15s, background 0.15s, border-color 0.15s"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:active { cursor: ${({ $isCalendarEvent, $readOnly }) =>
      $readOnly ? "default" : $isCalendarEvent ? "pointer" : "grabbing"}; }
  [data-theme="dark"] & {
      background: ${({ $isCalendarEvent, $isIgnored, $bg }) =>
          $isIgnored
              ? "rgba(180,180,180,0.18)"
              : $isCalendarEvent
              ? "rgba(80,55,140,0.45)"
              : ($bg ?? "#6040b8")};
      border-color: ${({ $isCalendarEvent, $isIgnored }) =>
          $isIgnored ? "#bbb" : $isCalendarEvent ? "#7a6fc4" : "rgba(255,255,255,0.15)"};
      color: ${({ $textColor, $isCalendarEvent, $isIgnored }) =>
          $isIgnored ? "#ffffff" : $isCalendarEvent ? "#c8c0f0" : ($textColor ?? "white")};
  }
`;

const DeleteBtn = styled.button<{ $textColor?: string }>`
  flex-shrink: 0;
  margin-left: 4px;
  background: rgba(0,0,0,0.12);
  border: none;
  color: ${({ $textColor }) => $textColor ?? "white"};
  border-radius: 4px;
  font-size: 9px;
  line-height: 1;
  padding: 1px 3px;
  cursor: pointer;
  &:hover { background: rgba(0,0,0,0.25); }
`;

const Tooltip = styled.div`
  position: fixed;
  z-index: 9999;
  background: #1e1e2e;
  color: #f0f0f0;
  border-radius: 8px;
  padding: 10px 13px;
  min-width: 180px;
  max-width: 280px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.35);
  pointer-events: none;
`;

const TooltipTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  word-break: break-word;
`;

const TooltipDesc = styled.div`
  font-size: 11px;
  color: #b0b8c8;
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TooltipTime = styled.div`
  font-size: 11px;
  color: #8899aa;
  font-weight: 600;
`;

function DraggableBlock({ block, onDelete, readOnly, dayDisabled }: { block: ScheduleBlock; onDelete?: (id: string) => void; readOnly?: boolean; dayDisabled?: boolean; }) {
    const startMins = timeToMinutes(block.start) - GRID_START * 60;
    const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
    const top = (startMins / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const isCalendarEvent = block.isCalendarEvent ?? false;
    const isIgnored = block.isIgnored ?? false;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: { block },
        disabled: isCalendarEvent,
    });

    const { isDark } = useTheme();
    const lightBg = block.color;
    const bg = isDark ? (DARK_COLOR_MAP[lightBg ?? ""] ?? lightBg) : lightBg;
    const textColor = isDark ? "white" : "#1a1a1a";

    return (
        <>
            <BlockEl
                ref={isCalendarEvent ? undefined : setNodeRef}
                style={{
                    transform: isCalendarEvent ? undefined : CSS.Translate.toString(transform),
                }}
                $top={top}
                $height={height}
                $isDragging={isDragging}
                $bg={bg}
                $textColor={textColor}
                $isCalendarEvent={isCalendarEvent}
                $isIgnored={isIgnored}
                $dayDisabled={dayDisabled}
                $readOnly={readOnly}
                onMouseEnter={(e) => { if (!isDragging) setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e) => { if (!isDragging) setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                onMouseLeave={() => setTooltipPos(null)}
                onPointerDown={isCalendarEvent && !readOnly ? (e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    if (e.button === 0 && onDelete) onDelete(block.id);
                } : undefined}
                onClick={undefined}
                {...(isCalendarEvent ? {} : listeners)}
                {...(isCalendarEvent ? {} : attributes)}
            >
                <span style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textDecoration: isIgnored ? "line-through" : "none",
                }}>
                    {block.title}
                </span>
                {onDelete && !isCalendarEvent && !readOnly && (
                    <DeleteBtn
                        $textColor={textColor}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                    >
                        ✕
                    </DeleteBtn>
                )}
            </BlockEl>

            {tooltipPos && !isDragging && createPortal(
                <Tooltip style={{ top: tooltipPos.y + 14, left: tooltipPos.x + 14 }}>
                    <TooltipTitle style={{ textDecoration: isIgnored ? "line-through" : "none" }}>
                        {block.title}
                    </TooltipTitle>
                    {block.description && <TooltipDesc>{block.description}</TooltipDesc>}
                    <TooltipTime>{block.start} – {block.end}</TooltipTime>
                    {isCalendarEvent && (
                        <div style={{ fontSize: 10, color: "#7a96b0", marginTop: 4 }}>
                            {isIgnored
                                ? "Excluded — tasks may overlap this slot. Click to re-include."
                                : "Click to exclude from scheduling."}
                        </div>
                    )}
                </Tooltip>,
                document.body
            )}
        </>
    );
}

function DroppableDay({
    date,
    label,
    isToday,
    isEnabled,
    blocks,
    lightBg,
    onDelete,
    hideHeader,
    readOnly,
}: {
    date: string;
    label: string;
    isToday: boolean;
    isEnabled?: boolean;
    blocks: ScheduleBlock[];
    lightBg?: boolean;
    onDelete?: (id: string) => void;
    hideHeader?: boolean;
    readOnly?: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: date });
    const hourCount = GRID_END - GRID_START;

    return (
        <DayCol $isOver={isOver} $lightBg={lightBg} $isEnabled={isEnabled}>
            {!hideHeader && (
                <DayHeaderArea $lightBg={lightBg}>
                    {isToday ? <TodayPill>{label}</TodayPill> : <DayLabel>{label}</DayLabel>}
                </DayHeaderArea>
            )}
            <DayBody ref={setNodeRef} data-date={date}>
                {Array.from({ length: hourCount }, (_, i) => (
                    <HourLine key={i} $index={i} $lightBg={lightBg} />
                ))}
                {blocks.map((b) => (
                    <DraggableBlock key={b.id} block={b} onDelete={onDelete} readOnly={readOnly} dayDisabled={!isEnabled} />
                ))}
            </DayBody>
        </DayCol>
    );
}

type Props = {
    blocks: ScheduleBlock[];
    onBlocksChange: (blocks: ScheduleBlock[]) => void;
    onBlockDelete?: (id: string) => void;  // optional custom delete handler (e.g. for calendar events)
    lightBg?: boolean;
    readOnly?: boolean;
    enabledDays?: string[];
    hideHeaders?: boolean;
    scrollToHour?: number;
};

export default function DraggableWeekGrid({ blocks, onBlocksChange, onBlockDelete, lightBg, readOnly, enabledDays, hideHeaders, scrollToHour }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Default scroll to specified hour (or 6am) on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = (scrollToHour ?? 6) * HOUR_HEIGHT;
        }
    }, [scrollToHour]);

    const allWeekDays = getWeekDays();
    const weekDays = allWeekDays;
    const hours = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: readOnly ? { distance: Infinity } : { distance: 5 },
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: readOnly ? { delay: Infinity, tolerance: 0 } : { delay: 200, tolerance: 5 },
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    function handleDelete(id: string) {
        if (readOnly) return;
        const block = blocks.find((b) => b.id === id);
        if (block?.isCalendarEvent) {
            if (onBlockDelete) onBlockDelete(id);
        } else {
            onBlocksChange(blocks.filter((b) => b.id !== id));
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        if (readOnly) return;
        const { active, delta, over } = event;
        const block = active.data.current?.block as ScheduleBlock | undefined;
        if (!block) return;

        const minutesDelta =
            Math.round(((delta.y / HOUR_HEIGHT) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
        const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
        const newStartMins = Math.max(
            GRID_START * 60,
            Math.min(GRID_END * 60 - duration, timeToMinutes(block.start) + minutesDelta)
        );
        const newEndMins = newStartMins + duration;
        const newDate = (over?.id as string) ?? block.date;

        const hasOverlap = blocks.some((b) => {
            if (b.id === block.id || b.date !== newDate) return false;
            if (b.isCalendarEvent && b.isIgnored) return false; // can overlap greyed-out events
            const bStart = timeToMinutes(b.start);
            const bEnd = timeToMinutes(b.end);
            return newStartMins < bEnd && bStart < newEndMins;
        });
        if (hasOverlap) return;

        onBlocksChange(
            blocks.map((b) =>
                b.id === block.id
                    ? {
                          ...b,
                          start: minutesToTime(newStartMins),
                          end: minutesToTime(newStartMins + duration),
                          date: newDate,
                      }
                    : b
            )
        );
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <GridWrapper ref={scrollRef}>
                <TimeCol $noHeaderPad={hideHeaders}>
                    {hours.map((h) => (
                        <TimeLabel key={h}>
                            {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                        </TimeLabel>
                    ))}
                </TimeCol>
                <DaysContainer>
                    {weekDays.map((day) => (
                        <DroppableDay
                            key={day.date}
                            date={day.date}
                            label={day.label}
                            isToday={day.isToday}
                            isEnabled={!enabledDays || enabledDays.includes(day.date)}
                            blocks={blocks.filter((b) => b.date === day.date)}
                            lightBg={lightBg}
                            onDelete={handleDelete}
                            hideHeader={hideHeaders}
                            readOnly={readOnly}
                        />
                    ))}
                </DaysContainer>
            </GridWrapper>
        </DndContext>
    );
}
