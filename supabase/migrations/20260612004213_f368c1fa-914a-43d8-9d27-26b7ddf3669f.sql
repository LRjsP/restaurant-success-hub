
-- Profiles: restrict SELECT
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- Guests: admin-only SELECT
DROP POLICY IF EXISTS "Authenticated users can view guests" ON public.guests;
CREATE POLICY "Admins view guests" ON public.guests
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Events pipeline: admin-only SELECT
DROP POLICY IF EXISTS "Authenticated users can view events_pipeline" ON public.events_pipeline;
CREATE POLICY "Admins view events_pipeline" ON public.events_pipeline
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles: explicit admin-only write policies (defense in depth)
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
