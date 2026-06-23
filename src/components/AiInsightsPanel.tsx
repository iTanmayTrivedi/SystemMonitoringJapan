import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/authMode";
import { getStoredAuthMode } from "@/lib/authContext";
import { Brain, Sparkles, AlertTriangle, Lightbulb, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogPattern { pattern: string; count: number; severity: "info" | "warning" | "error"; source: string; }
interface Anomaly { metric: string; description: string; risk: "low" | "medium" | "high"; }
interface RootCause { issue: string; probable_cause: string; suggestion: string; }
interface AiAnalysis { summary: string; log_patterns: LogPattern[]; anomalies: Anomaly[]; root_causes: RootCause[]; }

const riskColors: Record<string, string> = {
  low: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const severityColors: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

// Mock AI analysis for demo mode
const MOCK_ANALYSIS: AiAnalysis = {
  summary: "System is generally healthy. Minor memory pressure detected with occasional cache misses. Network latency spikes correlate with backup windows.",
  log_patterns: [
    { pattern: "Connection pool utilization above 80%", count: 7, severity: "warning", source: "db-primary" },
    { pattern: "Cache hit ratio: 94%", count: 23, severity: "info", source: "cache-redis" },
    { pattern: "Response time exceeded 500ms threshold", count: 4, severity: "warning", source: "api-gateway" },
  ],
  anomalies: [
    { metric: "Memory", description: "Memory usage trending upward over last 2h — possible leak in worker-queue", risk: "medium" },
  ],
  root_causes: [
    { issue: "Elevated API response times", probable_cause: "DB connection pool saturation during peak hours", suggestion: "Increase pool size from 50 to 75 or add read replica" },
  ],
};

export function AiInsightsPanel() {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isDemo = getStoredAuthMode() === "demo" || !isSupabaseConfigured();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        // Simulate delay
        await new Promise((r) => setTimeout(r, 1500));
        setAnalysis(MOCK_ANALYSIS);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("ai-analyze");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data as AiAnalysis);
      setLastUpdated(new Date());
    } catch (e: any) {
      toast.error(e.message || "Failed to run AI analysis");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-mono font-semibold text-sm text-foreground">AI Insights</h3>
          {lastUpdated && (
            <span className="text-[10px] font-mono text-muted-foreground">updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={loading} className="font-mono text-xs">
          {loading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
          {analysis ? "Re-analyze" : "Analyze System"}
        </Button>
      </div>

      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-mono text-sm">Click "Analyze System" for AI-powered insights</span>
        </div>
      )}

      {loading && !analysis && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm">Analyzing logs, metrics & alerts…</span>
        </div>
      )}

      {analysis && (
        <div className="divide-y divide-border/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">Summary</span>
            </div>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </div>

          {analysis.log_patterns.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">Log Patterns</span>
              </div>
              <div className="space-y-2">
                {analysis.log_patterns.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-mono">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityColors[p.severity]}`}>{p.severity.toUpperCase()}</span>
                    <span className="text-muted-foreground truncate flex-1">{p.pattern}</span>
                    <span className="text-xs text-muted-foreground shrink-0">×{p.count}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{p.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.anomalies.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">Anomaly Detection</span>
              </div>
              <div className="space-y-2">
                {analysis.anomalies.map((a, i) => (
                  <div key={i} className="rounded-md border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${riskColors[a.risk]}`}>{a.risk.toUpperCase()} RISK</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{a.metric}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.root_causes.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">Root Cause Suggestions</span>
              </div>
              <div className="space-y-3">
                {analysis.root_causes.map((rc, i) => (
                  <div key={i} className="rounded-md border border-border bg-secondary/30 p-3">
                    <p className="font-mono text-xs font-semibold text-foreground mb-1">{rc.issue}</p>
                    <p className="font-mono text-xs text-muted-foreground mb-2">{rc.probable_cause}</p>
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary text-xs mt-0.5">→</span>
                      <p className="font-mono text-xs text-primary">{rc.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.anomalies.length === 0 && analysis.root_causes.length === 0 && (
            <div className="p-4 flex items-center gap-2 text-primary font-mono text-sm">
              <span>✓</span>
              <span>No anomalies detected — system appears healthy</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
