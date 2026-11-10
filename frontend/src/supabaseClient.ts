import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigured = Boolean(url && key && !url.includes("your-project-id"));
// Keep imports safe while the setup screen explains missing configuration.
// AuthProvider is not mounted until real credentials have been configured.
export const supabase = createClient(
    supabaseConfigured ? url : "http://127.0.0.1:54321",
    supabaseConfigured ? key : "setup-required",
);
