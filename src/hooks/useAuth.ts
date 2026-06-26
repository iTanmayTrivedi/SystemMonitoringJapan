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

export function useAuth() {
  const [authMode, setAuthModeState] = useState<AuthMode>(getStoredAuthMode);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [isLoading, setIsLoading] = useState(true);
  const supabaseAvailable = isSupabaseConfigured();

  const isAdmin = role === "admin";
  const isViewer = role === "viewer";
  const hasAccess = isAdmin || isViewer;

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
            // Fetch role async
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .then(({ data }) => {
                if (!mounted) return;
                if (data && data.length > 0) {
                  const roles = data.map((r: any) => r.role as AppRole);
                  if (roles.includes("admin")) setRole("admin");
                  else if (roles.includes("viewer")) setRole("viewer");
                  else setRole("user");
                } else {
                  setRole("user");
                }
                setIsLoading(false);
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
  }, [authMode, supabaseAvailable, setAuthMode]);

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
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err: any) {
      return { error: { message: "Network error — please check your connection." } as any };
    }
  }, [authMode, demoSignIn]);

  // ─── Real Sign Up ───
  const signUp = useCallback(async (email: string, password: string, desiredRole: "admin" | "viewer" = "admin") => {
    if (authMode === "demo") {
      return { error: { message: "Sign up is not available in demo mode." } as any };
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { desired_role: desiredRole },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: { message: "Network error — please check your connection." } as any };
    }
  }, [authMode]);

  // ─── Sign Out ───
  const signOut = useCallback(async () => {
    if (authMode === "demo") {
      setUser(null);
      setRole("user");
      clearDemoSession();
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
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
