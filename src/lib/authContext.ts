/**
 * Shared auth mode state — persisted in localStorage.
 */
import type { AuthMode } from "./authMode";

const AUTH_MODE_KEY = "sysmonitor_auth_mode";
const DEMO_SESSION_KEY = "sysmonitor_demo_session";
export const DEMO_SESSION_CHANGED = "sysmonitor:demo-session-changed";

export function getStoredAuthMode(): AuthMode {
  try {
    const v = localStorage.getItem(AUTH_MODE_KEY);
    if (v === "real") return "real";
  } catch {}
  return "demo";
}

export function setStoredAuthMode(mode: AuthMode) {
  try {
    localStorage.setItem(AUTH_MODE_KEY, mode);
  } catch {}
}

export function getDemoSession(): { userId: string; email: string; role: string } | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setDemoSession(data: { userId: string; email: string; role: string }) {
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(data));
  } catch {}
  window.dispatchEvent(new Event(DEMO_SESSION_CHANGED));
}

export function clearDemoSession() {
  try {
    localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {}
  window.dispatchEvent(new Event(DEMO_SESSION_CHANGED));
}
