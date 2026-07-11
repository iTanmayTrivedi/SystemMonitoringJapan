import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/authMode";
import { getStoredAuthMode } from "@/lib/authContext";
import { generateMockAlerts } from "@/lib/mockData";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle, Clock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/hooks/useAlerts";

interface Incident {
  id: string;
  alerts: Alert[];
  startedAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
}

function groupAlertsIntoIncidents(alerts: Alert[]): Incident[] {
  if (alerts.length === 0) return [];
  const sorted = [...alerts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const incidents: Incident[] = [];
  let currentIncident: Alert[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].created_at).getTime();
    const curr = new Date(sorted[i].created_at).getTime();
    if (curr - prev < 5 * 60 * 1000) {
      currentIncident.push(sorted[i]);
    } else {
      incidents.push(buildIncident(currentIncident, incidents.length + 1));
      currentIncident = [sorted[i]];
    }
  }
  incidents.push(buildIncident(currentIncident, incidents.length + 1));
  return incidents.reverse();
}

function buildIncident(alerts: Alert[], index: number): Incident {
  const allResolved = alerts.every((a) => a.acknowledged || a.resolved_at);
  const lastResolved = alerts
    .filter((a) => a.resolved_at || a.acknowledged_at)
    .map((a) => new Date(a.resolved_at || a.acknowledged_at!).getTime())
    .sort((a, b) => b - a)[0];

  return {
    id: `INC-${String(index).padStart(3, "0")}`,
    alerts,
    startedAt: alerts[0].created_at,
    resolvedAt: allResolved && lastResolved ? new Date(lastResolved).toISOString() : null,
    isResolved: allResolved,
  };
}

const severityConfig = {
  warning: { icon: AlertTriangle, badge: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning", label: "WARNING" },
  error: { icon: ShieldAlert, badge: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", label: "ERROR" },
  critical: { icon: AlertOctagon, badge: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", label: "CRITICAL" },
};

export default function Incidents() {
  const { user, hasAccess, isLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

  const isDemo = getStoredAuthMode() === "demo" || !isSupabaseConfigured();

  const fetchAlerts = useCallback(async () => {
    if (isDemo) {
      setAlerts(generateMockAlerts(20));
      setLoadingAlerts(false);
      return;
    }

    try {
      const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (data) setAlerts(data as Alert[]);
    } catch {
      setAlerts(generateMockAlerts(20));
    }
    setLoadingAlerts(false);
  }, [isDemo]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (isDemo) return;

    let channel: any;
    (async () => {
      try {
        channel = supabase.channel("incidents-alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => fetchAlerts()).subscribe();
      } catch {}
    })();

    return () => {
      if (channel) {
        import("@/integrations/supabase/client").then(({ supabase }) => supabase.removeChannel(channel)).catch(() => {});
      }
    };
  }, [fetchAlerts, isDemo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess) return <Navigate to="/" replace />;

  const incidents = groupAlertsIntoIncidents(alerts);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold font-mono text-foreground">Incident Timeline</h1>
            <p className="text-xs text-muted-foreground font-mono">{incidents.length} incidents from {alerts.length} alerts</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* MTTR & Incident Stats */}
        {!loadingAlerts && incidents.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-lg border border-border bg-border/50 overflow-hidden">
            {(() => {
              const resolved = incidents.filter(i => i.isResolved && i.resolvedAt);
              const durations = resolved.map(i => new Date(i.resolvedAt!).getTime() - new Date(i.startedAt).getTime());
              const avgMttr = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
              const activeCount = incidents.filter(i => !i.isResolved).length;
              const resolvedCount = resolved.length;
              const fmtDuration = (ms: number) => {
                if (ms < 60000) return `${Math.round(ms / 1000)}s`;
                if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
                return `${(ms / 3600000).toFixed(1)}h`;
              };
              return (
                <>
                  <div className="bg-card p-4">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Total</span>
                    <span className="text-2xl font-bold font-mono text-foreground">{incidents.length}</span>
                  </div>
                  <div className="bg-card p-4">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Active</span>
                    <span className={`text-2xl font-bold font-mono ${activeCount > 0 ? "text-warning" : "text-primary"}`}>{activeCount}</span>
                  </div>
                  <div className="bg-card p-4">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Resolved</span>
                    <span className="text-2xl font-bold font-mono text-primary">{resolvedCount}</span>
                  </div>
                  <div className="bg-card p-4">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">Avg MTTR</span>
                    <span className="text-2xl font-bold font-mono text-foreground">{avgMttr > 0 ? fmtDuration(avgMttr) : "—"}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {loadingAlerts ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <span className="font-mono text-sm">Loading incidents...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8" />
            <span className="font-mono text-sm">No incidents recorded yet</span>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => {
              const isExpanded = expandedIncident === incident.id;
              const highestSeverity = incident.alerts.reduce((max, a) => {
                const order = { warning: 0, error: 1, critical: 2 };
                return order[a.severity] > order[max] ? a.severity : max;
              }, "warning" as "warning" | "error" | "critical");
              const config = severityConfig[highestSeverity];

              return (
                <div key={incident.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${config.badge}`}>
                      <config.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">{incident.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${config.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                        {incident.isResolved ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20">
                            <CheckCircle className="h-2.5 w-2.5" />
                            RESOLVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-warning bg-warning/10 border border-warning/20 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {incident.alerts.length} alert{incident.alerts.length > 1 ? "s" : ""} · started {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4">
                      <div className="relative ml-5 mt-4">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                        {incident.alerts.map((alert) => {
                          const ac = severityConfig[alert.severity];
                          const AIcon = ac.icon;
                          return (
                            <div key={alert.id} className="relative pl-8 pb-6 last:pb-0">
                              <div className={`absolute left-0 top-1 -translate-x-1/2 h-6 w-6 rounded-full flex items-center justify-center border ${ac.badge} bg-card`}>
                                <AIcon className="h-3 w-3" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${ac.badge}`}>{ac.label}</span>
                                  <span className="text-xs font-mono text-muted-foreground">{alert.source}</span>
                                  <span className="text-xs font-mono text-muted-foreground">·</span>
                                  <span className="text-xs font-mono text-muted-foreground">{format(new Date(alert.created_at), "HH:mm:ss")}</span>
                                </div>
                                <p className="font-mono text-sm text-foreground mt-1">{alert.message}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono text-muted-foreground">{alert.metric}: {alert.value}% (threshold: {alert.threshold}%)</span>
                                  {alert.acknowledged_at && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary">
                                      <User className="h-2.5 w-2.5" />
                                      Acknowledged {format(new Date(alert.acknowledged_at), "HH:mm:ss")}
                                    </span>
                                  )}
                                  {alert.resolved_at && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary">
                                      <CheckCircle className="h-2.5 w-2.5" />
                                      Auto-resolved {format(new Date(alert.resolved_at), "HH:mm:ss")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {incident.isResolved && incident.resolvedAt && (
                          <div className="relative pl-8">
                            <div className="absolute left-0 top-1 -translate-x-1/2 h-6 w-6 rounded-full flex items-center justify-center border border-primary/20 bg-primary/10 text-primary bg-card">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-primary">Incident Resolved</span>
                              <span className="text-xs font-mono text-muted-foreground">{format(new Date(incident.resolvedAt), "HH:mm:ss")}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                {getIncidentDuration(incident.startedAt, incident.resolvedAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function getIncidentDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 1000) return "<1s";
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}m`;
  return `${(diffMs / 3600000).toFixed(1)}h`;
}
