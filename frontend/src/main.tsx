import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import AuthRoot from "./AuthRoot.tsx";
import { supabaseConfigured } from "./supabaseClient";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {supabaseConfigured ? <ThemeProvider>
            <AuthProvider>
                <AuthRoot />
            </AuthProvider>
        </ThemeProvider> : <main style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "system-ui", lineHeight: 1.7 }}>
            <h1>ClockIn local setup</h1>
            <p>The frontend is running. Connect Supabase to enable sign-in and saved study data.</p>
            <ol>
                <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>frontend/.env.local</code>.</li>
                <li>Set <code>SUPABASE_URL</code>, <code>SUPABASE_PUBLISHABLE_KEY</code>, and <code>SUPABASE_SECRET_KEY</code> in <code>backend/.env</code>.</li>
                <li>Restart the servers with <code>.\start-local.ps1</code>.</li>
            </ol>
            <p>After signing in, open Settings → AI providers to add a Groq, OpenAI, or Anthropic API key. An OpenAI key is optional.</p>
            <p>See <code>LOCAL_SETUP.md</code> for setup details and database requirements.</p>
        </main>}
    </StrictMode>
);
