
-- Create severity enum
CREATE TYPE public.alert_severity AS ENUM ('warning', 'error', 'critical');

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity alert_severity NOT NULL,
  source TEXT NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Admin-only read
CREATE POLICY "Admins can view alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only update (acknowledge)
CREATE POLICY "Admins can update alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service insert (edge function uses service role)
CREATE POLICY "Admins can insert alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
