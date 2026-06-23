
-- Update handle_new_user to assign 'user' role by default instead of 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Allow viewers to read logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.system_logs;
CREATE POLICY "Admins and viewers can view logs"
ON public.system_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'viewer'));

-- Allow viewers to read alerts
DROP POLICY IF EXISTS "Admins can view alerts" ON public.alerts;
CREATE POLICY "Admins and viewers can view alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'viewer'));
