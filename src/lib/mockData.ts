/**
 * Mock data generators for fully offline demo mode.
 */
import type { LogEntry } from "@/components/LogTable";
import type { Alert, AlertRule } from "@/hooks/useAlerts";

// ─── Demo Users ───
export interface DemoUser {
  id: string;
  email: string;
  role: "admin" | "viewer" | "user";
  label: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "demo-admin-001", email: "admin@demo.app", role: "admin", label: "Admin" },
  { id: "demo-viewer-001", email: "viewer@demo.app", role: "viewer", label: "Viewer" },
  { id: "demo-user-001", email: "user@demo.app", role: "user", label: "User" },
];

// ─── Mock Logs ───
const SOURCES = ["nginx", "api-gateway", "auth-service", "db-primary", "cache-redis", "worker-queue"];
const LEVELS = ["info", "warning", "error"] as const;
const LOG_MESSAGES: Record<string, string[]> = {
  info: [
    "Health check passed",
    "Request completed in 45ms",
    "Cache hit ratio: 94%",
    "Connection pool: 12/50 active",
    "Backup snapshot completed",
    "SSL certificate renewed",
    "Worker processed 150 jobs",
    "Memory usage within limits",
  ],
  warning: [
    "Response time exceeded 500ms threshold",
    "Disk usage at 78% — approaching limit",
    "Rate limit approaching for /api/data endpoint",
    "Connection pool utilization above 80%",
    "Certificate expiry in 14 days",
    "Retry attempt 2/3 for upstream request",
  ],
  error: [
    "Connection refused: upstream timeout after 30s",
    "Out of memory: process killed (OOM)",
    "Database query timeout: SELECT * FROM metrics",
    "TLS handshake failed: certificate mismatch",
    "Disk I/O error on /dev/sda1",
    "Authentication token expired unexpectedly",
  ],
};

export function generateMockLogs(count = 80): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const level = LEVELS[Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2];
    const messages = LOG_MESSAGES[level];
    logs.push({
      id: `mock-log-${i}`,
      level,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      created_at: new Date(now - i * 15000 - Math.random() * 5000).toISOString(),
    });
  }

  return logs;
}

// ─── Mock Alerts ───
export function generateMockAlerts(count = 12): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();
  const metrics = ["cpu", "memory", "disk"];
  const severities: Alert["severity"][] = ["warning", "error", "critical"];

  for (let i = 0; i < count; i++) {
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const value = 70 + Math.floor(Math.random() * 30);
    const threshold = 60 + Math.floor(Math.random() * 20);
    const acked = Math.random() > 0.5;

    alerts.push({
      id: `mock-alert-${i}`,
      severity,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      metric,
      value,
      threshold,
      message: `${metric.toUpperCase()} at ${value}% exceeds ${threshold}% threshold`,
      acknowledged: acked,
      acknowledged_by: acked ? "demo-admin-001" : null,
      acknowledged_at: acked ? new Date(now - i * 60000).toISOString() : null,
      resolved_at: acked && Math.random() > 0.5 ? new Date(now - i * 30000).toISOString() : null,
      created_at: new Date(now - i * 120000 - Math.random() * 60000).toISOString(),
    });
  }

  return alerts;
}

// ─── Mock Alert Rules ───
export function generateMockAlertRules(): AlertRule[] {
  return [
    {
      id: "mock-rule-1",
      metric: "cpu",
      source: "system",
      threshold: 85,
      duration_seconds: 30,
      severity: "warning",
      message_template: "CPU at {value}% exceeds {threshold}%",
      cooldown_seconds: 60,
      enabled: true,
      created_by: "demo-admin-001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mock-rule-2",
      metric: "memory",
      source: "system",
      threshold: 90,
      duration_seconds: 60,
      severity: "error",
      message_template: "Memory at {value}% exceeds {threshold}%",
      cooldown_seconds: 120,
      enabled: true,
      created_by: "demo-admin-001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mock-rule-3",
      metric: "disk",
      source: "system",
      threshold: 95,
      duration_seconds: 120,
      severity: "critical",
      message_template: "Disk at {value}% exceeds {threshold}%",
      cooldown_seconds: 300,
      enabled: false,
      created_by: "demo-admin-001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

// ─── Mock Metric History ───
export function generateMockMetricHistory(count = 50): Array<{
  cpu: number; memory: number; disk: number; network: number; time: string;
}> {
  const data = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    data.push({
      cpu: 30 + Math.floor(Math.random() * 50),
      memory: 50 + Math.floor(Math.random() * 35),
      disk: 40 + Math.floor(Math.random() * 20),
      network: 10 + Math.floor(Math.random() * 60),
      time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`,
    });
  }
  return data;
}
