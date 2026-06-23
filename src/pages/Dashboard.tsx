import { useAuth } from "@/hooks/useAuth";
import { useLogs } from "@/hooks/useLogs";
import { useSystemStats } from "@/hooks/useSystemStats";
import { useAlerts } from "@/hooks/useAlerts";
import { useMetricHistory } from "@/hooks/useMetricHistory";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n";
import { StatusCard } from "@/components/StatusCard";
import { SystemCharts } from "@/components/SystemCharts";
import { LogTable } from "@/components/LogTable";
import { LogFilters } from "@/components/LogFilters";
import { AlertBadge, AlertPanel } from "@/components/AlertPanel";
import { AlertRulesPanel } from "@/components/AlertRulesPanel";
import { AiInsightsPanel } from "@/components/AiInsightsPanel";
import { AnomalyDetectionPanel } from "@/components/AnomalyDetectionPanel";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { UptimeSLAPanel } from "@/components/UptimeSLAPanel";
import { ReportExport } from "@/components/ReportExport";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Navigate } from "react-router-dom";
import { Cpu, MemoryStick, HardDrive, Wifi, Terminal, LogOut, RefreshCw, Eye, Settings2, RotateCcw, FileText, WifiOff, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

function getVariant(value: number): "success" | "warning" | "danger" {
  if (value < 60) return "success";
  if (value < 85) return "warning";
  return "danger";
}

export default function Dashboard() {
  const { user, isAdmin, isViewer, hasAccess, isLoading, signOut, role, authMode } = useAuth();
  const { logs, isLoading: logsLoading, search, setSearch, levelFilter, setLevelFilter, sourceFilter, setSourceFilter } = useLogs();
  const stats = useSystemStats();
  const { alerts, rules, unacknowledgedCount, acknowledgeAlert, acknowledgeAll, addRule, updateRule, deleteRule, toggleRule } = useAlerts(stats);
  const { timeRange, setTimeRange, displayHistory, isLoadingHistory } = useMetricHistory(stats.history, stats);
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  const isDemo = authMode === "demo";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-sm">{t("init")}</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold font-mono text-destructive mb-2">{t("access.denied")}</h2>
          <p className="text-muted-foreground font-mono text-sm mb-4">{t("access.required")}</p>
          <Button variant="outline" onClick={signOut} className="font-mono">
            <LogOut className="h-4 w-4 mr-2" /> {t("nav.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  const generateLogs = async () => {
    if (isDemo) { toast.success("Sample logs refreshed (demo mode)"); return; }
    setGenerating(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const res = await supabase.functions.invoke("generate-logs");
      if (res.error) throw res.error;
      toast.success("Sample logs generated");
    } catch { toast.error("Failed to generate logs"); }
    setGenerating(false);
  };

  const resetDemo = async () => {
    if (isDemo) { toast.success("Demo data refreshed"); return; }
    setResetting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke("demo-login", { body: { action: "reset" } });
      if (error) throw error;
      toast.success("Demo data reset");
    } catch { toast.error("Failed to reset demo data"); }
    setResetting(false);
  };

  const logCounts = {
    total: logs.length,
    errors: logs.filter((l) => l.level === "error").length,
    warnings: logs.filter((l) => l.level === "warning").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-green">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-mono text-foreground">{t("app.title")}</h1>
              <p className="text-xs text-muted-foreground font-mono">{t("app.subtitle")}</p>
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {isDemo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono font-bold bg-warning/10 text-warning border border-warning/20">
                <WifiOff className="h-3 w-3" />
                DEMO
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isAdmin ? "bg-primary/10 text-primary border-primary/20" : "bg-accent text-muted-foreground border-border"
            }`}>
              {isViewer && <Eye className="h-3 w-3" />}
              {role.toUpperCase()}
            </span>
            <CommandPalette
              onToggleTheme={toggleTheme}
              onToggleAlerts={() => setShowAlerts(!showAlerts)}
              onToggleRules={() => setShowRules(!showRules)}
              theme={theme}
            />
            <LanguageToggle />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <AlertBadge count={unacknowledgedCount} onClick={() => setShowAlerts(!showAlerts)} />
            <Link to="/incidents">
              <button className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center hover:bg-accent transition-colors" title={t("nav.incidents")}>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </button>
            </Link>
            <button onClick={() => setShowRules(!showRules)} className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center hover:bg-accent transition-colors" title={t("nav.alertRules")}>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={generateLogs} disabled={generating} className="font-mono text-xs">
                <RefreshCw className={`h-3 w-3 mr-1.5 ${generating ? "animate-spin" : ""}`} />
                {t("btn.generateLogs")}
              </Button>
            )}
            {isDemo && (
              <Button variant="outline" size="sm" onClick={resetDemo} disabled={resetting} className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10">
                <RotateCcw className={`h-3 w-3 mr-1.5 ${resetting ? "animate-spin" : ""}`} />
                {t("btn.refreshDemo")}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="font-mono text-xs text-muted-foreground">
              <LogOut className="h-3 w-3 mr-1.5" />
              {t("nav.signOut")}
            </Button>
          </div>

          {/* Mobile: key icons + hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <AlertBadge count={unacknowledgedCount} onClick={() => setShowAlerts(!showAlerts)} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center hover:bg-accent transition-colors active:scale-95"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-foreground" /> : <Menu className="h-4 w-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                {isDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono font-bold bg-warning/10 text-warning border border-warning/20">
                    <WifiOff className="h-3 w-3" /> DEMO
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  isAdmin ? "bg-primary/10 text-primary border-primary/20" : "bg-accent text-muted-foreground border-border"
                }`}>
                  {isViewer && <Eye className="h-3 w-3" />}
                  {role.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link to="/incidents" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full font-mono text-xs justify-start">
                    <FileText className="h-3 w-3 mr-1.5" /> {t("nav.incidents")}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => { setShowRules(!showRules); setMobileMenuOpen(false); }} className="w-full font-mono text-xs justify-start">
                  <Settings2 className="h-3 w-3 mr-1.5" /> {t("nav.alertRules")}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <LanguageToggle />
                <CommandPalette onToggleTheme={toggleTheme} onToggleAlerts={() => setShowAlerts(!showAlerts)} onToggleRules={() => setShowRules(!showRules)} theme={theme} />
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => { generateLogs(); setMobileMenuOpen(false); }} disabled={generating} className="w-full font-mono text-xs justify-start">
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${generating ? "animate-spin" : ""}`} /> {t("btn.generateLogs")}
                  </Button>
                )}
                {isDemo && (
                  <Button variant="outline" size="sm" onClick={() => { resetDemo(); setMobileMenuOpen(false); }} disabled={resetting} className="w-full font-mono text-xs justify-start border-primary/30 text-primary hover:bg-primary/10">
                    <RotateCcw className={`h-3 w-3 mr-1.5 ${resetting ? "animate-spin" : ""}`} /> {t("btn.refreshDemo")}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="w-full font-mono text-xs text-muted-foreground justify-start">
                  <LogOut className="h-3 w-3 mr-1.5" /> {t("nav.signOut")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {showRules && (
          <AlertRulesPanel rules={rules} isAdmin={isAdmin} onAdd={addRule} onToggle={toggleRule} onDelete={deleteRule} onUpdate={updateRule} />
        )}
        {showAlerts && (
          <AlertPanel alerts={alerts} unacknowledgedCount={unacknowledgedCount} onAcknowledge={isAdmin ? acknowledgeAlert : undefined} onAcknowledgeAll={isAdmin ? acknowledgeAll : undefined} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title={t("status.cpu")} value={`${stats.cpu}%`} icon={Cpu} variant={getVariant(stats.cpu)} />
          <StatusCard title={t("status.memory")} value={`${stats.memory}%`} icon={MemoryStick} variant={getVariant(stats.memory)} />
          <StatusCard title={t("status.disk")} value={`${stats.disk}%`} icon={HardDrive} variant={getVariant(stats.disk)} />
          <StatusCard title={t("status.network")} value={`${stats.network} Mb/s`} icon={Wifi} variant="default" />
        </div>

        <AiInsightsPanel />

        <AnomalyDetectionPanel />

        <UptimeSLAPanel />

        <SystemCharts history={displayHistory} timeRange={timeRange} onTimeRangeChange={setTimeRange} isLoadingHistory={isLoadingHistory} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LiveActivityFeed />
          </div>
          <div>
            <ReportExport stats={stats} logs={logs} alerts={alerts} />
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-sm">
          <span className="text-muted-foreground">{logCounts.total} {t("logs.title")}</span>
          <span className="text-destructive">{logCounts.errors} {t("logs.errors")}</span>
          <span className="text-warning">{logCounts.warnings} {t("logs.warnings")}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            {t("logs.autoRefresh")}
          </div>
        </div>

        <LogFilters search={search} onSearchChange={setSearch} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} />

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <LogTable logs={logs} isLoading={logsLoading} />
        </div>
      </main>
    </div>
  );
}
