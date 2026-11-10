import styled from "styled-components";
import BackButton from "../components/navigation/BackButton";
import { ROUTES } from "../constants/Routes";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    startGoogleLogin,
    syncGoogleCalendar,
    disconnectGoogleCalendar,
    getGoogleStatus
} from "../api/googleApi.ts";


/* ── Layout ───────────────────────── */

const Page = styled.div`
    width: 100vw;
    height: 100vh;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`;

const PageBackButton = styled(BackButton)`
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    color: #AFDBFF;
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
`;

const Card = styled.div`
    margin-top: 40px;
    width: 100%;
    max-width: 900px;
    background: #f5f5f5;
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CardTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 800;
    color: #222;
    margin-bottom: 12px;
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid #ddd;
    width: 100%;
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
`;

const Toggle = styled.button<{ $on: boolean }>`
    width: 44px;
    height: 24px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    background: ${p => (p.$on ? "#4a90d9" : "#ccc")};
    position: relative;
    transition: background 0.2s;

    &::after {
        content: "";
        position: absolute;
        top: 3px;
        left: ${p => (p.$on ? "23px" : "3px")};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        transition: left 0.2s;
    }
`;

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
`;

/* ── Component ───────────────────── */

export default function Availability() {
    const [syncOn, setSyncOn] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [googleMessage, setGoogleMessage] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const result = new URLSearchParams(location.search).get("google");
        if (result === "denied") {
            setGoogleMessage("Google blocked this connection. Add your account as a test user, or publish and verify the Google OAuth app.");
            window.history.replaceState({}, "", location.pathname);
        } else if (result === "storage") {
            setGoogleMessage("Google credentials were accepted, but ClockIn storage is not ready. Run backend/database/google_calendar_schema.sql in Supabase SQL Editor, then restart the backend.");
            window.history.replaceState({}, "", location.pathname);
        } else if (result === "redirect") {
            setGoogleMessage("Google rejected the callback URL. Make GOOGLE_REDIRECT_URI exactly match the authorized redirect URI in Google Cloud Console.");
            window.history.replaceState({}, "", location.pathname);
        } else if (result === "error") {
            setGoogleMessage("Google Calendar could not be connected. Check the backend callback and Google OAuth settings.");
            window.history.replaceState({}, "", location.pathname);
        }
        getGoogleStatus()
            .then((data) => {
                setIsConnected(data.connected);
                setSyncOn(data.connected);
            })
            .catch(() => {})
            .finally(() => setStatusLoading(false));
    }, [location.pathname, location.search]);

    async function handleToggleGoogleSync() {
        if (!isConnected) {
            // Redirect to Google OAuth — page will reload on return
            const url = await startGoogleLogin();
            window.location.href = url;
            return;
        }

        if (syncOn) {
            const confirmed = window.confirm(
                "Disconnect Google Calendar? This will remove all synced events from your schedule."
            );
            if (!confirmed) return;
            await disconnectGoogleCalendar();
            setSyncOn(false);
            setIsConnected(false);
        } else {
            await syncGoogleCalendar();
            setSyncOn(true);
        }
    }

    return (
        <Page>
            <PageBackButton to={ROUTES.SETTINGS} label="Account" />

            <TopBar>
                <PageTitle>ClockIn</PageTitle>
            </TopBar>

            <Card>
                <CardTitle>My Availability</CardTitle>
                {googleMessage && <p role="alert" style={{ color: "#b42318", lineHeight: 1.5 }}>{googleMessage}</p>}

                {/* Row 1 — Edit Busy Times */}
                <ActionBtn onClick={() => navigate(ROUTES.BUSY_TIMES)}>
                    Edit Busy Times
                </ActionBtn>

                <Divider />

                {/* Row 2 — Sync Google Calendar */}
                <SettingRow>
                    <SettingLabel>
                        Sync Google Calendar
                        {isConnected && (
                            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#4a90d9" }}>
                                Connected
                            </span>
                        )}
                    </SettingLabel>
                    <Toggle
                        $on={syncOn}
                        onClick={handleToggleGoogleSync}
                        disabled={statusLoading}
                        style={{ opacity: statusLoading ? 0.4 : 1, cursor: statusLoading ? "not-allowed" : "pointer" }}
                    />
                </SettingRow>

                <Divider />
            </Card>
        </Page>
    );
}
