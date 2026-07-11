import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, type AuthMode } from "@/lib/authMode";
import { getStoredAuthMode, setStoredAuthMode, getDemoSession, setDemoSession, clearDemoSession } from "@/lib/authContext";
import { DEMO_USERS, type DemoUser } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "viewer" | "user";

export interface AuthUser {
  id: string;
  email: string;
}

type SignUpResult = {
  error: any | null;
  needsEmailConfirmation?: boolean;
};

export function useAuth() {
  const [authMode, setAuthModeState] = useState<AuthMode>(getStoredAuthMode);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [isLoading, setIsLoading] = useState(true);
  const supabaseAvailable = isSupabaseConfigured();

  const isAdmin = role === "admin";
  const isViewer = role === "viewer";
  const hasAccess = isAdmin || isViewer;

  const ensureCurrentUserRecord = useCallback(async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, any> }, desiredRole: AppRole = "user") => {
    const safeRole = ["admin", "viewer", "user"].includes(desiredRole) ? desiredRole : "user";

    await supabase.from("profiles").upsert(
      { user_id: authUser.id, email: authUser.email ?? "" },
      { onConflict: "user_id" },
    );

    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .limit(1);

    if (existingRoles && existingRoles.length > 0) {
      return existingRoles[0].role as AppRole;
    }

    await supabase.from("user_roles").insert({ user_id: authUser.id, role: safeRole });

    return safeRole;
  }, []);

  const setAuthMode = useCallback((mode: AuthMode) => {
    setStoredAuthMode(mode);
    setAuthModeState(mode);
    setUser(null);
    setRole("user");
    clearDemoSession();
  }, []);

  // ─── Demo mode session restore ───
  useEffect(() => {
    if (authMode === "demo") {
      const session = getDemoSession();
      if (session) {
        setUser({ id: session.userId, email: session.email });
        setRole(session.role as AppRole);
      }
      setIsLoading(false);
      return;
    }

    // ─── Real (Supabase) mode ───
    if (!supabaseAvailable) {
      console.warn("[useAuth] Supabase not configured, falling back to demo");
      setAuthMode("demo");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initSupabase = async () => {
      try {
        // Listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email ?? "" });
            const metadataRole = session.user.user_metadata?.desired_role as AppRole | undefined;
            ensureCurrentUserRecord(session.user, metadataRole ?? "user")
              .then((resolvedRole) => {
                if (!mounted) return;
                setRole(resolvedRole);
              })
              .catch(() => {
                if (!mounted) return;
                setRole("user");
              })
              .finally(() => {
                if (mounted) setIsLoading(false);
              });
          } else {
            setUser(null);
            setRole("user");
            setIsLoading(false);
          }
        });

        // Get existing session
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn("[useAuth] getSession error:", sessionError);
        }

        if (!data?.session) {
          if (mounted) setIsLoading(false);
        }

        // Safety timeout
        const timeout = window.setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 5000);

        return () => {
          mounted = false;
          window.clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.warn("[useAuth] Supabase init failed:", err);
        if (mounted) setIsLoading(false);
      }
    };

    initSupabase();

    return () => { mounted = false; };
  }, [authMode, supabaseAvailable, setAuthMode, ensureCurrentUserRecord]);

  // ─── Demo Sign In ───
  const demoSignIn = useCallback((demoUser: DemoUser) => {
    setUser({ id: demoUser.id, email: demoUser.email });
    setRole(demoUser.role as AppRole);
    setDemoSession({ userId: demoUser.id, email: demoUser.email, role: demoUser.role });
  }, []);

  // ─── Real Sign In ───
  const signIn = useCallback(async (email: string, password: string) => {
    if (authMode === "demo") {
      // Find matching demo user by email
      const found = DEMO_USERS.find((u) => u.email === email);
      if (found) {
        demoSignIn(found);
        return { error: null };
      }
      return { error: { message: "Unknown demo user" } as any };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err: any) {
      return { error: { message: err?.message || "Network error — please check your connection." } as any };
    }
  }, [authMode, demoSignIn]);

  // ─── Real Sign Up ───
  const signUp = useCallback(async (email: string, password: string, desiredRole: "admin" | "viewer" = "admin"): Promise<SignUpResult> => {
    if (authMode === "demo") {
      return { error: { message: "Sign up is not available in demo mode." } as any };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { desired_role: desiredRole },
        },
      });
      if (error) return { error };

      if (data.session?.user) {
        const resolvedRole = await ensureCurrentUserRecord(data.session.user, desiredRole);
        setUser({ id: data.session.user.id, email: data.session.user.email ?? email });
        setRole(resolvedRole);
        return { error: null, needsEmailConfirmation: false };
      }

      return { error: null, needsEmailConfirmation: true };
    } catch (err: any) {
      return { error: { message: err?.message || "Network error — please check your connection." } as any };
    }
  }, [authMode, ensureCurrentUserRecord]);

  // ─── Sign Out ───
  const signOut = useCallback(async () => {
    if (authMode === "demo") {
      setUser(null);
      setRole("user");
      clearDemoSession();
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Force local cleanup
      setUser(null);
      setRole("user");
    }
  }, [authMode]);

  return {
    user,
    role,
    isAdmin,
    isViewer,
    hasAccess,
    isLoading,
    authMode,
    setAuthMode,
    supabaseAvailable,
    signIn,
    signUp,
    signOut,
    demoSignIn,
  };
}
