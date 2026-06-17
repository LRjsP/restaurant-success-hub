DROP POLICY IF EXISTS "Authenticated users can view guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can manage guests" ON public.guests;
CREATE POLICY "Admins view guests" ON public.guests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage guests" ON public.guests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can manage events_pipeline" ON public.events_pipeline;
CREATE POLICY "Admins manage events_pipeline" ON public.events_pipeline
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can resolve alerts" ON public.alerts;
CREATE POLICY "Admins resolve alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.apply_order_deltas(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_order_deltas(jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;