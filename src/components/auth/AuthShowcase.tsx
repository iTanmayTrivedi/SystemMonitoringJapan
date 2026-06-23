import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Shield, Bell, Cpu, HardDrive, Wifi, BarChart3,
  AlertTriangle, CheckCircle2, Terminal, Search, FileText, Settings,
  X, Server, Database, Zap, Globe
} from "lucide-react";

const METRICS = [
  { label: "CPU Usage", value: 42, icon: Cpu, color: "text-primary" },
  { label: "Memory", value: 67, icon: HardDrive, color: "text-blue-400" },
  { label: "Network I/O", value: 23, icon: Wifi, color: "text-purple-400" },
  { label: "Disk", value: 54, icon: BarChart3, color: "text-amber-400" },
];

const LOG_LINES = [
  { level: "INFO", source: "api-gateway", msg: "Request processed in 42ms", time: "10:23:01" },
  { level: "WARN", source: "db-primary", msg: "Connection pool at 80%", time: "10:23:04" },
  { level: "INFO", source: "auth-service", msg: "User session validated", time: "10:23:06" },
  { level: "ERROR", source: "worker-3", msg: "Task timeout exceeded 30s", time: "10:23:08" },
  { level: "INFO", source: "cdn-edge", msg: "Cache hit ratio: 94.2%", time: "10:23:11" },
  { level: "INFO", source: "scheduler", msg: "Cron job completed", time: "10:23:14" },
];

const PROGRESS_ITEMS = [
  "Monitor system metrics",
  "Detect anomalies with AI",
  "Configure alert thresholds",
  "Analyze root causes",
  "Generate incident report",
  "Notify on-call engineer",
];

const ALERTS = [
  { severity: "critical", msg: "CPU spike on worker-3", status: "active" },
  { severity: "warning", msg: "Memory above 80%", status: "active" },
  { severity: "warning", msg: "API response > 500ms", status: "resolved" },
];

const CONTEXT_ITEMS = [
  {
    icon: FileText, label: "System Logs",
    detail: "Real-time log aggregation from all services. Supports filtering by level, source, and time range with full-text search.",
  },
  {
    icon: Settings, label: "Alert Config",
    detail: "Configure thresholds for CPU, memory, disk, and custom metrics. Set cooldown periods and notification channels.",
  },
  {
    icon: Activity, label: "Live Metrics",
    detail: "Streaming system metrics with 10s resolution. Historical data retained for 30 days with automatic downsampling.",
  },
  {
    icon: Shield, label: "Security Audit",
    detail: "Automated security scanning for misconfigurations, exposed endpoints, and anomalous access patterns.",
  },
];

const SERVICES = [
  { name: "api-gateway", icon: Globe, status: "healthy", latency: "42ms", uptime: "99.97%", requests: "12.4k/min" },
  { name: "db-primary", icon: Database, status: "healthy", latency: "8ms", uptime: "99.99%", requests: "8.2k/min" },
  { name: "worker-3", icon: Zap, status: "degraded", latency: "320ms", uptime: "98.2%", requests: "1.1k/min" },
  { name: "cdn-edge", icon: Server, status: "healthy", latency: "12ms", uptime: "99.98%", requests: "45k/min" },
];

/* ── Metric Bar ── */
function MetricBar({ metric, delay }: { metric: typeof METRICS[0]; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(metric.value), delay);
    return () => clearTimeout(t);
  }, [metric.value, delay]);

  return (
    <div className="flex items-center gap-2.5">
      <metric.icon className={`h-3.5 w-3.5 ${metric.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] font-mono mb-0.5">
          <span className="text-muted-foreground">{metric.label}</span>
          <span className={metric.color}>{metric.value}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${width}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: delay / 1000 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Log Stream with hover highlight ── */
function LogStream() {
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const [hoveredLog, setHoveredLog] = useState<number | null>(null);

  useEffect(() => {
    LOG_LINES.forEach((_, i) => {
      setTimeout(() => setVisibleLogs((prev) => [...prev, i]), 800 + i * 450);
    });
  }, []);

  const getLevelColor = (level: string) => {
    if (level === "ERROR") return "text-destructive";
    if (level === "WARN") return "text-amber-400";
    return "text-primary";
  };

  const getLevelBg = (level: string) => {
    if (level === "ERROR") return "bg-destructive/10 border-destructive/20";
    if (level === "WARN") return "bg-amber-500/10 border-amber-500/20";
    return "bg-primary/5 border-primary/10";
  };

  return (
    <div className="space-y-0.5 font-mono text-[9px] overflow-hidden">
      <AnimatePresence>
        {visibleLogs.map((i) => {
          const log = LOG_LINES[i];
          const isHovered = hoveredLog === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setHoveredLog(i)}
              onHoverEnd={() => setHoveredLog(null)}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md border cursor-default transition-all duration-200 ${
                isHovered
                  ? `${getLevelBg(log.level)} scale-[1.01]`
                  : "border-transparent"
              }`}
            >
              <span className="text-muted-foreground/50 shrink-0">{log.time}</span>
              <span className={`font-bold w-9 shrink-0 ${getLevelColor(log.level)}`}>{log.level}</span>
              <span className="text-muted-foreground/70 w-16 truncate shrink-0">{log.source}</span>
              <span className={`truncate transition-colors duration-200 ${isHovered ? "text-foreground" : "text-foreground/60"}`}>
                {log.msg}
              </span>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto shrink-0"
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${log.level === "ERROR" ? "bg-destructive" : log.level === "WARN" ? "bg-amber-400" : "bg-primary"} animate-pulse`} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── Card wrapper ── */
function ShowcaseCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`rounded-xl border border-border bg-card/80 backdrop-blur-sm p-3.5 shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── Service Detail Popup ── */
function ServicePopup({ service, onClose }: { service: typeof SERVICES[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 left-0 right-0 -bottom-1 translate-y-full"
    >
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <service.icon className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] font-semibold text-foreground">{service.name}</span>
          </div>
          <button onClick={onClose} className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
            <X className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Latency", value: service.latency },
            { label: "Uptime", value: service.uptime },
            { label: "Requests", value: service.requests },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-secondary/60 p-1.5 text-center">
              <p className="font-mono text-[7px] text-muted-foreground uppercase">{stat.label}</p>
              <p className="font-mono text-[10px] font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${service.status === "healthy" ? "bg-primary" : "bg-amber-400"} animate-pulse`} />
          <span className={`font-mono text-[8px] font-bold uppercase ${service.status === "healthy" ? "text-primary" : "text-amber-400"}`}>
            {service.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Context Detail Popup ── */
function ContextPopup({ item, onClose }: { item: typeof CONTEXT_ITEMS[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 bottom-0 right-0 translate-x-[calc(100%+8px)]"
      style={{ width: "180px" }}
    >
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <item.icon className="h-3 w-3 text-primary" />
            <span className="font-mono text-[9px] font-semibold text-foreground">{item.label}</span>
          </div>
          <button onClick={onClose} className="h-3.5 w-3.5 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
            <X className="h-2 w-2 text-muted-foreground" />
          </button>
        </div>
        <p className="font-mono text-[8px] text-muted-foreground leading-relaxed">{item.detail}</p>
      </div>
    </motion.div>
  );
}

/* ── Main Export ── */
export function AuthShowcase() {
  const [activeTab, setActiveTab] = useState<"monitor" | "alerts">("monitor");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeContext, setActiveContext] = useState<number | null>(null);

  // Auto-check items on mount
  useEffect(() => {
    PROGRESS_ITEMS.forEach((_, i) => {
      setTimeout(() => setCheckedItems((prev) => new Set([...prev, i])), 1500 + i * 400);
    });
  }, []);

  const toggleCheck = useCallback((index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const filteredServices = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center p-5 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* 2-column grid layout */}
      <div className="relative w-full max-w-[540px] flex flex-col gap-3">
        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="inline-flex rounded-full border border-border bg-card/90 backdrop-blur-md p-1 shadow-md">
            {(["monitor", "alerts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "monitor" ? "Monitor" : "Alerts"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Row 1: Main panel + Progress */}
        <div className="grid grid-cols-5 gap-3">
          {/* Main panel — 3 cols */}
          <div className="col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === "monitor" ? (
                <ShowcaseCard key="monitor" delay={0.3} className="h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-[11px] font-semibold text-foreground">System Metrics</span>
                    <div className="ml-auto flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono text-[9px] text-primary">LIVE</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {METRICS.map((m, i) => (
                      <MetricBar key={m.label} metric={m} delay={500 + i * 250} />
                    ))}
                  </div>
                </ShowcaseCard>
              ) : (
                <ShowcaseCard key="alerts" delay={0.1} className="h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-[11px] font-semibold text-foreground">Active Alerts</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[9px] font-mono font-bold">
                      2
                    </span>
                  </div>
                  <div className="space-y-2">
                    {ALERTS.map((alert, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                          alert.status === "resolved"
                            ? "border-border bg-secondary/50 opacity-60"
                            : alert.severity === "critical"
                            ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                            : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                        }`}
                      >
                        {alert.status === "resolved" ? (
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle
                            className={`h-3 w-3 shrink-0 mt-0.5 ${
                              alert.severity === "critical" ? "text-destructive" : "text-amber-400"
                            }`}
                          />
                        )}
                        <div>
                          <p className="font-mono text-[10px] text-foreground leading-tight">{alert.msg}</p>
                          <span
                            className={`font-mono text-[8px] font-bold uppercase ${
                              alert.status === "resolved" ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ShowcaseCard>
              )}
            </AnimatePresence>
          </div>

          {/* Progress — 2 cols — clickable checkboxes */}
          <ShowcaseCard delay={0.45} className="col-span-2">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono text-[11px] font-semibold text-foreground">Progress</span>
              <span className="font-mono text-[9px] text-muted-foreground">
                {checkedItems.size}/{PROGRESS_ITEMS.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {PROGRESS_ITEMS.map((label, i) => {
                const isDone = checkedItems.has(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: isDone ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 group cursor-pointer select-none"
                    onClick={() => toggleCheck(i)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-mono font-bold border shrink-0 transition-all duration-200 ${
                        isDone
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "border-border text-muted-foreground group-hover:border-primary/40 group-hover:bg-primary/5"
                      }`}
                    >
                      {isDone ? "✓" : ""}
                    </motion.div>
                    <span
                      className={`font-mono text-[9px] truncate transition-all duration-200 ${
                        isDone ? "text-foreground line-through decoration-primary/30" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </ShowcaseCard>
        </div>

        {/* Row 2: Log Stream (full width) */}
        <ShowcaseCard delay={0.55}>
          <div className="flex items-center gap-1.5 mb-2">
            <Terminal className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[9px] text-muted-foreground">Log Stream</span>
            <div className="ml-auto flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[8px] text-primary/70">streaming</span>
            </div>
          </div>
          <LogStream />
        </ShowcaseCard>

        {/* Row 3: Search + Context side by side */}
        <div className="grid grid-cols-5 gap-3">
          {/* Search — 3 cols */}
          <ShowcaseCard delay={0.65} className="col-span-3 relative">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/60 border border-border mb-2.5 focus-within:border-primary/40 focus-within:bg-secondary/80 transition-all">
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedService(null); }}
                className="bg-transparent font-mono text-[9px] text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="shrink-0">
                  <X className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service) => (
                  <motion.div
                    key={service.name}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedService === service.name
                        ? "bg-primary/15 border-primary/40 ring-1 ring-primary/20"
                        : "bg-primary/5 border-primary/10 hover:bg-primary/10 hover:border-primary/30"
                    }`}
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${service.status === "healthy" ? "bg-primary/60" : "bg-amber-400/60"}`} />
                    <span className="font-mono text-[8px] text-muted-foreground truncate">{service.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredServices.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-2 text-center font-mono text-[8px] text-muted-foreground/50 py-2"
                >
                  No services found
                </motion.p>
              )}
            </div>
            {/* Service detail popup */}
            <AnimatePresence>
              {selectedService && (
                <ServicePopup
                  service={SERVICES.find((s) => s.name === selectedService)!}
                  onClose={() => setSelectedService(null)}
                />
              )}
            </AnimatePresence>
          </ShowcaseCard>

          {/* Context — 2 cols */}
          <ShowcaseCard delay={0.7} className="col-span-2 relative">
            <span className="font-mono text-[11px] font-semibold text-foreground mb-2 block">Context</span>
            <div className="space-y-1">
              {CONTEXT_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                  onClick={() => setActiveContext(activeContext === i ? null : i)}
                  className={`flex items-center gap-2 py-1 rounded-md px-1 transition-all duration-200 cursor-pointer ${
                    activeContext === i
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-secondary/60"
                  }`}
                >
                  <div className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                    activeContext === i ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    <item.icon className={`h-3 w-3 ${activeContext === i ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`font-mono text-[9px] transition-colors ${
                    activeContext === i ? "text-foreground" : "text-muted-foreground"
                  }`}>{item.label}</span>
                </motion.div>
              ))}
            </div>
            {/* Context detail popup */}
            <AnimatePresence>
              {activeContext !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 left-0 right-0 -bottom-1 translate-y-full"
                >
                  <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {(() => { const Icon = CONTEXT_ITEMS[activeContext].icon; return <Icon className="h-3 w-3 text-primary" />; })()}
                        <span className="font-mono text-[9px] font-semibold text-foreground">{CONTEXT_ITEMS[activeContext].label}</span>
                      </div>
                      <button onClick={() => setActiveContext(null)} className="h-3.5 w-3.5 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                        <X className="h-2 w-2 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="font-mono text-[8px] text-muted-foreground leading-relaxed">{CONTEXT_ITEMS[activeContext].detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ShowcaseCard>
        </div>
      </div>
    </div>
  );
}
