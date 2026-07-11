import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseConfigured } from "@/lib/authMode";
import { getStoredAuthMode } from "@/lib/authContext";
import { generateMockMetricHistory } from "@/lib/mockData";
import type { StatsSnapshot } from "@/hooks/useSystemStats";

export type TimeRange = "live" | "1h" | "24h" | "7d";

const SNAPSHOT_INTERVAL_MS = 10000;

export function useMetricHistory(liveHistory: StatsSnapshot[], currentStats: { cpu: number; memory: number; disk: number; network: number }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("live");
  const [historicalData, setHistoricalData] = useState<StatsSnapshot[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const lastSnapshot = useRef(0);

  const isDemo = getStoredAuthMode() === "demo" || !isSupabaseConfigured();

  // Store snapshots (real mode only)
  useEffect(() => {
    if (isDemo) return;
    const now = Date.now();
    if (now - lastSnapshot.current < SNAPSHOT_INTERVAL_MS) return;
    lastSnapshot.current = now;

    import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.from("metric_snapshots").insert({ cpu: currentStats.cpu, memory: currentStats.memory, disk: currentStats.disk, network: currentStats.network })
    ).catch(() => {});
  }, [currentStats, isDemo]);

  const fetchHistory = useCallback(async (range: TimeRange) => {
    if (range === "live") { setHistoricalData([]); return; }

    setIsLoadingHistory(true);

    if (isDemo) {
      const count = range === "1h" ? 60 : range === "24h" ? 144 : 168;
      setHistoricalData(generateMockMetricHistory(count));
      setIsLoadingHistory(false);
      return;
    }

    try {
      const now = new Date();
      const since = range === "1h" ? new Date(now.getTime() - 3600000)
        : range === "24h" ? new Date(now.getTime() - 86400000)
        : new Date(now.getTime() - 604800000);

      const { data } = await supabase.from("metric_snapshots").select("*").gte("recorded_at", since.toISOString()).order("recorded_at", { ascending: true }).limit(500);

      if (data) {
        setHistoricalData(data.map((d: any) => {
          const dt = new Date(d.recorded_at);
          const timeStr = range === "7d" ? `${dt.getMonth() + 1}/${dt.getDate()}`
            : range === "24h" ? `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`
            : `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}:${dt.getSeconds().toString().padStart(2, "0")}`;
          return { cpu: Number(d.cpu), memory: Number(d.memory), disk: Number(d.disk), network: Number(d.network), time: timeStr };
        }));
      }
    } catch {
      setHistoricalData(generateMockMetricHistory(60));
    }
    setIsLoadingHistory(false);
  }, [isDemo]);

  useEffect(() => { fetchHistory(timeRange); }, [timeRange, fetchHistory]);

  const displayHistory = timeRange === "live" ? liveHistory : historicalData;

  return { timeRange, setTimeRange, displayHistory, isLoadingHistory };
}
