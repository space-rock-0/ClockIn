import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { initializeWeights } from "../../api/onboardingApi";
import type { PriorityStyle } from "../../api/onboardingApi";
import { createBusyTime } from "../../api/busyTimesApi";
import { getGoogleStatus, startGoogleLogin } from "../../api/googleApi";
import { supabase } from "../../supabaseClient";
import TutorialBeeIcon from "../icons/TutorialBeeIcon";

// ── Types ──────────────────────────────────────────────────────────────────────

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface BlockedRange {
    id: string;
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
}

interface SurveyState {
    displayName: string;
    timePreferences: Set<TimeOfDay>;
    blockedRanges: BlockedRange[];
    priorityStyle: PriorityStyle;
}

interface Props {
    userId: string;
    onComplete: (displayName: string) => void;
    isReopening?: boolean;
}

const TIME_OF_DAY_OPTIONS: { id: TimeOfDay; label: string; sub: string }[] = [
    { id: "morning",   label: "Morning",   sub: "6am – 12pm" },
    { id: "afternoon", label: "Afternoon", sub: "12pm – 5pm" },
    { id: "evening",   label: "Evening",   sub: "5pm – 9pm"  },
    { id: "night",     label: "Night",     sub: "9pm – 12am" },
];

const PRIORITY_OPTIONS: { id: PriorityStyle; label: string; desc: string }[] = [
    {
        id: "important_first",
        label: "Most important first",
        desc: "Tackle the tasks that matter most, regardless of deadline.",
    },
    {
        id: "urgent_first",
        label: "Due soonest first",
        desc: "Clear what's due soon to avoid last-minute scrambles.",
    },
    {
        id: "balanced",
        label: "A balanced mix",
        desc: "Weigh both importance and urgency equally.",
    },
];

const TOTAL_STEPS = 6;

// ── Animations ─────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
`;

// ── Styled Components ──────────────────────────────────────────────────────────

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 24px;
    width: min(520px, 92vw);
    max-height: 90vh;
    overflow-y: auto;
    padding: 40px 44px 36px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
    animation: ${fadeIn} 0.25s ease;
`;

const ProgressRow = styled.div`
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-bottom: 32px;
`;

const Dot = styled.div<{ $active: boolean; $done: boolean }>`
    width: ${({ $active }) => ($active ? "22px" : "8px")};
    height: 8px;
    border-radius: 4px;
    background: ${({ $active, $done }) =>
        $active ? "#f5d94e" : $done ? "#b8d4f0" : "#e0e0e0"};
    transition: all 0.25s ease;
`;

const StepWrapper = styled.div`
    animation: ${fadeIn} 0.2s ease;
`;

const StepTitle = styled.h2`
    font-size: 22px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0 0 8px 0;
`;

const StepSub = styled.p`
    font-size: 14px;
    color: #777;
    margin: 0 0 28px 0;
    line-height: 1.5;
`;

const Input = styled.input`
    width: 100%;
    padding: 13px 16px;
    border: 1.5px solid #e0e0e0;
    border-radius: 12px;
    font-size: 15px;
    font-family: inherit;
    color: #1a1a1a;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
    &:focus { border-color: #f5d94e; }
    &::placeholder { color: #aaa; }
`;

const PillGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

const TimePill = styled.button<{ $selected: boolean }>`
    padding: 14px 12px;
    border-radius: 14px;
    border: 2px solid ${({ $selected }) => ($selected ? "#f5d94e" : "#e8e8e8")};
    background: ${({ $selected }) => ($selected ? "#fffde7" : "#fafafa")};
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    &:hover {
        border-color: ${({ $selected }) => ($selected ? "#e8c84a" : "#ccc")};
    }
`;

const TimePillLabel = styled.div`
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
`;

const TimePillSub = styled.div`
    font-size: 12px;
    color: #888;
    margin-top: 2px;
`;

const BlockRow = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
`;

const TimeInput = styled.input`
    flex: 1;
    padding: 10px 12px;
    border: 1.5px solid #e0e0e0;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    &:focus { border-color: #f5d94e; }
`;

const TimeLabel = styled.span`
    font-size: 13px;
    color: #888;
    flex-shrink: 0;
`;

const RemoveBlockBtn = styled.button`
    background: none;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    color: #999;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    &:hover { border-color: #ccc; color: #555; }
`;

const AddRangeBtn = styled.button`
    width: 100%;
    padding: 10px;
    border: 1.5px dashed #d0d0d0;
    border-radius: 10px;
    background: none;
    color: #888;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    &:hover { border-color: #aaa; color: #555; }
`;

const OptionCard = styled.button<{ $selected: boolean }>`
    width: 100%;
    padding: 16px 18px;
    border: 2px solid ${({ $selected }) => ($selected ? "#f5d94e" : "#e8e8e8")};
    border-radius: 14px;
    background: ${({ $selected }) => ($selected ? "#fffde7" : "#fafafa")};
    text-align: left;
    cursor: pointer;
    margin-bottom: 10px;
    transition: all 0.15s;
    &:hover {
        border-color: ${({ $selected }) => ($selected ? "#e8c84a" : "#ccc")};
    }
`;

const OptionLabel = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
`;

const OptionDesc = styled.div`
    font-size: 13px;
    color: #888;
    margin-top: 3px;
`;

const CalBtn = styled.button<{ $connected: boolean }>`
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: 2px solid ${({ $connected }) => ($connected ? "#4caf50" : "#e0e0e0")};
    background: ${({ $connected }) => ($connected ? "#f1fff3" : "#fafafa")};
    color: ${({ $connected }) => ($connected ? "#2e7d32" : "#333")};
    font-size: 15px;
    font-weight: 700;
    cursor: ${({ $connected }) => ($connected ? "default" : "pointer")};
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.15s;
    &:hover:not(:disabled) { border-color: #ccc; }
`;

const SkipLink = styled.button`
    background: none;
    border: none;
    color: #aaa;
    font-size: 13px;
    cursor: pointer;
    margin-top: 14px;
    width: 100%;
    text-align: center;
    font-family: inherit;
    &:hover { color: #666; }
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 32px;
`;

const BackBtn = styled.button`
    padding: 13px 22px;
    border: 1.5px solid #e0e0e0;
    border-radius: 12px;
    background: none;
    color: #555;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    &:hover { border-color: #aaa; }
`;

const NextBtn = styled.button<{ $disabled?: boolean }>`
    flex: 1;
    padding: 13px 22px;
    border-radius: 12px;
    border: none;
    background: ${({ $disabled }) => ($disabled ? "#e0e0e0" : "#f5d94e")};
    color: ${({ $disabled }) => ($disabled ? "#aaa" : "#1a1a1a")};
    font-size: 15px;
    font-weight: 800;
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
    font-family: inherit;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #e8c84a; }
`;

const DoneTitle = styled.h2`
    font-size: 24px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0 0 12px 0;
    text-align: center;
`;

const DoneSub = styled.p`
    font-size: 14px;
    color: #777;
    text-align: center;
    line-height: 1.6;
    margin: 0 0 32px 0;
`;

const BeeIcon = styled(TutorialBeeIcon)`
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 16px;
`;

const ErrorText = styled.p`
    font-size: 13px;
    color: #c0392b;
    margin: 8px 0 0;
`;

// ── Component ──────────────────────────────────────────────────────────────────

export default function OnboardingSurvey({ userId, onComplete, isReopening = false }: Props) {
    const [step, setStep] = useState(1);
    const [survey, setSurvey] = useState<SurveyState>({
        displayName: "",
        timePreferences: new Set<TimeOfDay>(),
        blockedRanges: [],
        priorityStyle: "balanced",
    });
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [checkingGoogle, setCheckingGoogle] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Poll Google status every 3 seconds on step 2
    useEffect(() => {
        if (step !== 2) return;
        let mounted = true;
        const check = () => {
            getGoogleStatus()
                .then((s: { connected: boolean }) => {
                    if (mounted) setIsGoogleConnected(s.connected);
                })
                .catch(() => {});
        };
        check();
        const interval = setInterval(check, 3000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [step]);

    function toggleTimePreference(t: TimeOfDay) {
        setSurvey((prev) => {
            const next = new Set(prev.timePreferences);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            return { ...prev, timePreferences: next };
        });
    }

    function addBlockedRange() {
        setSurvey((prev) => ({
            ...prev,
            blockedRanges: [
                ...prev.blockedRanges,
                { id: crypto.randomUUID(), startTime: "22:00", endTime: "23:59" },
            ],
        }));
    }

    function updateBlockedRange(id: string, field: "startTime" | "endTime", value: string) {
        setSurvey((prev) => ({
            ...prev,
            blockedRanges: prev.blockedRanges.map((r) =>
                r.id === id ? { ...r, [field]: value } : r
            ),
        }));
    }

    function removeBlockedRange(id: string) {
        setSurvey((prev) => ({
            ...prev,
            blockedRanges: prev.blockedRanges.filter((r) => r.id !== id),
        }));
    }

    function handleQuickSave() {
        if (!isReopening) return;
        initializeWeights(userId, {
            priorityStyle: survey.priorityStyle,
            timePreferences: Array.from(survey.timePreferences),
        }).catch(() => {});
        const name = survey.displayName.trim();
        if (name) localStorage.setItem(`clockin_display_name:${userId}`, name);
        onComplete(name || "there");
    }

    async function handleConnectGoogle() {
        setCheckingGoogle(true);
        setError(null);
        try {
            const url = await startGoogleLogin();
            const popup = window.open(url, "clockin-google", "width=600,height=700");
            if (!popup) setError("Allow pop-ups for ClockIn to connect Google Calendar.");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not connect Google Calendar.");
        } finally {
            setCheckingGoogle(false);
        }
    }

    async function handleFinish() {
        setSubmitting(true);
        setError(null);
        try {
            // Always save weights
            await initializeWeights(userId, {
                priorityStyle: survey.priorityStyle,
                timePreferences: Array.from(survey.timePreferences),
            });

            if (!isReopening) {
                // First-time only: save blocked ranges as busy times
                const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
                await Promise.all(
                    survey.blockedRanges
                        .filter((r) => r.startTime && r.endTime && r.startTime < r.endTime)
                        .map((r) =>
                            createBusyTime({
                                title: "Blocked (preferences)",
                                start_time: r.startTime + ":00",
                                end_time: r.endTime + ":00",
                                days_of_week: ALL_DAYS,
                                source: "manual",
                            })
                        )
                );
                // Persist in both localStorage (fast path) and Supabase user metadata
                // (device-agnostic source of truth so the survey never re-appears on a new device)
                localStorage.setItem(`clockin_onboarding_done:${userId}`, "true");
                await supabase.auth.updateUser({ data: { onboarding_done: true } });
            }

            // Always save display name
            const name = survey.displayName.trim() || "there";
            localStorage.setItem(`clockin_display_name:${userId}`, name);
            onComplete(name);
        } catch {
            setError("Could not save your preferences — make sure the backend is running and try again.");
            setSubmitting(false);
        }
    }

    const canAdvanceStep1 = survey.displayName.trim().length > 0;

    return (
        <Overlay onClick={handleQuickSave}>
            <Card onClick={(e) => e.stopPropagation()}>
                {/* Progress dots */}
                <ProgressRow>
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <Dot key={i} $active={step === i + 1} $done={step > i + 1} />
                    ))}
                </ProgressRow>

                {step === 1 && (
                    <StepWrapper>
                        <StepTitle style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            What should we call you? <TutorialBeeIcon style={{ width: 36, height: "auto" }} />
                        </StepTitle>
                        <StepSub>
                            We'll use this to personalize your ClockIn experience.
                        </StepSub>
                        <Input
                            type="text"
                            placeholder="Your preferred name"
                            value={survey.displayName}
                            onChange={(e) =>
                                setSurvey((p) => ({ ...p, displayName: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && canAdvanceStep1 && setStep(2)}
                            autoFocus
                        />
                        <ButtonRow>
                            <NextBtn
                                $disabled={!canAdvanceStep1}
                                disabled={!canAdvanceStep1}
                                onClick={() => setStep(2)}
                            >
                                Next →
                            </NextBtn>
                        </ButtonRow>
                    </StepWrapper>
                )}

                {step === 2 && (
                    <StepWrapper>
                        <StepTitle>Connect Google Calendar</StepTitle>
                        <StepSub>
                            See your existing events while scheduling so there are no conflicts.
                            You can always connect it later in Settings.
                        </StepSub>
                        {isGoogleConnected ? (
                            <CalBtn $connected={true} disabled>
                                ✓ Google Calendar connected!
                            </CalBtn>
                        ) : (
                            <CalBtn $connected={false} onClick={handleConnectGoogle}>
                                <span>🗓</span> Connect Google Calendar
                            </CalBtn>
                        )}
                        {checkingGoogle && !isGoogleConnected && (
                            <StepSub style={{ marginTop: 12, marginBottom: 0 }}>
                                Waiting for connection… (checking every few seconds)
                            </StepSub>
                        )}
                        <SkipLink onClick={() => setStep(3)}>Skip for now →</SkipLink>
                        <ButtonRow>
                            <BackBtn onClick={() => setStep(1)}>← Back</BackBtn>
                            <NextBtn onClick={() => setStep(3)}>
                                {isGoogleConnected ? "Next →" : "Skip →"}
                            </NextBtn>
                        </ButtonRow>
                    </StepWrapper>
                )}

                {step === 3 && (
                    <StepWrapper>
                        <StepTitle>When do you like to study?</StepTitle>
                        <StepSub>Select all that apply — we'll prioritize these time blocks.</StepSub>
                        <PillGrid>
                            {TIME_OF_DAY_OPTIONS.map((opt) => (
                                <TimePill
                                    key={opt.id}
                                    $selected={survey.timePreferences.has(opt.id)}
                                    onClick={() => toggleTimePreference(opt.id)}
                                >
                                    <TimePillLabel>{opt.label}</TimePillLabel>
                                    <TimePillSub>{opt.sub}</TimePillSub>
                                </TimePill>
                            ))}
                        </PillGrid>
                        <ButtonRow>
                            <BackBtn onClick={() => setStep(2)}>← Back</BackBtn>
                            <NextBtn onClick={() => setStep(4)}>Next →</NextBtn>
                        </ButtonRow>
                    </StepWrapper>
                )}

                {step === 4 && (
                    <StepWrapper>
                        <StepTitle>Any times you never want to work?</StepTitle>
                        <StepSub>
                            These time slots will be blocked every day — the scheduler will never
                            place work here.
                        </StepSub>

                        {survey.blockedRanges.map((range) => (
                            <BlockRow key={range.id}>
                                <TimeInput
                                    type="time"
                                    value={range.startTime}
                                    onChange={(e) =>
                                        updateBlockedRange(range.id, "startTime", e.target.value)
                                    }
                                />
                                <TimeLabel>to</TimeLabel>
                                <TimeInput
                                    type="time"
                                    value={range.endTime}
                                    onChange={(e) =>
                                        updateBlockedRange(range.id, "endTime", e.target.value)
                                    }
                                />
                                <RemoveBlockBtn onClick={() => removeBlockedRange(range.id)}>
                                    ✕
                                </RemoveBlockBtn>
                            </BlockRow>
                        ))}

                        <AddRangeBtn onClick={addBlockedRange}>+ Add a time range</AddRangeBtn>

                        <ButtonRow>
                            <BackBtn onClick={() => setStep(3)}>← Back</BackBtn>
                            <NextBtn onClick={() => setStep(5)}>Next →</NextBtn>
                        </ButtonRow>
                    </StepWrapper>
                )}

                {step === 5 && (
                    <StepWrapper>
                        <StepTitle>When juggling multiple tasks...</StepTitle>
                        <StepSub>
                            This sets your scheduling starting point — ClockIn will keep learning
                            your preferences as you use it.
                        </StepSub>
                        {PRIORITY_OPTIONS.map((opt) => (
                            <OptionCard
                                key={opt.id}
                                $selected={survey.priorityStyle === opt.id}
                                onClick={() =>
                                    setSurvey((p) => ({ ...p, priorityStyle: opt.id }))
                                }
                            >
                                <OptionLabel>{opt.label}</OptionLabel>
                                <OptionDesc>{opt.desc}</OptionDesc>
                            </OptionCard>
                        ))}
                        <ButtonRow>
                            <BackBtn onClick={() => setStep(4)}>← Back</BackBtn>
                            <NextBtn onClick={() => setStep(6)}>Next →</NextBtn>
                        </ButtonRow>
                    </StepWrapper>
                )}

                {step === 6 && (
                    <StepWrapper>
                        <BeeIcon />
                        <DoneTitle>
                            {isReopening
                                ? "Preferences updated!"
                                : `You're all set, ${survey.displayName.trim() || "there"}!`}
                        </DoneTitle>
                        <DoneSub>
                            {isReopening
                                ? "Your scheduling preferences have been saved. ClockIn will use these going forward."
                                : "Your schedule is now personalized from day one. The more you use ClockIn, the smarter it gets — it learns your habits over time."}
                        </DoneSub>
                        {error && <ErrorText>{error}</ErrorText>}
                        <NextBtn
                            $disabled={submitting}
                            disabled={submitting}
                            onClick={handleFinish}
                        >
                            {submitting ? "Saving…" : isReopening ? "Save" : "Let's go!"}
                        </NextBtn>
                    </StepWrapper>
                )}
            </Card>
        </Overlay>
    );
}
