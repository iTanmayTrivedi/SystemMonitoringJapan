import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Alert } from "@/hooks/useAlerts";
import { Bell, BellOff, CheckCheck, ShieldAlert, AlertTriangle, AlertOctagon, X, Clock, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertPanelProps {
  alerts: Alert[];
  unacknowledgedCount: number;
  onAcknowledge?: (id: string) => void;
  onAcknowledgeAll?: () => void;
}

const severityConfig = {
  warning: {
    icon: AlertTriangle,
    badge: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    label: "WARNING",
  },
  error: {
    icon: ShieldAlert,
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    label: "ERROR",
  },
  critical: {
    icon: AlertOctagon,
    badge: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse-glow",
    dot: "bg-destructive animate-pulse-glow",
    label: "CRITICAL",
  },
};

export function AlertBadge({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
    >
      {count > 0 ? (
        <Bell className="h-4 w-4 text-warning" />
      ) : (
        <BellOff className="h-4 w-4 text-muted-foreground" />
      )}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-mono font-bold flex items-center justify-center animate-pulse-glow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function getResolutionTime(alert: Alert): string | null {
  const resolvedAt = alert.resolved_at || alert.acknowledged_at;
  if (!resolvedAt) return null;
  const created = new Date(alert.created_at).getTime();
  const resolved = new Date(resolvedAt).getTime();
  const diffMs = resolved - created;
  if (diffMs < 1000) return "<1s";
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}m`;
  return `${Math.round(diffMs / 3600000)}h`;
}

export function AlertPanel({ alerts, unacknowledgedCount, onAcknowledge, onAcknowledgeAll }: AlertPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const displayAlerts = showAll ? alerts : alerts.filter((a) => !a.acknowledged);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-warning" />
          <h3 className="font-mono font-semibold text-sm text-foreground">Alerts</h3>
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-mono font-bold">
              {unacknowledgedCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? "Active only" : "Show all"}
          </button>
          {unacknowledgedCount > 0 && onAcknowledgeAll && (
            <Button variant="outline" size="sm" onClick={onAcknowledgeAll} className="font-mono text-xs h-7">
              <CheckCheck className="h-3 w-3 mr-1" />
              Ack all
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {displayAlerts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <span className="font-mono text-sm">
              {showAll ? "No alerts recorded" : "No active alerts — all clear ✓"}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {displayAlerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              const resTime = getResolutionTime(alert);
              return (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-accent/30 transition-colors ${
                    alert.acknowledged ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-8 w-8 rounded-md flex items-center justify-center shrink-0 border ${config.badge}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${config.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {alert.source}
                        </span>
                        {alert.resolved_at && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20">
                            <CheckCircle className="h-2.5 w-2.5" />
                            AUTO-RESOLVED
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-sm text-foreground">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                        {resTime && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            resolved in {resTime}
                          </span>
                        )}
                        {alert.acknowledged_at && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                            <User className="h-2.5 w-2.5" />
                            ack {formatDistanceToNow(new Date(alert.acknowledged_at), { addSuffix: true })}
                          </span>
                        )}
                        {!alert.acknowledged && onAcknowledge && (
                          <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="text-xs font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1 ml-auto"
                          >
                            <X className="h-3 w-3" />
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
