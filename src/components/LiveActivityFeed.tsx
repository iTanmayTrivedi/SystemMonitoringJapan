import { useState, useEffect, useRef } from "react";
import { Activity, Zap, Server, Shield, Database, Wifi, ArrowUp, ArrowDown } from "lucide-react";

interface ActivityEvent {
  id: string;
  type: "deploy" | "alert" | "metric" | "auth" | "network" | "system";
  message: string;
  timestamp: Date;
  severity: "info" | "warning" | "success" | "error";
}

const typeIcons = {
  deploy: Zap,
  alert: Shield,
  metric: Activity,
  auth: Shield,
  network: Wifi,
  system: Server,
};

const severityStyles = {
  info: "border-primary/30 bg-primary/5",
  warning: "border-warning/30 bg-warning/5",
  success: "border-primary/30 bg-primary/5",
  error: "border-destructive/30 bg-destructive/5",
};

const severityDot = {
  info: "bg-primary",
  warning: "bg-warning",
  success: "bg-primary",
  error: "bg-destructive",
};

const EVENT_TEMPLATES: Array<{ type: ActivityEvent["type"]; severity: ActivityEvent["severity"]; message: string }> = [
  { type: "deploy", severity: "success", message: "Deployment v2.4.1 rolled out to production" },
  { type: "metric", severity: "info", message: "CPU utilization stabilized at 42%" },
  { type: "network", severity: "info", message: "Ingress traffic: 2.4k req/s — nominal" },
  { type: "auth", severity: "warning", message: "Failed login attempt from 192.168.1.45" },
  { type: "system", severity: "info", message: "Cron job backup-daily completed successfully" },
  { type: "alert", severity: "warning", message: "Memory pressure detected on worker-03" },
  { type: "metric", severity: "info", message: "Response p99 latency: 124ms" },
  { type: "deploy", severity: "success", message: "Config update applied: rate-limit rules" },
  { type: "network", severity: "error", message: "DNS resolution timeout for cdn.upstream.io" },
  { type: "system", severity: "info", message: "Auto-scaling: added 1 instance (total: 4)" },
  { type: "auth", severity: "info", message: "API key rotated for service: analytics" },
  { type: "metric", severity: "info", message: "Disk throughput: 450 MB/s read, 120 MB/s write" },
  { type: "alert", severity: "error", message: "Circuit breaker OPEN for payments-service" },
  { type: "system", severity: "success", message: "Health check passed: all 12 services green" },
  { type: "network", severity: "info", message: "TLS certificate renewed — expires 2027-03-08" },
];

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Seed initial events
    const initial: ActivityEvent[] = [];
    for (let i = 4; i >= 0; i--) {
      const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      initial.push({
        id: `init-${i}`,
        ...tpl,
        timestamp: new Date(Date.now() - i * 8000),
      });
    }
    setEvents(initial);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...tpl,
        timestamp: new Date(),
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 30));
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-mono font-semibold text-sm text-foreground">Live Activity Feed</h3>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
          </div>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="px-2 py-1 rounded text-[10px] font-mono font-bold border border-border bg-secondary hover:bg-accent text-muted-foreground transition-colors"
        >
          {isPaused ? "▶ RESUME" : "❚❚ PAUSE"}
        </button>
      </div>

      <div ref={feedRef} className="max-h-[320px] overflow-y-auto scrollbar-thin divide-y divide-border/30">
        {events.map((event, index) => {
          const Icon = typeIcons[event.type];
          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 px-4 py-3 transition-all duration-500 ${
                index === 0 ? "animate-in slide-in-from-top-2 fade-in duration-500" : ""
              } hover:bg-accent/30`}
            >
              <div className={`mt-0.5 h-6 w-6 rounded flex items-center justify-center shrink-0 border ${severityStyles[event.severity]}`}>
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-foreground leading-relaxed">{event.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${severityDot[event.severity]}`} />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{event.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
