import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sources = ["api-server", "auth-service", "database", "worker"];

const messages: Record<string, string[]> = {
  info: [
    "Health check passed successfully",
    "Connection pool refreshed",
    "Cache invalidated for user sessions",
    "Scheduled task completed in 234ms",
    "New deployment detected, warming up instances",
    "SSL certificate renewed successfully",
    "Backup completed: 2.4GB compressed",
    "Rate limiter reset for all endpoints",
    "Worker process spawned (PID: 4821)",
    "Metrics exported to monitoring service",
  ],
  warning: [
    "Response time exceeded 500ms threshold",
    "Memory usage above 80% on node-3",
    "Retry attempt 2/3 for upstream request",
    "Disk space below 20% on /var/logs",
    "Connection pool nearing capacity (85%)",
    "Deprecated API endpoint accessed: /v1/users",
    "TLS handshake timeout with peer",
    "Queue depth exceeding normal levels",
  ],
  error: [
    "Connection refused: database primary node",
    "Out of memory: killed process 2847",
    "SSL certificate verification failed",
    "Unhandled exception in request handler",
    "Timeout waiting for lock acquisition",
    "Failed to write to replica: network unreachable",
    "Authentication service returned 503",
    "Max retries exceeded for webhook delivery",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const logs = [];
    const count = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      const level = rand < 0.6 ? "info" : rand < 0.85 ? "warning" : "error";
      const levelMessages = messages[level];

      logs.push({
        level,
        source: sources[Math.floor(Math.random() * sources.length)],
        message: levelMessages[Math.floor(Math.random() * levelMessages.length)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      });
    }

    const { error } = await supabase.from("system_logs").insert(logs);

    if (error) throw error;

    return new Response(JSON.stringify({ generated: logs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
