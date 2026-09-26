import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    let user = null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }

    let logs: any[] | null = null;
    let alerts: any[] | null = null;
    let metrics: any[] | null = null;

    if (user) {
      ({ data: logs } = await supabase
        .from("system_logs")
        .select("level, source, message, created_at")
        .order("created_at", { ascending: false })
        .limit(200));
      ({ data: alerts } = await supabase
        .from("alerts")
        .select("severity, message, metric, value, threshold, source, created_at, resolved_at, acknowledged")
        .order("created_at", { ascending: false })
        .limit(50));
      ({ data: metrics } = await supabase
        .from("metric_snapshots")
        .select("cpu, memory, disk, network, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(30));
    } else if (body?.demo && Array.isArray(body.logs)) {
      // Demo mode: analyze client-provided sample data (capped)
      logs = body.logs.slice(0, 200);
      alerts = Array.isArray(body.alerts) ? body.alerts.slice(0, 50) : [];
      metrics = Array.isArray(body.metrics) ? body.metrics.slice(0, 30) : [];
    } else {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const logSummary = (logs || []).reduce(
      (acc: Record<string, Record<string, number>>, l: any) => {
        acc[l.source] = acc[l.source] || {};
        acc[l.source][l.level] = (acc[l.source][l.level] || 0) + 1;
        return acc;
      },
      {}
    );

    const systemPrompt = `You are a senior SRE / DevOps engineer analyzing a monitoring dashboard. Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "2-4 sentence plain-text summary of overall system health",
  "log_patterns": [
    { "pattern": "short description", "count": number, "severity": "info|warning|error", "source": "source name" }
  ],
  "anomalies": [
    { "metric": "metric name", "description": "what's unusual", "risk": "low|medium|high" }
  ],
  "root_causes": [
    { "issue": "short issue title", "probable_cause": "1-2 sentence explanation", "suggestion": "actionable recommendation" }
  ]
}
Rules:
- log_patterns: top 3-5 patterns from the logs
- anomalies: detect unusual spikes, trends, or correlations. Check if metrics are consistently high or rapidly changing. If everything looks normal, return empty array.
- root_causes: suggest 1-3 probable causes for any issues detected. If system is healthy, return empty array.
- Be concise and actionable. No markdown in values.`;

    const userPrompt = `Here is the current system data:

LOG DISTRIBUTION BY SOURCE:
${JSON.stringify(logSummary, null, 2)}

RECENT LOGS (latest 20):
${(logs || []).slice(0, 20).map((l: any) => `[${l.level}] ${l.source}: ${l.message}`).join("\n")}

RECENT ALERTS (latest 10):
${(alerts || []).slice(0, 10).map((a: any) => `[${a.severity}] ${a.metric} at ${a.value} (threshold: ${a.threshold}) - ${a.message}${a.resolved_at ? " [RESOLVED]" : ""}`).join("\n") || "No recent alerts"}

METRIC SNAPSHOTS (latest 10):
${(metrics || []).slice(0, 10).map((m: any) => `CPU:${m.cpu}% MEM:${m.memory}% DISK:${m.disk}% NET:${m.network}Mb/s @ ${m.recorded_at}`).join("\n") || "No metrics available"}

Analyze this data and respond with the JSON schema specified.`;

    // Try Groq models in order; skip ones that are retired/unavailable (404/400 model errors)
    const MODELS = [
      Deno.env.get("GROQ_MODEL"),
      "openai/gpt-oss-120b",
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-20b",
      "llama-3.1-8b-instant",
    ].filter(Boolean) as string[];

    let aiResponse: Response | null = null;
    let lastErr = "";
    for (const model of MODELS) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) { aiResponse = res; break; }
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 401 || res.status === 403) {
        return new Response(JSON.stringify({ error: "Groq API key is invalid or lacks access." }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lastErr = await res.text();
      console.error("AI error:", model, res.status, lastErr);
    }

    if (!aiResponse) throw new Error("AI provider error — no available Groq model");

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code fences)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: content,
        log_patterns: [],
        anomalies: [],
        root_causes: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
