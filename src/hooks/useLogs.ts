import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured } from "@/lib/authMode";
import { getStoredAuthMode } from "@/lib/authContext";
import { generateMockLogs } from "@/lib/mockData";
import type { LogEntry } from "@/components/LogTable";

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const isDemo = getStoredAuthMode() === "demo" || !isSupabaseConfigured();

  const fetchLogs = useCallback(async () => {
    if (isDemo) {
      let mockLogs = generateMockLogs(80);
      if (levelFilter !== "all") mockLogs = mockLogs.filter((l) => l.level === levelFilter);
      if (sourceFilter !== "all") mockLogs = mockLogs.filter((l) => l.source === sourceFilter);
      if (search) {
        const q = search.toLowerCase();
        mockLogs = mockLogs.filter((l) => l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q));
      }
      setLogs(mockLogs);
      setIsLoading(false);
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      let query = supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (levelFilter !== "all") query = query.eq("level", levelFilter);
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (search) query = query.or(`message.ilike.%${search}%,source.ilike.%${search}%`);

      const { data, error } = await query;
      if (!error && data) setLogs(data as LogEntry[]);
    } catch {
      // Fallback to mock
      setLogs(generateMockLogs(80));
    }
    setIsLoading(false);
  }, [search, levelFilter, sourceFilter, isDemo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const interval = setInterval(fetchLogs, isDemo ? 8000 : 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, isDemo]);

  // Realtime only in real mode
  useEffect(() => {
    if (isDemo) return;

    let channel: any;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        channel = supabase
          .channel("system-logs-realtime")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_logs" }, (payload: any) => {
            const newLog = payload.new as LogEntry;
            if (levelFilter !== "all" && newLog.level !== levelFilter) return;
            if (sourceFilter !== "all" && newLog.source !== sourceFilter) return;
            if (search && !newLog.message.toLowerCase().includes(search.toLowerCase()) && !newLog.source.toLowerCase().includes(search.toLowerCase())) return;
            setLogs((prev) => [newLog, ...prev].slice(0, 200));
          })
          .subscribe();
      } catch {}
    })();

    return () => {
      if (channel) {
        import("@/integrations/supabase/client").then(({ supabase }) => supabase.removeChannel(channel)).catch(() => {});
      }
    };
  }, [levelFilter, search, sourceFilter, isDemo]);

  return { logs, isLoading, search, setSearch, levelFilter, setLevelFilter, sourceFilter, setSourceFilter };
}
