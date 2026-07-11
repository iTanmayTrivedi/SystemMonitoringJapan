import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, AlertCircle, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Also listen for auth state changes for PASSWORD_RECOVERY event
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") {
            setIsRecovery(true);
          }
        });
        cleanup = () => subscription.unsubscribe();
      } catch {}
    })();

    return () => cleanup?.();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message || "Failed to update password.");
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/auth", { replace: true }), 3000);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setSubmitting(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-green">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-foreground">SysMonitor</h1>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-mono mb-4">
              Invalid or expired reset link. Please request a new password reset.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")} className="font-mono text-xs">
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-green">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-foreground">SysMonitor</h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {success ? (
            <div className="text-center">
              <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold font-mono text-foreground mb-1">Password Updated</h2>
              <p className="text-sm text-muted-foreground font-mono">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Set New Password</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 font-mono">Enter your new password below.</p>

              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border font-mono text-sm"
                  required
                  minLength={6}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-border font-mono text-sm"
                  required
                  minLength={6}
                />
                <Button type="submit" variant="outline" className="w-full font-mono" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Password"}
                </Button>
              </form>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm font-mono mt-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
