DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['alerts', 'daily_metrics', 'digital_activity', 'events_pipeline', 'guests', 'hourly_metrics', 'menu_items']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'auth all ' || table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Authenticated users can view ' || table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', 'Authenticated users can view ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', 'Admins can manage ' || table_name, table_name);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;