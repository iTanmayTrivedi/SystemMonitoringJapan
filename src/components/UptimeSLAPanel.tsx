import { useState, useMemo } from "react";
import { Shield, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface DayStatus {
  date: string;
  uptime: number; // 0–100
  incidents: number;
}

function generateUptimeData(days: number): DayStatus[] {
  const data: DayStatus[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Mostly high uptime with occasional dips
    const base = 99.5 + Math.random() * 0.5;
    const hasIncident = Math.random() < 0.12;
    const uptime = hasIncident ? 95 + Math.random() * 4.5 : base;
    data.push({
      date: d.toISOString().split("T")[0],
      uptime: Math.round(uptime * 100) / 100,
      incidents: hasIncident ? Math.ceil(Math.random() * 3) : 0,
    });
  }
  return data;
}

function getUptimeColor(uptime: number): string {
  if (uptime >= 99.9) return "bg-primary";
  if (uptime >= 99.0) return "bg-primary/60";
  if (uptime >= 97.0) return "bg-warning";
  return "bg-destructive";
}

function getUptimeBorderColor(uptime: number): string {
  if (uptime >= 99.9) return "border-primary/40";
  if (uptime >= 99.0) return "border-primary/20";
  if (uptime >= 97.0) return "border-warning/40";
  return "border-destructive/40";
}

type TimeWindow = "7d" | "30d" | "90d";

export function UptimeSLAPanel() {
  const [window, setWindow] = useState<TimeWindow>("30d");
  const days = window === "7d" ? 7 : window === "30d" ? 30 : 90;
  const data = useMemo(() => generateUptimeData(days), [days]);

  const avgUptime = data.reduce((s, d) => s + d.uptime, 0) / data.length;
  const totalIncidents = data.reduce((s, d) => s + d.incidents, 0);
  const slaTarget = 99.9;
  const slaMet = avgUptime >= slaTarget;
  const downtimeMinutes = Math.round(((100 - avgUptime) / 100) * days * 24 * 60);

  // MTTR calculation (mock)
  const mttr = totalIncidents > 0 ? Math.round(downtimeMinutes / totalIncidents) : 0;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-mono font-semibold text-sm text-foreground">Uptime & SLA</h3>
        </div>
        <div className="flex rounded-md border border-border overflow-hidden">
          {(["7d", "30d", "90d"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold transition-colors ${
                window === w
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {w.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SLA Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Uptime</span>
          </div>
          <span className={`text-2xl font-bold font-mono ${slaMet ? "text-primary" : "text-warning"}`}>
            {avgUptime.toFixed(3)}%
          </span>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">SLA Target</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">{slaTarget}%</span>
            {slaMet ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20">
                <CheckCircle className="h-2.5 w-2.5" /> MET
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-warning bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-2.5 w-2.5" /> BREACH
              </span>
            )}
          </div>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Downtime</span>
          </div>
          <span className="text-2xl font-bold font-mono text-foreground">
            {downtimeMinutes < 60 ? `${downtimeMinutes}m` : `${(downtimeMinutes / 60).toFixed(1)}h`}
          </span>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">MTTR</span>
          </div>
          <span className="text-2xl font-bold font-mono text-foreground">
            {mttr > 0 ? `${mttr}m` : "—"}
          </span>
        </div>
      </div>

      {/* Uptime Grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Daily Uptime — {days} days</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
              <span className="text-[9px] font-mono text-muted-foreground">≥99.9%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
              <span className="text-[9px] font-mono text-muted-foreground">≥99%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-warning" />
              <span className="text-[9px] font-mono text-muted-foreground">≥97%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-destructive" />
              <span className="text-[9px] font-mono text-muted-foreground">&lt;97%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-[3px] flex-wrap">
          {data.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.uptime}% uptime${day.incidents > 0 ? `, ${day.incidents} incident${day.incidents > 1 ? "s" : ""}` : ""}`}
              className={`h-5 rounded-sm border transition-all hover:scale-125 cursor-pointer ${getUptimeColor(day.uptime)} ${getUptimeBorderColor(day.uptime)}`}
              style={{ width: days <= 30 ? "calc((100% - 87px) / 30)" : days <= 7 ? "calc((100% - 18px) / 7)" : "8px" }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] font-mono text-muted-foreground">{data[0]?.date}</span>
          <span className="text-[9px] font-mono text-muted-foreground">{data[data.length - 1]?.date}</span>
        </div>
      </div>

      {/* Incidents Summary */}
      <div className="border-t border-border p-4">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {totalIncidents} incident{totalIncidents !== 1 ? "s" : ""} in {days} days · {data.filter(d => d.uptime >= 99.9).length}/{days} days at 99.9%+
        </span>
      </div>
    </div>
  );
}
