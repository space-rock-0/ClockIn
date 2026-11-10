import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import styled, { keyframes } from "styled-components";
import ProfileBeeIcon from "../components/icons/ProfileBeeIcon.tsx";
import BackButton from "../components/navigation/BackButton";
import {ROUTES} from "../constants/Routes.ts";
import { useNavigate } from "react-router-dom";
import OnboardingSurvey from "../components/onboardingComponents/OnboardingSurvey.tsx";
import { supabase } from "../supabaseClient";
import { authFetch } from "../api/authFetch";
import AISettingsPanel from "../components/AISettingsPanel";

const PageBackButton = styled(BackButton)`
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    color: #AFDBFF;
`;

const Page = styled.div`
    width: 100vw;
    min-height: 100vh;
    height: auto;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow-y: auto;  
    padding-bottom: 40px;

    [data-theme="dark"] & {
        background: #9f95c6;
    }
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
    margin-top: 0.3rem;

    [data-theme="dark"] & {
        color: #c8c0f0;
    }
`;

const Card = styled.div`
    margin-top: 40px;
    width: calc(100% - 48px); 
    max-width: 480px;
    background: #f5f5f5;
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    [data-theme="dark"] & {
        background: #857bb5;
    }
`;

const CardTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 800;
    color: #222;
    margin: 0 0 12px;

    [data-theme="dark"] & {
        color: #f0ecf8;
    }
`;

const ProfileBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding-bottom: 20px;
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

    [data-theme="dark"] & {
        color: #e0d8f0;
    }
`;

const UserSub = styled.div`
    color: #636363;
    text-align: center;

    [data-theme="dark"] & {
        color: #c8c0e8;
    }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid #ddd;
    width: 100%;
    margin: 0 auto;

    [data-theme="dark"] & {
        border-top-color: #6e65a0;
    }
`;

const SettingRow = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
`;

const SettingLabel = styled.span`
    font-size: 0.9rem;
    color: #333;

    [data-theme="dark"] & {
        color: #e0d8f0;
    }
`;

const ToggleTrack = styled.button<{ $dark: boolean }>`
    width: 64px;
    height: 32px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    background: ${p => p.$dark ? "#2d2558" : "#AFDBFF"};
    position: relative;
    transition: background 0.3s;
    padding: 0;
    flex-shrink: 0;
`;

const ToggleKnob = styled.div<{ $dark: boolean }>`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${p => p.$dark ? "#1a1535" : "white"};
    position: absolute;
    top: 3px;
    left: ${p => p.$dark ? "35px" : "3px"};
    transition: left 0.3s, background 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
`;

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="3.5" fill="#f5a623"/>
            <line x1="7.5" y1="0.5" x2="7.5" y2="2.5" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0.5" y1="7.5" x2="2.5" y2="7.5" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12.5" y1="7.5" x2="14.5" y2="7.5" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2.55" y1="2.55" x2="3.96" y2="3.96" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11.04" y1="11.04" x2="12.45" y2="12.45" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12.45" y1="2.55" x2="11.04" y2="3.96" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="3.96" y1="11.04" x2="2.55" y2="12.45" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M12.5 9.5A5.5 5.5 0 0 1 5 2a5.5 5.5 0 1 0 7.5 7.5z" fill="#c8c0f0"/>
        </svg>
    );
}

const ActionBtn = styled.button`
    background: none;
    border: none;
    padding: 10px 0;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-size: 0.9rem;
    color: #333;
    font-weight: 600;
    &:hover { color: #111; }
    transition: color 0.15s;

    [data-theme="dark"] & {
        color: #e0d8f0;
        &:hover { color: #fff; }
    }
`;

const DangerBtn = styled(ActionBtn)`
    color: #c0392b;
    &:hover { color: #96281b; }
    [data-theme="dark"] & {
        color: #ff8a80;
        &:hover { color: #ff5252; }
    }
`;

// ── Shared modal primitives ───────────────────────────────────────────────────

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: ${fadeIn} 0.18s ease;
`;

const ModalCard = styled.div`
    background: #fff;
    border-radius: 20px;
    width: min(440px, 92vw);
    padding: 32px 28px 28px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.22);
    animation: ${slideUp} 0.22s cubic-bezier(0.34,1.56,0.64,1);
    display: flex;
    flex-direction: column;
    gap: 18px;

    [data-theme="dark"] & { background: #2d2558; }
`;

const ModalTitle = styled.h2`
    font-size: 1.2rem;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
    [data-theme="dark"] & { color: #f0ecf8; }
`;

const ModalLabel = styled.label`
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 5px;
    [data-theme="dark"] & { color: #c8c0f0; }
`;

const ModalInput = styled.input`
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e0e0e0;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    background: #fafafa;
    color: #1a1a1a;
    transition: border-color 0.15s;
    &:focus { border-color: #4B94DB; }
    [data-theme="dark"] & {
        background: #3d3570;
        border-color: #5a519a;
        color: #f0ecf8;
        &:focus { border-color: #a090e0; }
    }
`;

const ModalFieldset = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const ModalBtnRow = styled.div`
    display: flex;
    gap: 10px;
    justify-content: flex-end;
`;

const ModalCancelBtn = styled.button`
    padding: 10px 20px;
    border-radius: 10px;
    border: 1.5px solid #e0e0e0;
    background: none;
    color: #777;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    &:hover { border-color: #bbb; color: #444; }
    [data-theme="dark"] & { border-color: #5a519a; color: #c8c0f0; }
`;

const ModalSaveBtn = styled.button<{ $danger?: boolean; $disabled?: boolean }>`
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    background: ${p => p.$danger ? "#c0392b" : "#4B94DB"};
    color: #fff;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: ${p => p.$disabled ? "not-allowed" : "pointer"};
    font-family: inherit;
    opacity: ${p => p.$disabled ? 0.5 : 1};
    transition: background 0.15s, opacity 0.15s;
    &:hover:not(:disabled) { background: ${p => p.$danger ? "#96281b" : "#2e6abf"}; }
`;

const StatusMsg = styled.div<{ $error?: boolean }>`
    font-size: 0.82rem;
    color: ${p => p.$error ? "#c0392b" : "#27ae60"};
    [data-theme="dark"] & { color: ${p => p.$error ? "#ff8a80" : "#69d69e"}; }
`;

// ── Change Credentials Modal ──────────────────────────────────────────────────

const TabRow = styled.div`
    display: flex;
    border-bottom: 2px solid #f0f0f0;
    margin-bottom: 4px;
    [data-theme="dark"] & { border-bottom-color: #4a4180; }
`;

const Tab = styled.button<{ $active: boolean }>`
    flex: 1;
    padding: 8px 0;
    background: none;
    border: none;
    font-size: 0.875rem;
    font-weight: ${p => p.$active ? 700 : 500};
    color: ${p => p.$active ? "#4B94DB" : "#999"};
    cursor: pointer;
    font-family: inherit;
    border-bottom: 2px solid ${p => p.$active ? "#4B94DB" : "transparent"};
    margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;
    [data-theme="dark"] & { color: ${p => p.$active ? "#a090e0" : "#888"}; border-bottom-color: ${p => p.$active ? "#a090e0" : "transparent"}; }
`;

function ChangeCredentialsModal({ onClose, currentUsername }: { onClose: () => void; currentUsername?: string }) {
    const [tab, setTab] = useState<"username" | "password">("username");
    const [username, setUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ msg: string; error: boolean } | null>(null);

    function switchTab(t: "username" | "password") {
        setTab(t);
        setStatus(null);
        setUsername("");
        setNewPassword("");
        setConfirmPassword("");
    }

    async function handleSave() {
        setStatus(null);
        if (tab === "username") {
            if (!username.trim()) return;
            setSaving(true);
            try {
                const { error } = await supabase.auth.updateUser({ data: { username: username.trim() } });
                if (error) throw error;
                setStatus({ msg: "Username updated!", error: false });
                setUsername("");
            } catch (e: unknown) {
                setStatus({ msg: (e as Error).message ?? "Something went wrong.", error: true });
            } finally {
                setSaving(false);
            }
        } else {
            if (!newPassword) return;
            if (newPassword !== confirmPassword) {
                setStatus({ msg: "Passwords don't match.", error: true });
                return;
            }
            if (newPassword.length < 6) {
                setStatus({ msg: "Password must be at least 6 characters.", error: true });
                return;
            }
            setSaving(true);
            try {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                setStatus({ msg: "Password updated!", error: false });
                setNewPassword("");
                setConfirmPassword("");
            } catch (e: unknown) {
                setStatus({ msg: (e as Error).message ?? "Something went wrong.", error: true });
            } finally {
                setSaving(false);
            }
        }
    }

    const canSave = tab === "username"
        ? username.trim().length > 0 && !saving
        : newPassword.length > 0 && confirmPassword.length > 0 && !saving;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalCard onClick={e => e.stopPropagation()}>
                <ModalTitle>Change Username or Password</ModalTitle>

                <TabRow>
                    <Tab $active={tab === "username"} onClick={() => switchTab("username")}>Username</Tab>
                    <Tab $active={tab === "password"} onClick={() => switchTab("password")}>Password</Tab>
                </TabRow>

                {tab === "username" && (
                    <ModalFieldset>
                        <div>
                            <ModalLabel>New username</ModalLabel>
                            <ModalInput
                                type="text"
                                placeholder={currentUsername ? `Current: ${currentUsername}` : "Enter a username"}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && canSave && handleSave()}
                                autoFocus
                            />
                        </div>
                    </ModalFieldset>
                )}

                {tab === "password" && (
                    <ModalFieldset>
                        <div>
                            <ModalLabel>New password</ModalLabel>
                            <ModalInput
                                type="password"
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <ModalLabel>Confirm new password</ModalLabel>
                            <ModalInput
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && canSave && handleSave()}
                            />
                        </div>
                    </ModalFieldset>
                )}

                {status && <StatusMsg $error={status.error}>{status.msg}</StatusMsg>}

                <ModalBtnRow>
                    <ModalCancelBtn onClick={onClose}>Cancel</ModalCancelBtn>
                    <ModalSaveBtn $disabled={!canSave} disabled={!canSave} onClick={handleSave}>
                        {saving ? "Saving…" : "Save"}
                    </ModalSaveBtn>
                </ModalBtnRow>
            </ModalCard>
        </ModalOverlay>
    );
}

// ── Delete Account Modal ──────────────────────────────────────────────────────

function DeleteAccountModal({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [confirm, setConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (confirm !== userEmail) return;
        setDeleting(true);
        setError(null);
        try {
            const res = await authFetch(
                `${import.meta.env.VITE_API_URL}/auth/account`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to delete account.");
            }
            await signOut();
            navigate(ROUTES.HOME);
        } catch (e: unknown) {
            setError((e as Error).message ?? "Something went wrong.");
            setDeleting(false);
        }
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalCard onClick={e => e.stopPropagation()}>
                <ModalTitle style={{ color: "#c0392b" }}>Delete Account</ModalTitle>

                <div style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.6 }}>
                    This will permanently delete your account and <strong>all your data</strong> — tasks,
                    schedules, notes, plants, and preferences. This cannot be undone.
                </div>

                <div>
                    <ModalLabel>Type your email to confirm</ModalLabel>
                    <ModalInput
                        type="email"
                        placeholder={userEmail}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        autoFocus
                    />
                </div>

                {error && <StatusMsg $error>{error}</StatusMsg>}

                <ModalBtnRow>
                    <ModalCancelBtn onClick={onClose}>Cancel</ModalCancelBtn>
                    <ModalSaveBtn
                        $danger
                        $disabled={confirm !== userEmail || deleting}
                        disabled={confirm !== userEmail || deleting}
                        onClick={handleDelete}
                    >
                        {deleting ? "Deleting…" : "Delete My Account"}
                    </ModalSaveBtn>
                </ModalBtnRow>
            </ModalCard>
        </ModalOverlay>
    );
}

export default function SettingsPage() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [showPreferences, setShowPreferences] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const navigate = useNavigate();

    return (
        <Page>
            <PageBackButton to={ROUTES.HOME} label="Home" />
            <TopBar>
                <PageTitle>ClockIn</PageTitle>
            </TopBar>

            <Card>
                <CardTitle>Your Account</CardTitle>

                <ProfileBox>
                    <AvatarWrapper>
                        <BeeIcon />
                    </AvatarWrapper>
                    <UserName>{user?.username ?? user?.email?.split("@")[0] ?? "User"}</UserName>
                    <UserSub>{user?.email}</UserSub>
                </ProfileBox>

                <Divider />

                <SettingRow>
                    <SettingLabel>Theme</SettingLabel>
                    <ToggleTrack $dark={isDark} onClick={toggleTheme} aria-label="Toggle dark mode">
                        <ToggleKnob $dark={isDark}>
                            {isDark ? <MoonIcon /> : <SunIcon />}
                        </ToggleKnob>
                    </ToggleTrack>
                </SettingRow>

                <Divider />

                <ActionBtn onClick={() => navigate("/availability")}>
                    📅 My Availability
                </ActionBtn>

                <Divider />

                <ActionBtn onClick={() => setShowPreferences(true)}>
                    📋 Edit Study Preferences
                </ActionBtn>

                <Divider />

                <ActionBtn onClick={() => setShowCredentials(true)}>
                    Change Username or Password
                </ActionBtn>

                <Divider />

                <DangerBtn onClick={() => setShowDeleteAccount(true)}>
                    Delete Account
                </DangerBtn>

                <Divider />
            </Card>

            {user && <AISettingsPanel key={user.id} />}

            {showPreferences && user && (
                <OnboardingSurvey
                    userId={user.id}
                    onComplete={() => setShowPreferences(false)}
                    isReopening
                />
            )}

            {showCredentials && (
                <ChangeCredentialsModal
                    onClose={() => setShowCredentials(false)}
                    currentUsername={user?.username}
                />
            )}

            {showDeleteAccount && user && (
                <DeleteAccountModal
                    onClose={() => setShowDeleteAccount(false)}
                    userEmail={user.email}
                />
            )}
        </Page>
    );
}
