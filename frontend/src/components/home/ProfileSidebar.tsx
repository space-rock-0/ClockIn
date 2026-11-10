import styled from "styled-components";
import { useAuth } from "../../context/AuthContext.tsx";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/Routes.ts";
import ProfileLeavesIcon from "../icons/ProfileLeavesIcon";
import ProfileTimerIcon from "../icons/ProfileTimerIcon";
import ProfileBeeIcon from "../icons/ProfileBeeIcon";
import DailyStreakIcon from "../icons/DailyStreakIcon.tsx";
import { getStats } from "../../api/statsApi.ts";

/* ── Types ───────────────────────── */

interface UserStats {
    plants_grown: number;
    total_hours: number;
    day_streak: number;
}


/* ── Styles ──────────────────────── */

const Overlay = styled.div<{ $open: boolean }>`
    position: fixed;
    inset: 0;
    z-index: 99;
    pointer-events: ${p => p.$open ? "auto" : "none"};
`;

const Panel = styled.div<{ $open: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    width: clamp(260px, 20vw, 340px);
    height: 100%;
    background: #F1F1F1;
    border-right: 6px solid #636363;
    box-shadow: 4px 0 24px rgba(0,0,0,0.10);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 24px 32px;
    gap: 0;
    z-index: 100;
    overflow: visible;
    transform: translateX(${p => p.$open ? "0" : "-100%"});
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
    font-size: clamp(0.7rem, 1rem, 1.2rem);
`;

const PanelTitle = styled.div`
    color: #636363;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
    font-style: italic;
    font-weight: 700;
`;

const ScrollArea = styled.div`
    flex: 1;
    width: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    /* 🔥 Hide scrollbar (Chrome, Safari) */
    &::-webkit-scrollbar {
        display: none;
    }

    /* 🔥 Hide scrollbar (Firefox) */
    scrollbar-width: none;

    /* 🔥 Hide scrollbar (IE/Edge old) */
    -ms-overflow-style: none;
`;

const ProfileBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding-bottom: 28px;
    width: 100%;
`;

const AvatarWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const BeeIcon = styled(ProfileBeeIcon)`
    width: clamp(70px, 90px, 110px);
    height: clamp(70px, 90px, 110px);
`;

const UserName = styled.div`
    font-weight: 700;
    font-size: 1.5em;
    color: #636363;
    text-align: center;
`;

const UserSub = styled.div`
    color: #636363;
    text-align: center;
`;

const StatBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 24px 0;
    width: 100%;
`;

const StatRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const LeavesIcon = styled(ProfileLeavesIcon)`
    width: 34px;
    height: 34px;
`;

const TimerIcon = styled(ProfileTimerIcon)`
    width: 34px;
    height: 34px;
`;

const StreakIcon = styled(DailyStreakIcon)`
    width: 34px;
    height: 34px;
`;

const StatValue = styled.span`
    font-size: 2rem;
    font-weight: 800;
    color: #222;
    line-height: 1;
`;

const StatLabel = styled.div`
    color: #000;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
    font-size: clamp(0.6rem, 0.9rem, 1.1rem);
`;

const BottomSection = styled.div`
    margin-top: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const SectionLabel = styled.div`
    font-weight: 700;
    color: #000;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0 4px 8px;
    font-size: clamp(0.6rem, 0.9rem, 1.1rem);
`;

const ActionRow = styled.button`
    background: none;
    border: none;
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.15s;
    &:hover {
        background: rgba(0,0,0,0.06);
    }
`;

const ActionIcon = styled.span`
    width: 20px;
    text-align: center;
`;

const ActionLabel = styled.span`
    flex: 1;
    text-align: left;
    color: #444;
`;

const ActionChevron = styled.span`
    font-size: 0.75rem;
    color: #bbb;
`;

const SignOutLabel = styled(ActionLabel)`
    color: #e05a5a;
`;

/* ── Props ───────────────────────── */

interface Props {
    open: boolean;
    onClose: () => void;
}

/* ── Component ───────────────────── */

export default function ProfileSidebar({ open, onClose }: Props) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        if (!open) return;
        getStats()
            .then(setStats)
            .catch((err: unknown) => console.error(err));
    }, [open]);

    return (
        <Overlay $open={open} onClick={onClose}>
            <Panel $open={open} onClick={e => e.stopPropagation()}>

                <PanelTitle>Home</PanelTitle>

                <ScrollArea>
                    {/* Box 1 — Avatar + Name */}
                    <ProfileBox>
                        <AvatarWrapper>
                            <BeeIcon />
                        </AvatarWrapper>
                        <UserName>{user?.email?.split("@")[0] ?? "User"}</UserName>
                        <UserSub>@{user?.username ?? "username"}</UserSub>
                    </ProfileBox>

                    {/* Box 2 — Plants */}
                    <StatBox>
                        <StatRow>
                            <StatValue>{stats?.plants_grown ?? "--"}</StatValue>
                            <LeavesIcon />
                        </StatRow>
                        <StatLabel>Total Plants Grown</StatLabel>
                    </StatBox>

                    {/* Box 3 — Hours */}
                    <StatBox>
                        <StatRow>
                            <StatValue>{stats?.total_hours ?? "--"}</StatValue>
                            <TimerIcon />
                        </StatRow>
                        <StatLabel>Total Hours Worked</StatLabel>
                    </StatBox>

                    {/* Box 4 — Streak */}
                    <StatBox>
                        <StatRow>
                            <StatValue>{stats?.day_streak ?? "--"}</StatValue>
                            <StreakIcon />
                        </StatRow>
                        <StatLabel>Day Study Streak</StatLabel>
                    </StatBox>
                </ScrollArea>


                {/* Bottom links */}
                <BottomSection>
                    <SectionLabel>Account</SectionLabel>

                    <ActionRow onClick={() => {
                        navigate(ROUTES.SETTINGS);
                        onClose();
                    }}>
                        <ActionIcon>⚙️</ActionIcon>
                        <ActionLabel>Settings</ActionLabel>
                        <ActionChevron>›</ActionChevron>
                    </ActionRow>

                    <ActionRow>
                        <ActionIcon>🎓</ActionIcon>
                        <ActionLabel>How it works</ActionLabel>
                        <ActionChevron>›</ActionChevron>
                    </ActionRow>

                    <ActionRow onClick={async () => {
                        await signOut();
                        onClose();
                    }}>
                        <ActionIcon>🚪</ActionIcon>
                        <SignOutLabel>Sign Out</SignOutLabel>
                        <ActionChevron>›</ActionChevron>
                    </ActionRow>
                </BottomSection>

            </Panel>
        </Overlay>
    );
}
