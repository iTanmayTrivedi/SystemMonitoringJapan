import { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Zap, BarChart3 } from "lucide-react";

interface MetricAnomaly {
  metric: string;
  current: number;
  baseline: number;
  deviation: number;
  trend: "rising" | "falling" | "stable";
  severity: "normal" | "warning" | "critical";
}

interface Prediction {
  metric: string;
  prediction: string;
  confidence: number;
  timeframe: string;
}

interface DetectedPattern {
  name: string;
  description: string;
  frequency: string;
  impact: "low" | "medium" | "high";
}

function generateAnomalies(): MetricAnomaly[] {
  const metrics = [
    { metric: "CPU", baseline: 45 },
    { metric: "Memory", baseline: 62 },
    { metric: "Disk I/O", baseline: 30 },
    { metric: "Network Latency", baseline: 12 },
    { metric: "Request Rate", baseline: 850 },
    { metric: "Error Rate", baseline: 0.5 },
  ];
  return metrics.map((m) => {
    const dev = (Math.random() - 0.4) * 40;
    const current = Math.max(0, Math.min(100, m.baseline + dev));
    const absDev = Math.abs(dev);
    return {
      metric: m.metric,
      current: Math.round(current * 10) / 10,
      baseline: m.baseline,
      deviation: Math.round(dev * 10) / 10,
      trend: dev > 5 ? "rising" : dev < -5 ? "falling" : "stable",
      severity: absDev > 25 ? "critical" : absDev > 12 ? "warning" : "normal",
    };
  });
}

function generatePredictions(): Prediction[] {
  return [
    { metric: "Memory", prediction: "May exceed 85% threshold", confidence: 72, timeframe: "~2 hours" },
    { metric: "Disk", prediction: "Storage capacity stable", confidence: 95, timeframe: "24 hours" },
    { metric: "CPU", prediction: "Spike expected during backup window", confidence: 68, timeframe: "03:00-04:00 JST" },
  ];
}

function generatePatterns(): DetectedPattern[] {
  return [
    { name: "Periodic Memory Spike", description: "Memory usage increases ~15% every 4h, correlates with cron jobs", frequency: "Every 4h", impact: "medium" },
    { name: "Weekend Traffic Drop", description: "Request rate decreases 60% on weekends", frequency: "Weekly", impact: "low" },
    { name: "Cascade Error Pattern", description: "Auth failures trigger DB connection pool exhaustion", frequency: "Irregular", impact: "high" },
  ];
}

const severityStyle: Record<string, string> = {
  normal: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const impactStyle: Record<string, string> = {
  low: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AnomalyDetectionPanel() {
  const { t } = useI18n();
  const [anomalies, setAnomalies] = useState<MetricAnomaly[]>(generateAnomalies);
  const [predictions] = useState<Prediction[]>(generatePredictions);
  const [patterns] = useState<DetectedPattern[]>(generatePatterns);

  useEffect(() => {
    const interval = setInterval(() => setAnomalies(generateAnomalies()), 10000);
    return () => clearInterval(interval);
  }, []);

  const overallScore = useMemo(() => {
    const weights = anomalies.map((a) => (a.severity === "critical" ? 30 : a.severity === "warning" ? 15 : 2));
    const total = weights.reduce((s, w) => s + w, 0);
    return Math.max(0, Math.min(100, 100 - total));
  }, [anomalies]);

  const scoreColor = overallScore > 75 ? "text-primary" : overallScore > 50 ? "text-warning" : "text-destructive";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-sm text-foreground">{t("anomaly.title")}</h3>
            <p className="font-mono text-[10px] text-muted-foreground">{t("anomaly.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{t("anomaly.score")}</span>
          <span className={`font-mono text-lg font-bold ${scoreColor}`}>{overallScore}</span>
          <span className="font-mono text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Baseline Deviation */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">{t("anomaly.baseline")}</span>
          </div>
          <div className="space-y-2">
            {anomalies.map((a) => (
              <div key={a.metric} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 truncate">{a.metric}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(100, Math.abs(a.deviation) * 2 + 10)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.trend === "rising" ? (
                    <TrendingUp className="h-3 w-3 text-destructive" />
                  ) : a.trend === "falling" ? (
                    <TrendingDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`font-mono text-[10px] font-bold ${
                    a.deviation > 0 ? "text-destructive" : a.deviation < -5 ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {a.deviation > 0 ? "+" : ""}{a.deviation}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictions */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">{t("anomaly.predictions")}</span>
          </div>
          <div className="space-y-3">
            {predictions.map((p, i) => (
              <div key={i} className="rounded-md border border-border bg-secondary/30 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-foreground">{p.metric}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{p.timeframe}</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground mb-1.5">{p.prediction}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${p.confidence}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{p.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detected Patterns */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">{t("anomaly.patterns")}</span>
          </div>
          <div className="space-y-2.5">
            {patterns.map((p, i) => (
              <div key={i} className="rounded-md border border-border bg-secondary/30 p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${impactStyle[p.impact]}`}>
                    {p.impact.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground truncate">{p.name}</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground mb-1">{p.description}</p>
                <span className="font-mono text-[10px] text-muted-foreground">⟳ {p.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
