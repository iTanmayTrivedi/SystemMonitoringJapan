import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield, Eye, Users, WifiOff, Wifi, ArrowLeft } from "lucide-react";
import { DEMO_USERS } from "@/lib/mockData";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const { signIn, signUp, authMode, setAuthMode, supabaseAvailable, demoSignIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "viewer">("admin");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatAuthError = (err: any) => {
    const msg = String(err?.message || "");
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login") || lower.includes("invalid credentials") || lower.includes("401")) return "Invalid email or password.";
    if (lower.includes("email not confirmed")) return "Please confirm your email before signing in.";
    if (lower.includes("user already registered")) return "An account with this email already exists.";
    if (lower.includes("failed to fetch") || lower.includes("network")) return "Cannot reach server. Check your connection or use demo mode.";
    return msg || "Authentication failed.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setSubmitting(true);
    try {
      if (isForgotPassword) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) setError(formatAuthError(error));
        else setMessage("Password reset link sent! Check your email.");
      } else if (isSignUp) {
        const { error } = await signUp(email, password, selectedRole);
        if (error) setError(formatAuthError(error));
        else setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(formatAuthError(error));
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    }
    setSubmitting(false);
  };

  const roles = [
    { value: "admin" as const, label: "Admin", description: "Full access", icon: Shield },
    { value: "viewer" as const, label: "Viewer", description: "Read-only", icon: Eye },
  ];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex rounded-full border border-border overflow-hidden mb-6 bg-card/50"
      >
        <button
          onClick={() => { setAuthMode("demo"); setError(""); }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-semibold transition-all rounded-full ${
            authMode === "demo" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <WifiOff className="h-3 w-3" />
          Demo Mode
        </button>
        <button
          onClick={() => { if (supabaseAvailable) { setAuthMode("real"); setError(""); } else { setError("Backend not configured — use Demo Mode."); } }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 font-mono text-xs font-semibold transition-all rounded-full ${
            authMode === "real" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          } ${!supabaseAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Wifi className="h-3 w-3" />
          Real Login
        </button>
      </motion.div>

      {/* Demo Mode */}
      {authMode === "demo" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold text-foreground">Select Demo User</span>
          </div>
          <div className="space-y-2">
            {DEMO_USERS.map((du) => (
              <button
                key={du.id}
                onClick={() => demoSignIn(du)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                  du.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent text-muted-foreground border-border"
                }`}>
                  {du.label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-semibold text-foreground">{du.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{du.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  du.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent text-muted-foreground border-border"
                }`}>
                  {du.role.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Real Login */}
      {authMode === "real" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isForgotPassword ? (
            <>
              <button
                onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono mb-4"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
              <h3 className="text-base font-semibold mb-1 text-foreground font-mono">Reset Password</h3>
              <p className="text-sm text-muted-foreground mb-4 font-mono">Enter your email for a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/50 border-border font-mono text-sm rounded-xl h-11" required />
                <Button type="submit" className="w-full font-mono rounded-xl h-11 bg-foreground text-background hover:bg-foreground/90" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border font-mono text-sm rounded-xl h-11"
                  required
                />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border font-mono text-sm rounded-xl h-11"
                  required
                  minLength={6}
                />

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.value;
                      return (
                        <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 transition-all ${
                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/40"
                          }`}>
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="text-left">
                            <span className="font-mono text-xs font-semibold block">{r.label}</span>
                            <span className="font-mono text-[9px] opacity-70">{r.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <Button type="submit" className="w-full font-mono rounded-xl h-11 bg-foreground text-background hover:bg-foreground/90" disabled={submitting}>
                  {submitting ? "Loading..." : isSignUp ? "Create account" : "Continue with email"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={async () => {
                  setError(""); setMessage(""); setSubmitting(true);
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: window.location.origin },
                    });
                    if (error) setError(formatAuthError(error));
                  } catch (err: any) {
                    setError(formatAuthError(err));
                  }
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl h-11 border border-border bg-card hover:bg-accent transition-colors font-mono text-sm font-medium text-foreground disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {!isSignUp && (
                <button
                  onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); }}
                  className="mt-3 w-full text-center text-xs text-primary hover:text-primary/80 transition-colors font-mono"
                >
                  Forgot password?
                </button>
              )}

              <div className="mt-3 pt-3 border-t border-border">
                <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
                  {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Feedback */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm font-mono mt-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-primary text-sm font-mono mt-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {message}
        </motion.div>
      )}
    </div>
  );
}
