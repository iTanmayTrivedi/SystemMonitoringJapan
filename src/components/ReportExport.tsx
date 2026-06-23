import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReportExportProps {
  stats: { cpu: number; memory: number; disk: number; network: number };
  logs: Array<{ id: string; level: string; source: string; message: string; created_at: string }>;
  alerts: Array<{ id: string; severity: string; source: string; metric: string; value: number; threshold: number; message: string; acknowledged: boolean; created_at: string; resolved_at: string | null }>;
}

function generateCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportExport({ stats, logs, alerts }: ReportExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportFullReport = () => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      // System metrics summary
      const metricsCsv = generateCSV(
        ["Metric", "Value", "Unit", "Status", "Timestamp"],
        [
          ["CPU Usage", String(stats.cpu), "%", stats.cpu >= 85 ? "CRITICAL" : stats.cpu >= 60 ? "WARNING" : "HEALTHY", new Date().toISOString()],
          ["Memory Usage", String(stats.memory), "%", stats.memory >= 85 ? "CRITICAL" : stats.memory >= 60 ? "WARNING" : "HEALTHY", new Date().toISOString()],
          ["Disk I/O", String(stats.disk), "%", stats.disk >= 85 ? "CRITICAL" : stats.disk >= 60 ? "WARNING" : "HEALTHY", new Date().toISOString()],
          ["Network", String(stats.network), "Mb/s", "NOMINAL", new Date().toISOString()],
        ]
      );

      // Logs
      const logsCsv = generateCSV(
        ["ID", "Level", "Source", "Message", "Timestamp"],
        logs.map((l) => [l.id, l.level, l.source, l.message, l.created_at])
      );

      // Alerts
      const alertsCsv = generateCSV(
        ["ID", "Severity", "Source", "Metric", "Value", "Threshold", "Message", "Acknowledged", "Created", "Resolved"],
        alerts.map((a) => [
          a.id, a.severity, a.source, a.metric,
          String(a.value), String(a.threshold), a.message,
          a.acknowledged ? "Yes" : "No", a.created_at, a.resolved_at || "",
        ])
      );

      // Combined report
      const report = [
        `# SysMonitor Health Report`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# ───────────────────────────────────`,
        ``,
        `## SYSTEM METRICS`,
        metricsCsv,
        ``,
        `## SYSTEM LOGS (${logs.length} entries)`,
        logsCsv,
        ``,
        `## ALERTS (${alerts.length} entries)`,
        alertsCsv,
      ].join("\n");

      downloadFile(report, `sysmonitor-report-${timestamp}.csv`, "text/csv;charset=utf-8;");
      toast.success("Report exported successfully");
    } catch {
      toast.error("Failed to export report");
    }
    setExporting(false);
  };

  const exportLogsOnly = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const csv = generateCSV(
      ["ID", "Level", "Source", "Message", "Timestamp"],
      logs.map((l) => [l.id, l.level, l.source, l.message, l.created_at])
    );
    downloadFile(csv, `sysmonitor-logs-${timestamp}.csv`, "text/csv;charset=utf-8;");
    toast.success(`${logs.length} logs exported`);
  };

  const exportAlertsOnly = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const csv = generateCSV(
      ["ID", "Severity", "Source", "Metric", "Value", "Threshold", "Message", "Acknowledged", "Created", "Resolved"],
      alerts.map((a) => [
        a.id, a.severity, a.source, a.metric,
        String(a.value), String(a.threshold), a.message,
        a.acknowledged ? "Yes" : "No", a.created_at, a.resolved_at || "",
      ])
    );
    downloadFile(csv, `sysmonitor-alerts-${timestamp}.csv`, "text/csv;charset=utf-8;");
    toast.success(`${alerts.length} alerts exported`);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-mono font-semibold text-sm text-foreground">Export Reports</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={exportFullReport}
          disabled={exporting}
          className="w-full justify-start font-mono text-xs"
        >
          {exporting ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Download className="h-3 w-3 mr-2" />}
          Full System Report
          <span className="ml-auto text-[10px] text-muted-foreground">CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportLogsOnly}
          className="w-full justify-start font-mono text-xs"
        >
          <Download className="h-3 w-3 mr-2" />
          Logs Only ({logs.length} entries)
          <span className="ml-auto text-[10px] text-muted-foreground">CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportAlertsOnly}
          className="w-full justify-start font-mono text-xs"
        >
          <Download className="h-3 w-3 mr-2" />
          Alerts Only ({alerts.length} entries)
          <span className="ml-auto text-[10px] text-muted-foreground">CSV</span>
        </Button>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[10px] font-mono text-muted-foreground">
          Reports include real-time metrics, system logs, and alert history with resolution tracking.
        </p>
      </div>
    </div>
  );
}
