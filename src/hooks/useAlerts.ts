import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured } from "@/lib/authMode";
import { getStoredAuthMode } from "@/lib/authContext";
import { generateMockAlerts, generateMockAlertRules } from "@/lib/mockData";
import { toast } from "sonner";

export interface Alert {
  id: string;
  severity: "warning" | "error" | "critical";
  source: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AlertRule {
  id: string;
  metric: string;
  source: string;
  threshold: number;
  duration_seconds: number;
  severity: "warning" | "error" | "critical";
  message_template: string;
  cooldown_seconds: number;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const lastFiredMap: Record<string, number> = {};

export function useAlerts(stats: { cpu: number; memory: number; disk: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isDemo = getStoredAuthMode() === "demo" || !isSupabaseConfigured();

  // ─── Fetch ───
  const fetchAlerts = useCallback(async () => {
    if (isDemo) {
      const mock = generateMockAlerts(12);
      setAlerts(mock);
      setUnacknowledgedCount(mock.filter((a) => !a.acknowledged).length);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(100);
      if (!error && data) {
        const alertData = data.length > 0 ? (data as Alert[]) : generateMockAlerts(12);
        setAlerts(alertData);
        setUnacknowledgedCount(alertData.filter((a) => !a.acknowledged).length);
      } else {
        const fallback = generateMockAlerts(12);
        setAlerts(fallback);
        setUnacknowledgedCount(fallback.filter((a) => !a.acknowledged).length);
      }
    } catch {
      const fallback = generateMockAlerts(12);
      setAlerts(fallback);
      setUnacknowledgedCount(fallback.filter((a) => !a.acknowledged).length);
    }
    setIsLoading(false);
  }, [isDemo]);

  const fetchRules = useCallback(async () => {
    if (isDemo) {
      setRules(generateMockAlertRules());
      return;
    }

    try {
      const { data, error } = await supabase.from("alert_rules").select("*").order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        setRules(data as AlertRule[]);
      } else {
        setRules(generateMockAlertRules());
      }
    } catch {
      setRules(generateMockAlertRules());
    }
  }, [isDemo]);

  useEffect(() => { fetchAlerts(); fetchRules(); }, [fetchAlerts, fetchRules]);

  // Realtime (real mode only)
  useEffect(() => {
    if (isDemo) return;

    let alertCh: any, rulesCh: any;
    (async () => {
      try {
        alertCh = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => fetchAlerts()).subscribe();
        rulesCh = supabase.channel("rules-rt").on("postgres_changes", { event: "*", schema: "public", table: "alert_rules" }, () => fetchRules()).subscribe();
      } catch {}
    })();

    return () => {
      if (alertCh || rulesCh) {
        import("@/integrations/supabase/client").then(({ supabase }) => {
          if (alertCh) supabase.removeChannel(alertCh);
          if (rulesCh) supabase.removeChannel(rulesCh);
        }).catch(() => {});
      }
    };
  }, [fetchAlerts, fetchRules, isDemo]);

  // Rule evaluation against live stats
  useEffect(() => {
    const statsMap: Record<string, number> = { cpu: stats.cpu, memory: stats.memory, disk: stats.disk };
    const enabledRules = rules.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      const value = statsMap[rule.metric];
      if (value === undefined) continue;

      const now = Date.now();
      const cooldownMs = (rule.cooldown_seconds || 30) * 1000;
      const lastTime = lastFiredMap[rule.metric] || 0;

      if (value >= rule.threshold && now - lastTime > cooldownMs) {
        lastFiredMap[rule.metric] = now;
        const message = rule.message_template.replace("{value}", String(value)).replace("{threshold}", String(rule.threshold));
        const emoji = rule.severity === "critical" ? "🔴" : rule.severity === "error" ? "🟠" : "🟡";
        toast.warning(`${emoji} ${message}`, { duration: 6000 });

        if (isDemo) {
          const newAlert: Alert = {
            id: `mock-fired-${Date.now()}`,
            severity: rule.severity,
            source: rule.source,
            metric: rule.metric,
            value, threshold: rule.threshold, message,
            acknowledged: false, acknowledged_by: null, acknowledged_at: null, resolved_at: null,
            created_at: new Date().toISOString(),
          };
          setAlerts((prev) => [newAlert, ...prev]);
          setUnacknowledgedCount((c) => c + 1);
        } else {
          import("@/integrations/supabase/client").then(({ supabase }) =>
            supabase.from("alerts").insert({ severity: rule.severity, source: rule.source, metric: rule.metric, value, threshold: rule.threshold, message })
          ).catch(() => {});
        }
      }
    }
  }, [stats, rules, isDemo]);

  // ─── Actions ───
  const acknowledgeAlert = async (id: string) => {
    if (isDemo) {
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a));
      setUnacknowledgedCount((c) => Math.max(0, c - 1));
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("alerts").update({ acknowledged: true, acknowledged_by: user?.id || null, acknowledged_at: new Date().toISOString() }).eq("id", id);
      fetchAlerts();
    } catch {}
  };

  const acknowledgeAll = async () => {
    if (isDemo) {
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true, acknowledged_at: new Date().toISOString() })));
      setUnacknowledgedCount(0);
      toast.success("All alerts acknowledged");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("alerts").update({ acknowledged: true, acknowledged_by: user?.id || null, acknowledged_at: new Date().toISOString() }).eq("acknowledged", false);
      fetchAlerts();
      toast.success("All alerts acknowledged");
    } catch {}
  };

  const addRule = async (rule: Omit<AlertRule, "id" | "created_by" | "created_at" | "updated_at">) => {
    if (isDemo) {
      const newRule: AlertRule = { ...rule, id: `mock-rule-${Date.now()}`, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setRules((prev) => [...prev, newRule]);
      toast.success("Alert rule added");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("alert_rules").insert({ ...rule, created_by: user?.id || null });
      if (error) toast.error("Failed to add rule"); else toast.success("Alert rule added");
    } catch {}
  };

  const updateRule = async (id: string, updates: Partial<AlertRule>) => {
    if (isDemo) {
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
      return;
    }
    try {
      const { error } = await supabase.from("alert_rules").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) toast.error("Failed to update rule");
    } catch {}
  };

  const deleteRule = async (id: string) => {
    if (isDemo) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success("Alert rule deleted");
      return;
    }
    try {
      const { error } = await supabase.from("alert_rules").delete().eq("id", id);
      if (error) toast.error("Failed to delete rule"); else toast.success("Alert rule deleted");
    } catch {}
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await updateRule(id, { enabled });
  };

  return { alerts, rules, unacknowledgedCount, isLoading, acknowledgeAlert, acknowledgeAll, addRule, updateRule, deleteRule, toggleRule };
}
