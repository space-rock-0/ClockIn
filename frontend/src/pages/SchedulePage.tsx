import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasksForUser } from "../api/taskApi";
import { generateSchedule, acceptBlock, rejectBlock } from "../api/scheduleApi";
import DraggableWeekGrid from "../components/scheduleComponents/DraggableWeekGrid";
import type { ScheduleBlock } from "../types/ScheduleBlock";
import type { Task } from "../types/Task";
import type { ScheduleFilters } from "../types/ScheduleFilters";
import "./SchedulePage.css";

const CHIP_COLORS = ["#fef3c7", "#dbeafe", "#fce7f3", "#d1fae5", "#ede9fe", "#fee2e2", "#e0f2fe"];

const STYLE_PRESETS: Record<string, Omit<ScheduleFilters, "allowed_days">> = {
    Balanced:           { deadline: "none", importance: "none", value: "none", time: "none", subject: "none" },
    "Deadline First":   { deadline: "desc", importance: "none", value: "none", time: "none", subject: "none" },
    "Importance First": { deadline: "none", importance: "desc", value: "none", time: "none", subject: "none" },
    "Morning Heavy":    { deadline: "none", importance: "none", value: "none", time: "none", subject: "none" },
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_ACTIVE = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

type TaskWithId = Task & { id: string };

export default function SchedulePage({ onClose }: { onClose?: () => void }) {
    const { user } = useAuth();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [accepted, setAccepted] = useState(false);
    const [style, setStyle] = useState("Balanced");
    const [activeDays, setActiveDays] = useState<Set<string>>(new Set(DEFAULT_ACTIVE));
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getTasksForUser()
            .then(setAllTasks)
            .catch((err: unknown) => console.error(err));
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedTasks = allTasks.filter((t): t is TaskWithId =>
        t.id !== undefined && selectedIds.has(t.id)
    );
    const unselectedTasks = allTasks.filter((t): t is TaskWithId =>
        t.id !== undefined && !selectedIds.has(t.id)
    );
    const dropdownTasks = unselectedTasks.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase())
    );

    function addTask(id: string) {
        setSelectedIds(prev => new Set([...prev, id]));
        setSearch("");
        inputRef.current?.focus();
    }

    function removeTask(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }

    function toggleDay(day: string) {
        setActiveDays(prev => {
            const next = new Set(prev);
            if (next.has(day)) {
                next.delete(day);
            } else {
                next.add(day);
            }
            return next;
        });
    }

    async function handleGenerate() {
        if (!user || selectedIds.size === 0) return;
        setLoading(true);
        try {
            const filters: ScheduleFilters = {
                ...STYLE_PRESETS[style],
                allowed_days: Array.from(activeDays),
            };
            const schedule = await generateSchedule(Array.from(selectedIds), filters, user.id);
            setBlocks(schedule.blocks);
            setAccepted(false);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    function handleBlocksChange(newBlocks: ScheduleBlock[]) {
        if (!user) return;
        const movedBlock = newBlocks.find(nb => {
            const old = blocks.find(b => b.id === nb.id);
            return old && (old.start !== nb.start || old.date !== nb.date);
        });
        if (movedBlock) {
            const old = blocks.find(b => b.id === movedBlock.id)!;
            rejectBlock(
                movedBlock.task_id!,
                `${old.date}T${old.start}:00`,
                user.id
            ).catch((err: unknown) => console.error(err));
        }
        setAccepted(false);
        setBlocks(newBlocks);
    }

    async function handleAccept() {
        if (!user || blocks.length === 0) return;
        await Promise.all(
            blocks.map(b =>
                acceptBlock(b.task_id!, `${b.date}T${b.start}:00`, `${b.date}T${b.end}:00`, user.id)
            )
        );
        setAccepted(true);
    }

    return (
        <div className="sp-overlay" onClick={onClose}>
            <div className="sp-page" onClick={e => e.stopPropagation()}>
                <div className="sp-content">

                    {/* ── Top section ── */}
                    <div className="sp-top">
                        {onClose && (
                            <button className="sp-close-btn" onClick={onClose} title="Close">×</button>
                        )}

                        {/* Tasks area */}
                        <div className="sp-tasks-area">
                            <div className="sp-section-label">Tasks</div>
                            <div className="sp-chips-row">
                                {selectedTasks.map((t, i) => (
                                    <div
                                        key={t.id}
                                        className="sp-chip"
                                        style={{ background: CHIP_COLORS[i % CHIP_COLORS.length] }}
                                    >
                                        <span className="sp-chip-title">{t.title}</span>
                                        {t.task_duration && (
                                            <span className="sp-chip-dur">{t.task_duration}min</span>
                                        )}
                                        <button className="sp-chip-x" onClick={() => removeTask(t.id)}>×</button>
                                    </div>
                                ))}

                                {/* Add task input */}
                                <div className="sp-add-wrap" style={{ position: "relative" }}>
                                    <input
                                        ref={inputRef}
                                        className="sp-add-input"
                                        placeholder="Add task..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && dropdownTasks.length > 0 && (
                                        <div className="sp-dropdown" ref={dropdownRef}>
                                            {dropdownTasks.map(t => (
                                                <button
                                                    key={t.id}
                                                    className="sp-dropdown-item"
                                                    onMouseDown={() => addTask(t.id)}
                                                >
                                                    <span className="sp-dropdown-title">{t.title}</span>
                                                    {t.task_duration && (
                                                        <span className="sp-dropdown-dur">{t.task_duration}min</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="sp-plus-btn"
                                    onClick={() => { setShowDropdown(true); inputRef.current?.focus(); }}
                                    title="Add task"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Schedule style + Generate */}
                        <div className="sp-style-panel">
                            <div className="sp-section-label">Schedule Style</div>
                            <select
                                className="sp-style-select"
                                value={style}
                                onChange={e => setStyle(e.target.value)}
                            >
                                {Object.keys(STYLE_PRESETS).map(k => (
                                    <option key={k}>{k}</option>
                                ))}
                            </select>
                            <button
                                className="sp-generate-btn"
                                onClick={handleGenerate}
                                disabled={loading || selectedIds.size === 0}
                            >
                                <span>📅</span>
                                {loading ? "Generating..." : "Generate"}
                            </button>
                            {blocks.length > 0 && !accepted && (
                                <button className="sp-accept-btn" onClick={handleAccept}>
                                    Accept Schedule
                                </button>
                            )}
                            {accepted && <span className="sp-accepted-badge">✓ Accepted</span>}
                        </div>
                    </div>

                    {/* ── Days selector ── */}
                    <div className="sp-days-row">
                        <span className="sp-days-label">📅 Days</span>
                        {ALL_DAYS.map(day => (
                            <button
                                key={day}
                                className={`sp-day-btn ${activeDays.has(day) ? "sp-day-active" : ""}`}
                                onClick={() => toggleDay(day)}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {/* ── Grid area ── */}
                    <div className="sp-grid-area">
                        {blocks.length > 0 ? (
                            <DraggableWeekGrid blocks={blocks} onBlocksChange={handleBlocksChange} />
                        ) : (
                            <div className="sp-empty-state">
                                <div className="sp-empty-icon">📅</div>
                                <p>Select tasks and generate your schedule</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
