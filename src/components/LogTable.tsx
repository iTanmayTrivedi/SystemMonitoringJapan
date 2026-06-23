import { formatDistanceToNow } from "date-fns";

export interface LogEntry {
  id: string;
  level: "info" | "warning" | "error";
  source: string;
  message: string;
  created_at: string;
}

interface LogTableProps {
  logs: LogEntry[];
  isLoading: boolean;
}

const levelBadge = {
  info: "bg-primary/10 text-primary border border-primary/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  error: "bg-destructive/10 text-destructive border border-destructive/20",
};

const levelDot = {
  info: "bg-primary",
  warning: "bg-warning",
  error: "bg-destructive",
};

export function LogTable({ logs, isLoading }: LogTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-sm">Loading logs...</span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-sm text-muted-foreground">No logs found</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto scrollbar-thin max-h-[600px]">
      <table className="w-full">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level</th>
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</th>
            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border/50 hover:bg-accent/50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${levelBadge[log.level]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${levelDot[log.level]}`} />
                  {log.level.toUpperCase()}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="font-mono text-sm text-secondary-foreground">{log.source}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-mono text-sm text-foreground">{log.message}</span>
              </td>
              <td className="py-3 px-4">
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
