CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['alerts', 'daily_metrics', 'digital_activity', 'events_pipeline', 'guests', 'hourly_metrics', 'menu_items']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (private.has_role(auth.uid(), ''admin'')) WITH CHECK (private.has_role(auth.uid(), ''admin''))', 'Admins can manage ' || table_name, table_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);