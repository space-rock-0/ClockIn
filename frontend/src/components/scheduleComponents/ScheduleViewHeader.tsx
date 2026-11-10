import styled from "styled-components";
import CalendarIcon from "../icons/CalendarIcon";

type Props = {
    onGenerate: () => void;
    onEdit?: () => void;
    onDoneEditing?: () => void;
    isLocked?: boolean;
    hasSchedule?: boolean;
    calendarMode?: "off" | "active" | "all";
    onSetCalendarMode?: (mode: "off" | "active" | "all") => void;
    hasGoogleCalendar?: boolean;
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.4rem 0 0.6rem 0;
  gap: 0;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const IconWrapper = styled.div`
  width: 62px;
  height: 62px;
  flex-shrink: 0;
  svg { width: 100%; height: 100%; }
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin: 0;
  white-space: nowrap;
  font-size: 2.6rem;
  font-weight: 700;
  font-style: italic;
  color: #1a1a1a;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  margin: 2px 0 0 0;
  font-size: 0.8rem;
  font-weight: 400;
  font-style: italic;
  color: #bbb;

  [data-theme="dark"] & {
    color: #000000;
  }
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const DateBlock = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

const DateSmall = styled.span`
  font-size: 0.8rem;
  color: #c8d0d8;
  font-weight: 600;

  [data-theme="dark"] & {
    color: #000000;
  }
`;

const DateBig = styled.span`
  font-size: 1.9rem;
  color: #c8d0d8;
  font-weight: 700;
  line-height: 1;
  margin: 0 2px;

  [data-theme="dark"] & {
    color: #000000;
  }
`;

const CreateButton = styled.button`
  background: #FFF59A;
  border: none;
  border-radius: 20px;
  padding: 8px 10px;
  font-size: 15px;
  font-weight: 300;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: background 0.15s;
  &:hover { background: #FFF59A; }
`;

const BtnIconWrapper = styled.span`
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  svg { width: 100%; height: 100%; }
`;

const PlusBadge = styled.span`
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  background: #4b94db;
  border-radius: 50%;
  color: white;
  font-size: 11px;
  font-weight: 900;
  line-height: 14px;
  text-align: center;
  border: 1.5px solid #FFF59A;
`;

const EditButton = styled.button`
  border: 1.5px solid #C5AFFF;
  color: #C5AFFF;
  border-radius: 20px;
  padding: 5px 13px;
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: rgba(108,92,231,0.06); }
  [data-theme="dark"] & {
    color: black;
    border-color: rgba(0,0,0,0.35);
  }
`;

const DoneButton = styled.button`
  border: 1.5px solid #22c55e;
  color: #22c55e;
  border-radius: 20px;
  padding: 5px 13px;
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover { background: rgba(34,197,94,0.06); }
`;

const ScheduledBadge = styled.span`
  font-size: 10px;
  color: #22c55e;
  font-weight: 700;
  [data-theme="dark"] & { color: black; }
`;

const CalModeWrap = styled.div`
  display: flex;
  align-items: center;
  border: 1.5px solid #d0d8e8;
  border-radius: 20px;
  overflow: hidden;
  flex-shrink: 0;
  [data-theme="dark"] & { border-color: rgba(0,0,0,0.3); }
`;

const CalModeSegment = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#4b94db" : "transparent")};
  color: ${({ $active }) => ($active ? "white" : "#9aabb8")};
  border: none;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.13s;
  &:not(:last-child) { border-right: 1.5px solid #d0d8e8; }
  &:hover:not([disabled]) {
    background: ${({ $active }) => ($active ? "#3a7bd5" : "rgba(75,148,219,0.08)")};
    color: ${({ $active }) => ($active ? "white" : "#4b94db")};
  }
  [data-theme="dark"] & {
    color: ${({ $active }) => ($active ? "white" : "black")};
    &:not(:last-child) { border-right-color: rgba(0,0,0,0.2); }
  }
`;

export default function ScheduleViewHeader({ onGenerate, onEdit, onDoneEditing, isLocked, hasSchedule, calendarMode, onSetCalendarMode, hasGoogleCalendar }: Props) {
    const now = new Date();

    return (
        <Wrapper>
            <Left>
                <IconWrapper><CalendarIcon /></IconWrapper>
                <TitleBlock>
                    <Title>Your Schedule</Title>
                    <Subtitle>catered to what's most important to you...</Subtitle>
                </TitleBlock>
            </Left>

            <Center>
                {!isLocked && hasSchedule ? (
                    <DoneButton onClick={() => onDoneEditing?.()}>Done Editing ✓</DoneButton>
                ) : (
                    <div data-tutorial-id="schedule">
                        <CreateButton onClick={onGenerate}>
                            Create Schedule
                            <BtnIconWrapper>
                                <CalendarIcon />
                                <PlusBadge>+</PlusBadge>
                            </BtnIconWrapper>
                        </CreateButton>
                    </div>
                )}
                {isLocked && (
                    <>
                        <EditButton onClick={() => onEdit?.()}>Edit Schedule</EditButton>
                        <ScheduledBadge>✓ Scheduled</ScheduledBadge>
                    </>
                )}
                {hasGoogleCalendar && onSetCalendarMode && (
                    <CalModeWrap>
                        <CalModeSegment $active={calendarMode === "off"} onClick={() => onSetCalendarMode("off")}>
                            Off
                        </CalModeSegment>
                        <CalModeSegment $active={calendarMode === "active"} onClick={() => onSetCalendarMode("active")}>
                            Active
                        </CalModeSegment>
                        <CalModeSegment $active={calendarMode === "all"} onClick={() => onSetCalendarMode("all")}>
                            All
                        </CalModeSegment>
                    </CalModeWrap>
                )}
            </Center>

            <DateBlock>
                <DateSmall>{now.toLocaleDateString("en-US", { weekday: "short" })}</DateSmall>
                <DateBig>{now.getDate()}</DateBig>
                <DateSmall>{now.toLocaleDateString("en-US", { month: "short" })}</DateSmall>
            </DateBlock>
        </Wrapper>
    );
}
