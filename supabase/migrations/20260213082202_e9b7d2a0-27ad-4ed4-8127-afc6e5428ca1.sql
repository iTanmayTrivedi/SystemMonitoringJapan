
-- Update handle_new_user to read desired role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  desired_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Read role from user metadata, default to 'user'
  desired_role := COALESCE(
    (NEW.raw_user_meta_data->>'desired_role')::app_role,
    'user'::app_role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, desired_role);

  RETURN NEW;
END;
$$;
