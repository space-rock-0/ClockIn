import styled from "styled-components";
import BackButton from "../components/navigation/BackButton";
import { ROUTES } from "../constants/Routes";
import { useState, useEffect } from "react";
import BusyTimeItem from "../components/profileComponents/BusyTimeItem";
import BusyTimeModal from "../components/profileComponents/BusyTimeModal";
import type { BusyTimeData } from "../components/profileComponents/BusyTimeCard";
import { getBusyTimes, createBusyTime, updateBusyTime, deleteBusyTime } from "../api/busyTimesApi";
import type { BusyTimeRecord } from "../api/busyTimesApi";
import {formatTime, isoToTimeValue, timeValueToISO} from "../utils/busyTimeUtils.ts";

/* ── Types ───────────────────────── */

interface BusyTime extends Omit<BusyTimeData, 'id'> {
    id: string;
    source?: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BLOCK_COLORS = ["#AFDBFF", "#FFF59A"]; // Iceberg, Soft Canary
// const BLOCK_COLORS = ["#aaa"]; // Gray
/* ── Helpers ─────────────────────── */

// Convert DB record → frontend BusyTime
function recordToLocal(r: BusyTimeRecord): BusyTime {
    return {
        id: r.id,
        source: r.source,  // add this
        title: r.title,
        start: r.start_time ? isoToTimeValue(r.start_time) : { hour: "8", minute: "00", ampm: "AM" },
        end:   r.end_time   ? isoToTimeValue(r.end_time)   : { hour: "9", minute: "00", ampm: "AM" },
        days:  r.days_of_week ?? [],
    };
}

// Convert frontend BusyTimeData → API payload
function localToPayload(data: BusyTimeData) {
    return {
        title: data.title,
        start_time: timeValueToISO(data.start),
        end_time: timeValueToISO(data.end),
        days_of_week: data.days,
        source: "manual" as const,
    };
}

function getColorIndex(id: string, list: BusyTime[]): number {
    const idx = list.findIndex(b => b.id === id);
    return idx === -1 ? 0 : idx;
}

function formatTimeRange(b: BusyTime): string {
    return `${formatTime(b.start)} → ${formatTime(b.end)}`;
}

function daysLabel(days: string[]): string {
    if (days.length === 7) return "DAILY";
    return days.join(" • ");
}

/* ── Styles ──────────────────────── */

const Page = styled.div`
    width: 100vw;
    min-height: 100vh;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 60px;
    position: relative;
`;

const TopBar = styled.div`
    width: 100%;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    position: relative;
`;

const PageTitle = styled.div`
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: clamp(0.7rem, 1rem, 1.3rem);
    font-weight: 600;
    color: #4B94DB;
    letter-spacing: 0.04em;
`;

const PageBackButton = styled(BackButton)`
    color: #AFDBFF;
`;

const AddBtn = styled.button`
    margin-top: 24px;
    padding: 10px 24px;
    background: #4B94DB;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    width: min(960px, 95vw);
    text-align: left;
    &:hover { background: #3a7fc1; }
`;

const SectionLabel = styled.div`
    width: min(960px, 95vw);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #aaa;
    text-transform: uppercase;
    margin-top: 32px;
    margin-bottom: 10px;
`;

const GridWrapper = styled.div`
    width: min(960px, 95vw);
    border: 1.5px solid #e8e8e8;
    border-radius: 14px;
    overflow: hidden;
`;

const GridHeader = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f5f5f5;
    border-bottom: 1.5px solid #e8e8e8;
`;

const DayHeader = styled.div`
    padding: 10px 0;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #555;
    letter-spacing: 0.06em;
`;

const GridBody = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    min-height: 120px;
    align-items: start;
`;

const DayCol = styled.div`
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-right: 1px solid #f0f0f0;
    &:last-child { border-right: none; }
`;

const GridBlock = styled.button<{ $color: string }>`
    width: 100%;
    padding: 6px 8px;
    border-radius: 8px;
    border: none;
    background: ${({ $color }) => $color};
    text-align: left;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    &:hover { opacity: 0.8; transform: scale(1.02); }
`;

const BlockTitle = styled.div`
    font-size: 0.75rem;
    font-weight: 700;
    color: #222;
`;

const BlockTime = styled.div`
    font-size: 0.65rem;
    color: #555;
    margin-top: 2px;
`;

const ListWrapper = styled.div`
    width: min(960px, 95vw);
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const DayGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const DayGroupLabel = styled.div`
    font-size: 0.8rem;
    font-weight: 700;
    color: #4B94DB;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #AFDBFF;
`;

const ErrorMsg = styled.div`
    color: #e53935;
    font-size: 0.8rem;
    margin-top: 8px;
    text-align: center;
`;

const LoadingMsg = styled.div`
    color: #aaa;
    font-size: 0.85rem;
    margin-top: 40px;
`;

/* ── Component ───────────────────── */

export default function BusyTimes() {
    const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [editing, setEditing]     = useState<null | string>(null); // null=closed, "new"=adding, id=editing

    // ── Load on mount ──
    useEffect(() => {
        getBusyTimes()
            .then(records => setBusyTimes(records.map(recordToLocal)))
            .catch(() => setError("Failed to load busy times."))
            .finally(() => setLoading(false));
    }, []);

    // ── Save (create or update) ──
    async function handleSave(data: BusyTimeData) {
        const payload = localToPayload(data);
        try {
            if (editing === "new") {
                const created = await createBusyTime(payload);
                setBusyTimes(prev => [...prev, recordToLocal(created)]);
            } else if (editing) {
                const updated = await updateBusyTime(editing, payload);
                setBusyTimes(prev =>
                    prev.map(b => b.id === editing ? recordToLocal(updated) : b)
                );
            }
            setEditing(null);
        } catch {
            setError("Failed to save. Please try again.");
        }
    }

    // ── Delete ──
    async function handleDelete(id: string) {
        try {
            await deleteBusyTime(id);
            setBusyTimes(prev => prev.filter(b => b.id !== id));
        } catch {
            setError("Failed to delete. Please try again.");
        }
    }

    // ── Duplicate ──
    async function handleDuplicate(id: string) {
        const original = busyTimes.find(b => b.id === id);
        if (!original) return;
        const payload = localToPayload({
            title: `${original.title} (copy)`,
            start: original.start,
            end: original.end,
            days: original.days,
        });
        try {
            const created = await createBusyTime(payload);
            setBusyTimes(prev => [...prev, recordToLocal(created)]);
            setEditing(null);
        } catch {
            setError("Failed to duplicate. Please try again.");
        }
    }

    const editingItem = editing && editing !== "new"
        ? busyTimes.find(b => b.id === editing)
        : undefined;

    return (
        <Page>
            <TopBar>
                <PageBackButton to={ROUTES.AVAILABILITY} label="Availability" />
                <PageTitle>ClockIn</PageTitle>
            </TopBar>

            <AddBtn onClick={() => setEditing("new")}>+ Add Busy Time</AddBtn>

            {error && <ErrorMsg>{error}</ErrorMsg>}
            {loading && <LoadingMsg>Loading...</LoadingMsg>}

            {!loading && (
                <>
                    {/* ── Grid ── */}
                    <SectionLabel>Weekly Overview</SectionLabel>
                    <GridWrapper>
                        <GridHeader>
                            {DAYS.map(d => <DayHeader key={d}>{d}</DayHeader>)}
                        </GridHeader>
                        <GridBody>
                            {DAYS.map(day => (
                                <DayCol key={day}>
                                    {busyTimes
                                        .filter(b => b.days.includes(day))
                                        .map(b => (
                                            <GridBlock
                                                key={b.id}
                                                $color={BLOCK_COLORS[getColorIndex(b.id, busyTimes) % BLOCK_COLORS.length]}
                                                onClick={b.source === "google" ? undefined : () => setEditing(b.id)}
                                                style={{ cursor: b.source === "google" ? "default" : "pointer" }}
                                            >
                                                <BlockTitle>{b.title}</BlockTitle>
                                                <BlockTime>{formatTime(b.start)}</BlockTime>
                                                <BlockTime>{formatTime(b.end)}</BlockTime>
                                            </GridBlock>
                                        ))
                                    }
                                </DayCol>
                            ))}
                        </GridBody>
                    </GridWrapper>

                    {/* ── List ── */}
                    <SectionLabel>By Day</SectionLabel>
                    <ListWrapper>
                        {DAYS.map(day => {
                            const items = busyTimes.filter(b => b.days.includes(day));
                            if (items.length === 0) return null;
                            return (
                                <DayGroup key={day}>
                                    <DayGroupLabel>{day}</DayGroupLabel>
                                    {items.map(b => (
                                        <BusyTimeItem
                                            key={b.id}
                                            title={b.title}
                                            time={formatTimeRange(b)}
                                            days={daysLabel(b.days)}
                                            source={b.source}
                                            onEdit={() => setEditing(b.id)}
                                            onDelete={() => handleDelete(b.id)}
                                        />
                                    ))}
                                </DayGroup>
                            );
                        })}
                    </ListWrapper>
                </>
            )}

            {editing !== null && (
                <BusyTimeModal
                    onSave={handleSave}
                    onClose={() => setEditing(null)}
                    onDuplicate={editingItem ? () => handleDuplicate(editingItem.id) : undefined}
                />
            )}
        </Page>
    );
}