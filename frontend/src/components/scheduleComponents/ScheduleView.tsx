import type { ScheduleViewProps } from "./ScheduleViewProps";
import ScheduleViewHeader from "./ScheduleViewHeader";
import { getWeekDays, TIME_COL_WIDTH } from "../../utils/weekGridUtils";
import DraggableWeekGrid from "./DraggableWeekGrid.tsx";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const GridBorder = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.25rem;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aab8c8;
  font-size: 14px;
`;

const DayHeadersRow = styled.div`
  display: flex;
  flex-shrink: 0;
`;

const HeaderTimeSpacer = styled.div`
  width: ${TIME_COL_WIDTH}px;
  flex-shrink: 0;
`;

const HeaderDaysContainer = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
`;

const HeaderDayCell = styled.div`
  flex: 1;
  min-width: 80px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TodayPill = styled.div`
  background: #4b94db;
  color: white;
  border-radius: 10px;
  padding: 1px 10px;
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

export default function ScheduleView({ schedule, onGenerate, onEdit, onDoneEditing, onBlocksChange, onCalendarBlockToggle, isLocked, calendarMode, onSetCalendarMode, hasGoogleCalendar }: ScheduleViewProps) {
    const weekDays = getWeekDays();

    return (
        <Wrapper>
            <ScheduleViewHeader
                onGenerate={onGenerate ?? (() => {})}
                onEdit={onEdit}
                onDoneEditing={onDoneEditing}
                isLocked={isLocked}
                hasSchedule={!!schedule && schedule.blocks.length > 0}
                calendarMode={calendarMode}
                onSetCalendarMode={onSetCalendarMode}
                hasGoogleCalendar={hasGoogleCalendar}
            />

            <DayHeadersRow>
                <HeaderTimeSpacer />
                <HeaderDaysContainer>
                    {weekDays.map((day) => (
                        <HeaderDayCell key={day.date}>
                            {day.isToday
                                ? <TodayPill>{day.label}</TodayPill>
                                : <DayLabel>{day.label}</DayLabel>
                            }
                        </HeaderDayCell>
                    ))}
                </HeaderDaysContainer>
            </DayHeadersRow>

            <GridBorder>
                {schedule ? (
                    <DraggableWeekGrid
                        blocks={schedule.blocks}
                        onBlocksChange={onBlocksChange ?? (() => {})}
                        onBlockDelete={onCalendarBlockToggle}
                        readOnly={isLocked}
                        hideHeaders
                    />
                ) : (
                    <EmptyState>No schedule yet — click Create Schedule to get started!</EmptyState>
                )}
            </GridBorder>
        </Wrapper>
    );
}
