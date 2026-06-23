import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_EMAIL = "demo-admin@sysmonitor.app";
const DEMO_PASSWORD = "demo-admin-2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || "login"; // "login" | "reset"

    // Check if demo user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let demoUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    if (!demoUser) {
      // Create demo user with admin role
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { desired_role: "admin" },
      });
      if (createError) throw createError;
      demoUser = created.user;
    }

    if (action === "reset" && demoUser) {
      // Clear demo data: delete logs, alerts, metric_snapshots
      await supabaseAdmin.from("system_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("metric_snapshots").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Generate fresh sample logs
      const sources = ["api-gateway", "auth-service", "database", "scheduler", "worker-pool", "cache-layer", "load-balancer", "cdn-edge"];
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
        ],
        warning: [
          "Response time exceeded 500ms threshold",
          "Memory usage above 80% on node-3",
          "Retry attempt 2/3 for upstream request",
          "Disk space below 20% on /var/logs",
          "Connection pool nearing capacity (85%)",
        ],
        error: [
          "Connection refused: database primary node",
          "Out of memory: killed process 2847",
          "SSL certificate verification failed",
          "Unhandled exception in request handler",
          "Timeout waiting for lock acquisition",
        ],
      };

      const logs = [];
      for (let i = 0; i < 30; i++) {
        const rand = Math.random();
        const level = rand < 0.55 ? "info" : rand < 0.82 ? "warning" : "error";
        const levelMessages = messages[level];
        logs.push({
          level,
          source: sources[Math.floor(Math.random() * sources.length)],
          message: levelMessages[Math.floor(Math.random() * levelMessages.length)],
          created_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
        });
      }
      await supabaseAdmin.from("system_logs").insert(logs);

      // Generate sample metric snapshots (last 2 hours)
      const snapshots = [];
      for (let i = 0; i < 120; i++) {
        snapshots.push({
          cpu: Math.round(30 + Math.random() * 50),
          memory: Math.round(50 + Math.random() * 35),
          disk: Math.round(40 + Math.random() * 30),
          network: Math.round(10 + Math.random() * 40),
          recorded_at: new Date(Date.now() - i * 60000).toISOString(),
        });
      }
      await supabaseAdmin.from("metric_snapshots").insert(snapshots);

      // Generate a few sample alerts
      const alertSamples = [
        { severity: "warning", source: "system-monitor", metric: "cpu", value: 87, threshold: 80, message: "CPU usage critically high at 87% (threshold: 80%)" },
        { severity: "error", source: "system-monitor", metric: "memory", value: 93, threshold: 90, message: "Memory usage at dangerous level: 93% (threshold: 90%)" },
        { severity: "critical", source: "system-monitor", metric: "disk", value: 91, threshold: 85, message: "Disk almost full: 91% used (threshold: 85%)", resolved_at: new Date(Date.now() - 300000).toISOString() },
      ];
      await supabaseAdmin.from("alerts").insert(alertSamples);
    }

    // Return credentials for client-side sign-in
    return new Response(
      JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        action,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
