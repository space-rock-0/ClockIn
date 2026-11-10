import styled, { keyframes } from "styled-components";
import { useState, useEffect, useRef } from "react";
import type { TimeValue, BusyTimeData } from "../../types/BusyTime";

export type { BusyTimeData } from "../../types/BusyTime";

/* ── Helpers ─────────────────────── */

const HOURS   = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const MINUTES = ["00", "15", "30", "45"];
const DAYS    = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function toMinutes(t: TimeValue): number {
    let h = parseInt(t.hour);
    if (t.ampm === "PM" && h !== 12) h += 12;
    if (t.ampm === "AM" && h === 12) h = 0;
    return h * 60 + parseInt(t.minute);
}

function isEndBeforeStart(start: TimeValue, end: TimeValue): boolean {
    return toMinutes(end) <= toMinutes(start);
}

function findOverlaps(current: BusyTimeData, existing: BusyTimeData[], editingTitle?: string): string[] {
    const errors: string[] = [];

    for (const other of existing) {
        if (other.title === editingTitle) continue;

        const overlappingDays = current.days.filter(d => other.days.includes(d));
        if (overlappingDays.length === 0) continue;

        const currentStart = toMinutes(current.start);
        const currentEnd   = toMinutes(current.end);
        const otherStart   = toMinutes(other.start);
        const otherEnd     = toMinutes(other.end);

        const overlaps = currentStart < otherEnd && currentEnd > otherStart;
        if (overlaps) {
            errors.push(`"${other.title}" on ${overlappingDays.join(", ")}`);
        }
    }

    return errors;
}

/* ── Animations ──────────────────── */

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-4px); }
    40%       { transform: translateX(4px); }
    60%       { transform: translateX(-3px); }
    80%       { transform: translateX(3px); }
`;

/* ── Styles ──────────────────────── */

const Container = styled.div`
    width: 100%;
    border-radius: 12px;
    background: white;
    border: 2px solid #e0e0e0;
    box-shadow: -3px 3px 10px 0px #d0d0d0;
    overflow: hidden;
    animation: ${slideUp} 0.2s ease;
`;

const TitleInput = styled.input<{ $error?: boolean }>`
    width: 100%;
    border: none;
    border-bottom: 2px solid ${({ $error }) => ($error ? "#e53935" : "transparent")};
    background: ${({ $error }) => ($error ? "#fff5f5" : "#f0f0f0")};
    padding: 8px 10px;
    font-weight: bold;
    font-size: 1rem;
    outline: none;
    box-sizing: border-box;
    transition: background 0.15s, border-color 0.15s;
    &:focus { background: #e8e8e8; }
    &::placeholder { color: ${({ $error }) => ($error ? "#e57373" : "#aaa")}; }
`;

const Content = styled.div`
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const RowHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Label = styled.span<{ $error?: boolean }>`
    font-size: 0.8rem;
    color: ${({ $error }) => ($error ? "#e53935" : "#888")};
    font-weight: ${({ $error }) => ($error ? "600" : "normal")};
    transition: color 0.15s;
`;

const SmallBtn = styled.button`
    font-size: 0.72rem;
    color: #666;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-weight: 600;
    &:hover { text-decoration: underline; color: #333; }
`;

const TimeRow = styled.div<{ $error?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 4px 6px;
    border-radius: 7px;
    border: 1.5px solid ${({ $error }) => ($error ? "#e53935" : "transparent")};
    background: ${({ $error }) => ($error ? "#fff5f5" : "transparent")};
    transition: border-color 0.15s, background 0.15s;
`;

const SmallSelect = styled.select<{ $error?: boolean }>`
    padding: 5px 6px;
    border: 1.5px solid ${({ $error }) => ($error ? "#e53935" : "#ddd")};
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
    transition: border-color 0.15s;
    &:focus { outline: 2px solid #ccc; border-color: #aaa; }
`;

const TimeSeparator = styled.span`
    font-size: 0.9rem;
    color: #888;
`;

const ErrorMsg = styled.div`
    font-size: 0.72rem;
    color: #e53935;
    margin-top: 2px;
`;

const DaysRow = styled.div<{ $error?: boolean }>`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 7px;
    border: 1.5px solid ${({ $error }) => ($error ? "#e53935" : "transparent")};
    background: ${({ $error }) => ($error ? "#fff5f5" : "transparent")};
    transition: border-color 0.15s, background 0.15s;
`;

const Day = styled.button<{ $selected: boolean }>`
    padding: 5px 10px;
    border-radius: 6px;
    border: 1.5px solid ${({ $selected }) => ($selected ? "#555" : "#ccc")};
    background: ${({ $selected }) => ($selected ? "#e0e0e0" : "#f5f5f5")};
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s;
    color: ${({ $selected }) => ($selected ? "#222" : "#777")};
    &:hover { border-color: #555; }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid #eee;
    margin: 0;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
`;

const FooterLeft = styled.div`
    display: flex;
    gap: 8px;
`;

const FooterRight = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const CancelBtn = styled.button`
    padding: 7px 16px;
    border-radius: 8px;
    border: 1.5px solid #ddd;
    background: white;
    font-size: 0.85rem;
    font-weight: 600;
    color: #888;
    cursor: pointer;
    &:hover { border-color: #bbb; color: #555; }
`;

const SaveBtn = styled.button<{ $disabled: boolean }>`
    padding: 7px 18px;
    border-radius: 8px;
    border: none;
    background: ${p => (p.$disabled ? "#e0e0e0" : "#555")};
    color: ${p => (p.$disabled ? "#aaa" : "white")};
    font-size: 0.85rem;
    font-weight: 600;
    cursor: ${p => (p.$disabled ? "not-allowed" : "pointer")};
    transition: background 0.15s;
    &:hover { background: ${p => (p.$disabled ? "#e0e0e0" : "#333")}; }
`;

const DuplicateBtn = styled.button`
    padding: 7px 14px;
    border-radius: 8px;
    border: 1.5px solid #ddd;
    background: white;
    font-size: 0.82rem;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    &:hover { border-color: #aaa; color: #333; }
`;

const SaveErrorMsg = styled.div<{ $visible: boolean; $shake: boolean }>`
    font-size: 0.78rem;
    color: #e53935;
    font-weight: 600;
    max-width: 220px;
    text-align: right;
    line-height: 1.3;
    opacity: ${p => (p.$visible ? 1 : 0)};
    transition: opacity 0.15s;
    animation: ${p => (p.$shake ? shake : "none")} 0.35s ease;
`;

/* ── Sub-component: TimePicker ───── */

interface TimePickerProps {
    value: TimeValue;
    onChange: (val: TimeValue) => void;
    onBlur?: () => void;
    highlightRow?: boolean;
    error?: boolean;
}

function TimePicker({ value, onChange, onBlur, highlightRow, error }: TimePickerProps) {
    return (
        <TimeRow $error={highlightRow}>
            <SmallSelect
                value={value.hour}
                onChange={e => onChange({ ...value, hour: e.target.value })}
                onBlur={onBlur}
                $error={error}
            >
                {HOURS.map(h => <option key={h}>{h}</option>)}
            </SmallSelect>

            <TimeSeparator>:</TimeSeparator>

            <SmallSelect
                value={value.minute}
                onChange={e => onChange({ ...value, minute: e.target.value })}
                onBlur={onBlur}
                $error={error}
            >
                {MINUTES.map(m => <option key={m}>{m}</option>)}
            </SmallSelect>

            <SmallSelect
                value={value.ampm}
                onChange={e => onChange({ ...value, ampm: e.target.value as "AM" | "PM" })}
                onBlur={onBlur}
                $error={error}
            >
                <option>AM</option>
                <option>PM</option>
            </SmallSelect>
        </TimeRow>
    );
}

/* ── Props ───────────────────────── */

interface Props {
    initial?: Partial<BusyTimeData>;
    existingTimes?: BusyTimeData[];
    onSave: (data: BusyTimeData) => void;
    onCancel: () => void;
    onDuplicate?: () => void;
}

/* ── Component ───────────────────── */

export default function BusyTimeCard({ initial, existingTimes, onSave, onCancel, onDuplicate }: Props) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [start, setStart] = useState<TimeValue>(initial?.start ?? { hour: "6", minute: "00", ampm: "AM" });
    const [end,   setEnd]   = useState<TimeValue>(initial?.end   ?? { hour: "7", minute: "00", ampm: "AM" });
    const [days,  setDays]  = useState<string[]>(initial?.days   ?? []);

    // Track which fields have been "touched" (blurred at least once)
    const [touched, setTouched] = useState({ title: false, start: false, end: false });

    // Controls the shake animation on the save error message
    const [saveShake, setSaveShake] = useState(false);

    // Whether the user has attempted to save (triggers all-field validation display)
    const [saveAttempted, setSaveAttempted] = useState(false);

    const titleRef = useRef<HTMLInputElement>(null);
    useEffect(() => { titleRef.current?.focus(); }, []);

    const timeError     = isEndBeforeStart(start, end);
    const overlapErrors = findOverlaps({ title, start, end, days }, existingTimes ?? [], initial?.title);
    const canSave       = title.trim().length > 0 && days.length > 0 && !timeError && overlapErrors.length === 0;

    // Which fields are "visibly invalid" — only after touched or save attempted
    const showTitleError = (touched.title || saveAttempted) && title.trim().length === 0;
    // Time error highlights both start and end — either picker blurring is enough
    const showTimeError  = (touched.start || touched.end || saveAttempted) && timeError;
    const showDaysError  = saveAttempted && days.length === 0;

    // Build the "missing required field" message for the save button
    const missingFields: string[] = [];
    if (title.trim().length === 0) missingFields.push("title");
    if (days.length === 0) missingFields.push("days");
    if (timeError) missingFields.push("valid end time");

    const saveErrorText = saveAttempted && missingFields.length > 0
        ? `Missing required: ${missingFields.join(", ")}`
        : saveAttempted && overlapErrors.length > 0
            ? "Fix overlap errors before saving"
            : "";

    function touch(field: keyof typeof touched) {
        setTouched(prev => ({ ...prev, [field]: true }));
    }

    function toggleDay(day: string) {
        setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    }

    function handleSave() {
        setSaveAttempted(true);
        if (!canSave) {
            // Trigger shake on error message
            setSaveShake(false);
            requestAnimationFrame(() => setSaveShake(true));
            return;
        }
        onSave({ title, start, end, days });
    }

    function handleTitleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            const first = document.querySelector<HTMLSelectElement>(".busy-time-first-select");
            first?.focus();
        }
    }

    return (
        <Container>
            <TitleInput
                ref={titleRef}
                placeholder="Busy time title *"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={() => touch("title")}
                $error={showTitleError}
            />

            <Content>
                <Row>
                    <Label $error={showTimeError}>Start</Label>
                    <TimePicker
                        value={start}
                        onChange={setStart}
                        onBlur={() => touch("start")}
                        highlightRow={showTimeError}
                        error={showTimeError}
                    />
                </Row>

                <Row>
                    <Label $error={showTimeError}>End</Label>
                    <TimePicker
                        value={end}
                        onChange={setEnd}
                        onBlur={() => touch("end")}
                        highlightRow={showTimeError}
                        error={showTimeError}
                    />
                    {showTimeError && <ErrorMsg>End time must be after start time</ErrorMsg>}
                </Row>

                <Row>
                    <RowHeader>
                        <Label $error={showDaysError}>Days {showDaysError ? "— select at least one" : ""}</Label>
                        <SmallBtn
                            type="button"
                            onClick={() => setDays(prev => prev.length === 7 ? [] : [...DAYS])}
                        >
                            {days.length === 7 ? "Clear all" : "Every day"}
                        </SmallBtn>
                    </RowHeader>
                    <DaysRow $error={showDaysError}>
                        {DAYS.map(d => (
                            <Day
                                key={d}
                                type="button"
                                $selected={days.includes(d)}
                                onClick={() => toggleDay(d)}
                            >
                                {d}
                            </Day>
                        ))}
                    </DaysRow>
                    {overlapErrors.map((err, i) => (
                        <ErrorMsg key={i}>Overlaps with {err}</ErrorMsg>
                    ))}
                </Row>
            </Content>

            <Divider />

            <Footer>
                <FooterLeft>
                    {onDuplicate && (
                        <DuplicateBtn type="button" onClick={onDuplicate}>
                            Duplicate
                        </DuplicateBtn>
                    )}
                </FooterLeft>
                <FooterRight>
                    <SaveErrorMsg $visible={!!saveErrorText} $shake={saveShake}>
                        {saveErrorText}
                    </SaveErrorMsg>
                    <CancelBtn type="button" onClick={onCancel}>Cancel</CancelBtn>
                    <SaveBtn type="button" $disabled={!canSave} onClick={handleSave}>
                        Save
                    </SaveBtn>
                </FooterRight>
            </Footer>
        </Container>
    );
}