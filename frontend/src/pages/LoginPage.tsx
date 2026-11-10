import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
    const { signIn, signUp } = useAuth();

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function switchMode(next: "login" | "signup") {
        setMode(next);
        setError(null);
    }

    async function handleLogin() {
        if (!email || !password) return;
        setLoading(true);
        setError(null);
        const err = await signIn(email, password);
        if (err) setError(err);
        setLoading(false);
    }

    async function handleSignUp() {
        if (!username || !email || !password) return;
        setLoading(true);
        setError(null);
        const err = await signUp(email, password, username);
        if (err) {
            setError(err);
        } else {
            switchMode("login");
        }
        setLoading(false);
    }

    return (
        <div className="lp-bg">
            <div className="lp-card">

                {mode === "signup" && (
                    <button className="lp-back-btn" onClick={() => switchMode("login")}>◀</button>
                )}

                <h1 className="lp-title">Welcome to ClockIn 🐝</h1>

                <p className="lp-modeswitcher">
                    {mode === "login" ? (
                        <>
                            <strong>Log in</strong>
                            {" or "}
                            <span className="lp-mode-link" onClick={() => switchMode("signup")}>Sign up</span>
                        </>
                    ) : (
                        <>
                            <span className="lp-mode-link" onClick={() => switchMode("login")}>Log in</span>
                            {" or "}
                            <strong>Sign up</strong>
                        </>
                    )}
                </p>

                {mode === "login" ? (
                    <>
                        <div className="lp-section">
                            <h2 className="lp-section-title">Log in</h2>
                            <p className="lp-section-subtitle">to an existing account</p>
                            {error && <p className="lp-error">*{error}*</p>}
                            <div className="lp-field">
                                <input
                                    className="lp-input"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <label className="lp-label">*email</label>
                            </div>
                            <div className="lp-field">
                                <input
                                    className={`lp-input${error ? " lp-input-error" : ""}`}
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                                />
                                <label className="lp-label">*password</label>
                            </div>
                        </div>

                        <button
                            className="lp-enter-btn"
                            onClick={handleLogin}
                            disabled={!email || !password || loading}
                        >
                            {loading ? "Signing in..." : "Log In"}
                        </button>

                        <hr className="lp-divider" />

                        <div className="lp-signup-section" onClick={() => switchMode("signup")}>
                            <h2 className="lp-signup-title">Sign up</h2>
                            <p className="lp-section-subtitle">to create an account</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="lp-section">
                            <h2 className="lp-signup-title">Sign up</h2>
                            <p className="lp-section-subtitle">to create an account</p>
                            {error && <p className="lp-error">*{error}*</p>}
                            <div className="lp-field">
                                <input
                                    className="lp-input"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                                <label className="lp-label">*username</label>
                            </div>
                            <div className="lp-field">
                                <input
                                    className="lp-input"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <label className="lp-label">*email</label>
                            </div>
                            <div className="lp-field">
                                <input
                                    className="lp-input"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSignUp()}
                                />
                                <label className="lp-label">*password</label>
                            </div>
                        </div>

                        <button
                            className="lp-enter-btn"
                            onClick={handleSignUp}
                            disabled={!username || !email || !password || loading}
                        >
                            {loading ? "Creating..." : "Enter"}
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}