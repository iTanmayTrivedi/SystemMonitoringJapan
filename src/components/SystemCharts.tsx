import { StatsSnapshot } from "@/hooks/useSystemStats";
import { TimeRange } from "@/hooks/useMetricHistory";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Loader2 } from "lucide-react";

interface SystemChartsProps {
  history: StatsSnapshot[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoadingHistory: boolean;
}

const chartConfig = [
  {
    title: "CPU Usage",
    dataKey: "cpu" as const,
    stroke: "hsl(142, 70%, 45%)",
    fill: "hsl(142, 70%, 45%)",
    unit: "%",
  },
  {
    title: "Memory Usage",
    dataKey: "memory" as const,
    stroke: "hsl(38, 92%, 50%)",
    fill: "hsl(38, 92%, 50%)",
    unit: "%",
  },
  {
    title: "Network Traffic",
    dataKey: "network" as const,
    stroke: "hsl(210, 70%, 55%)",
    fill: "hsl(210, 70%, 55%)",
    unit: " Mb/s",
  },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-lg">
      <p className="font-mono text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-xs" style={{ color: p.stroke }}>
          {p.value}
          {p.dataKey === "network" ? " Mb/s" : "%"}
        </p>
      ))}
    </div>
  );
}

export function SystemCharts({ history, timeRange, onTimeRangeChange, isLoadingHistory }: SystemChartsProps) {
  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold text-muted-foreground">System Metrics</h3>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => onTimeRangeChange(tr.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                timeRange === tr.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="font-mono text-xs">Loading historical data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {chartConfig.map((cfg) => (
            <div key={cfg.dataKey} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-mono text-xs font-semibold text-muted-foreground mb-3">
                {cfg.title}
              </h3>
              <div className="h-[160px]">
                {history.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <span className="font-mono text-xs">No data for this period</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${cfg.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={cfg.fill} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={cfg.fill} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)", fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)", fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                        domain={cfg.dataKey === "network" ? [0, "auto"] : [0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={cfg.dataKey}
                        stroke={cfg.stroke}
                        strokeWidth={2}
                        fill={`url(#grad-${cfg.dataKey})`}
                        dot={false}
                        animationDuration={300}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
