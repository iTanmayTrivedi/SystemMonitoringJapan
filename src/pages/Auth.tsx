import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function Auth() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Login */}
      <div className="w-full md:w-[44%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6 sm:left-12 lg:left-16 flex items-center gap-2.5"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-green">
            <Terminal className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold font-mono text-foreground">SysMonitor</span>
        </motion.div>

        {/* Headline - Claude-style italic serif */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 mt-16"
        >
          <h1 className="text-4xl sm:text-[2.75rem] leading-[1.15] mb-3 text-foreground" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            <span className="italic font-normal">Monitor smart,</span>
            <br />
            <span className="italic font-normal text-primary">respond faster</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            AI-powered system monitoring for modern infrastructure
          </p>
        </motion.div>

        {/* Auth Form */}
        <AuthForm />

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-[11px] text-muted-foreground/60 font-mono text-center max-w-sm mx-auto"
        >
          Enterprise-grade monitoring with real-time alerts, AI insights, and SLA tracking.
        </motion.p>
      </div>

      {/* Right side - Animated Showcase (visible from md breakpoint) */}
      <div className="hidden md:flex flex-1 border-l border-border bg-card/30 relative overflow-hidden">
        <AuthShowcase />
      </div>
    </div>
  );
}
