/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { clearAISettings } from "../api/aiSettings";

// -----------------------------
// TYPES
// -----------------------------
interface AuthUser {
    id: string;
    email: string;
    username?: string;
    onboardingDone?: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (email: string, password: string, username: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

// -----------------------------
// CONTEXT
// -----------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

// -----------------------------
// PROVIDER
// -----------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // -----------------------------
    // SESSION RESTORE
    // -----------------------------
    useEffect(() => {
        const init = async () => {
            // getUser() validates against Supabase and triggers a token refresh
            // if the cached JWT is expired, so we never start with a stale token.
            const { data } = await supabase.auth.getUser();
            const sessionUser = data.user;

            if (sessionUser) {
                setUser({
                    id: sessionUser.id,
                    email: sessionUser.email!,
                    username: sessionUser.user_metadata?.username,
                    onboardingDone: sessionUser.user_metadata?.onboarding_done === true,
                });
            }

            setLoading(false);
        };

        init();

        // 🔥 optional: listen to auth changes (recommended)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    username: session.user.user_metadata?.username,
                    onboardingDone: session.user.user_metadata?.onboarding_done === true,
                });
            } else {
                setUser(null);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // -----------------------------
    // SIGN IN
    // -----------------------------
    async function signIn(email: string, password: string): Promise<string | null> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return error.message;

        if (data.user) {
            setUser({
                id: data.user.id,
                email: data.user.email!,
                username: data.user.user_metadata?.username,
                onboardingDone: data.user.user_metadata?.onboarding_done === true,
            });
        }

        return null;
    }

    // -----------------------------
    // SIGN UP
    // -----------------------------
    async function signUp(
        email: string,
        password: string,
        username: string
    ): Promise<string | null> {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                },
            },
        });

        if (error) return error.message;

        return null;
    }

    // -----------------------------
    // SIGN OUT
    // -----------------------------
    async function signOut() {
        if (user) clearAISettings(user.id);
        await supabase.auth.signOut();
        setUser(null);
    }

    // -----------------------------
    // PROVIDER
    // -----------------------------
    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
