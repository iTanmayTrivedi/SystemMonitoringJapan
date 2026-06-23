/**
 * Auth mode detection and configuration.
 * If Supabase env vars are present, real auth is available.
 * Otherwise, or on failure, the app falls back to demo mode.
 */

export type AuthMode = "demo" | "real";

export function isSupabaseConfigured(): boolean {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return !!(url && key && url.startsWith("http"));
  } catch {
    return false;
  }
}
