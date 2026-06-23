
-- Drop the overly permissive insert policy
DROP POLICY "Service can insert logs" ON public.system_logs;

-- Create a more restrictive insert policy - only authenticated admins or service role
CREATE POLICY "Admins can insert logs" ON public.system_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
