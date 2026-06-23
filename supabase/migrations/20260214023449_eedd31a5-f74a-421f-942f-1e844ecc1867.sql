
-- 1. Alert lifecycle: add acknowledged_by, acknowledged_at, resolved_at to alerts
ALTER TABLE public.alerts
  ADD COLUMN acknowledged_by uuid REFERENCES auth.users(id),
  ADD COLUMN acknowledged_at timestamp with time zone,
  ADD COLUMN resolved_at timestamp with time zone;

-- 2. Alert rules configuration table
CREATE TABLE public.alert_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric text NOT NULL,
  source text NOT NULL DEFAULT 'system-monitor',
  threshold numeric NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  severity alert_severity NOT NULL DEFAULT 'warning',
  message_template text NOT NULL,
  cooldown_seconds integer NOT NULL DEFAULT 30,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and viewers can view alert rules"
  ON public.alert_rules FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Admins can insert alert rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alert rules"
  ON public.alert_rules FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alert rules"
  ON public.alert_rules FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Metric snapshots for historical storage
CREATE TABLE public.metric_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpu numeric NOT NULL,
  memory numeric NOT NULL,
  disk numeric NOT NULL,
  network numeric NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.metric_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and viewers can view metric snapshots"
  ON public.metric_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Admins can insert metric snapshots"
  ON public.metric_snapshots FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for time-range queries
CREATE INDEX idx_metric_snapshots_recorded_at ON public.metric_snapshots (recorded_at DESC);

-- Seed default alert rules
INSERT INTO public.alert_rules (metric, source, threshold, duration_seconds, severity, message_template, cooldown_seconds, enabled)
VALUES
  ('cpu', 'system-monitor', 80, 0, 'warning', 'CPU usage critically high at {value}% (threshold: {threshold}%)', 30, true),
  ('memory', 'system-monitor', 90, 0, 'error', 'Memory usage at dangerous level: {value}% (threshold: {threshold}%)', 30, true),
  ('disk', 'system-monitor', 85, 0, 'critical', 'Disk almost full: {value}% used (threshold: {threshold}%)', 30, true);

-- Enable realtime for alert_rules
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_rules;
