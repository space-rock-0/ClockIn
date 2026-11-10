import { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";
import { authFetch } from "../api/authFetch";
import { apiError, clearAISettings, defaultAISettings, loadAISettings, saveAISettings } from "../api/aiSettings";
import type { AIProvider, AISettings } from "../api/aiSettings";

const Panel = styled.section`
    width: calc(100% - 48px); max-width: 480px; box-sizing: border-box;
    margin-top: 24px; padding: 28px; border-radius: 16px; background: #f5f5f5; color: #222;
    display: grid; gap: 16px;
    h2, p { margin: 0; }
    p { font-size: 0.875rem; line-height: 1.6; }
    label { display: grid; gap: 7px; font-size: 0.9rem; font-weight: 600; }
    input:not([type=checkbox]), select { width: 100%; box-sizing: border-box; padding: 11px;
        border: 1px solid #aaa; border-radius: 8px; font: inherit; background: white; color: #222; }
    fieldset { display: grid; gap: 12px; border: 1px solid #aaa; border-radius: 10px; padding: 14px; min-width: 0; }
    button { padding: 10px 14px; border-radius: 8px; border: 1px solid #4b94db;
        background: #4b94db; color: white; cursor: pointer; font: inherit; }
    button:disabled { opacity: 0.6; cursor: wait; }
    [data-theme="dark"] & { background: #2d2558; color: #f0ecf8; }
`;
const providers = [
    { id: "groq", label: "Groq", model: "openai/gpt-oss-120b" },
    { id: "openai", label: "OpenAI", model: "gpt-4o-mini" },
    { id: "anthropic", label: "Anthropic", model: "claude-haiku-4-5" },
] as const;

export default function AISettingsPanel() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AISettings>(() => user ? loadAISettings(user.id) : { ...defaultAISettings });
    const [showKeys, setShowKeys] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState("");
    function update<K extends keyof AISettings>(key: K, value: AISettings[K]) {
        setSettings(current => ({ ...current, [key]: value }));
        setStatus("");
    }
    async function test() {
        setTesting(true);
        setStatus("");
        try {
            const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/ai/test`, {
                method: "POST", body: JSON.stringify(settings),
            });
            if (!response.ok) throw await apiError(response, "Connection test failed.");
            const result = await response.json();
            setStatus(`Connected to ${result.provider} (${result.model}). Save to use these settings. The test uses a small API request.`);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Connection test failed.");
        } finally { setTesting(false); }
    }
    return <Panel aria-labelledby="ai-settings-title">
        <h2 id="ai-settings-title">AI providers</h2>
        <p>Add your own API key for AI task creation and study workflows. Auto prefers Groq, then OpenAI, then Anthropic.</p>
        <p>Keys stay in this browser tab’s session and are cleared on sign-out. They are sent to the ClockIn backend for AI requests, never saved to your account. Assignment text is sent to the provider used.</p>
        <label htmlFor="ai-provider">Provider
            <select id="ai-provider" value={settings.provider} disabled={testing}
                onChange={e => update("provider", e.target.value as AIProvider)}>
                <option value="auto">Auto (Groq first)</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
        </label>
        {providers.map(p => <fieldset key={p.id} disabled={testing}>
            <legend>{p.label}</legend>
            <label htmlFor={`${p.id}-key`}>API key
                <input id={`${p.id}-key`} type={showKeys ? "text" : "password"} autoComplete="off" spellCheck={false}
                    value={settings[`${p.id}_key`]} placeholder={`Enter your ${p.label} API key`}
                    onChange={e => update(`${p.id}_key`, e.target.value.trim())} />
            </label>
            <label htmlFor={`${p.id}-model`}>Model (optional)
                <input id={`${p.id}-model`} value={settings[`${p.id}_model`]} placeholder={p.model}
                    maxLength={120} pattern="[a-zA-Z0-9_./:-]*"
                    onChange={e => update(`${p.id}_model`, e.target.value.trim())} />
            </label>
        </fieldset>)}
        <label style={{ display: "flex", alignItems: "center" }}>
            <input type="checkbox" checked={showKeys} onChange={e => setShowKeys(e.target.checked)} /> Show keys
        </label>
        <label style={{ display: "flex", alignItems: "center" }}>
            <input type="checkbox" checked={settings.groq_fallback} disabled={testing}
                onChange={e => update("groq_fallback", e.target.checked)} />
            Fall back to Groq if the selected provider fails
        </label>
        <p>Fallback requires a Groq key. Choose a specific provider to test its key directly. Auto tries other configured providers if a request fails. With no personal keys, the backend’s configured keys are used.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button disabled={testing || !user} onClick={() => {
                try {
                    if (user) saveAISettings(user.id, settings);
                    setStatus("AI settings saved for this browser session.");
                } catch { setStatus("Browser storage is unavailable. Enable session storage to save API keys."); }
            }}>Save settings</button>
            <button disabled={testing || !user} onClick={test}>{testing ? "Testing…" : "Test connection"}</button>
            <button disabled={testing || !user} onClick={() => {
                try {
                    if (user) clearAISettings(user.id);
                    setSettings({ ...defaultAISettings }); setStatus("Personal API keys and settings cleared.");
                } catch { setStatus("Unable to clear browser storage."); }
            }}>Clear keys</button>
        </div>
        {status && <p role="status">{status}</p>}
    </Panel>;
}
