
-- 1) NEW TABLES

CREATE TABLE public.menu_item_daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  date date NOT NULL,
  revenue_center text NOT NULL DEFAULT 'dining_room',
  units_sold int NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, date, revenue_center)
);
CREATE INDEX idx_mids_date ON public.menu_item_daily_sales(date);
CREATE INDEX idx_mids_item ON public.menu_item_daily_sales(menu_item_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_item_daily_sales TO authenticated;
GRANT ALL ON public.menu_item_daily_sales TO service_role;
ALTER TABLE public.menu_item_daily_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view menu_item_daily_sales"
  ON public.menu_item_daily_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage menu_item_daily_sales"
  ON public.menu_item_daily_sales FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER set_updated_at_mids
  BEFORE UPDATE ON public.menu_item_daily_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  seats_total int NOT NULL DEFAULT 150,
  service_hours_per_day numeric NOT NULL DEFAULT 11,
  revenue_centers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view restaurant_settings"
  ON public.restaurant_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage restaurant_settings"
  ON public.restaurant_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER set_updated_at_rs
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created_at ON public.audit_log(created_at DESC);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));


-- 2) NEW COLUMNS

ALTER TABLE public.events_pipeline
  ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_guest ON public.events_pipeline(guest_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;


-- 3) RLS ADJUSTMENTS

-- events_pipeline: any authenticated can read AND write (CRM table)
DROP POLICY IF EXISTS "Admins view events_pipeline" ON public.events_pipeline;
DROP POLICY IF EXISTS "Admins can manage events_pipeline" ON public.events_pipeline;
CREATE POLICY "Authenticated users can view events_pipeline"
  ON public.events_pipeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage events_pipeline"
  ON public.events_pipeline FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- guests: any authenticated can read AND write
DROP POLICY IF EXISTS "Admins view guests" ON public.guests;
DROP POLICY IF EXISTS "Admins can manage guests" ON public.guests;
CREATE POLICY "Authenticated users can view guests"
  ON public.guests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage guests"
  ON public.guests FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- alerts: any authenticated can UPDATE (resolve); INSERT/DELETE admin-only
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;
CREATE POLICY "Admins insert alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete alerts"
  ON public.alerts FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Authenticated users can resolve alerts"
  ON public.alerts FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- daily_metrics, hourly_metrics, digital_activity, menu_items: ensure admin-only writes via private.has_role
DROP POLICY IF EXISTS "Admins can manage daily_metrics" ON public.daily_metrics;
CREATE POLICY "Admins can manage daily_metrics"
  ON public.daily_metrics FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage hourly_metrics" ON public.hourly_metrics;
CREATE POLICY "Admins can manage hourly_metrics"
  ON public.hourly_metrics FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage digital_activity" ON public.digital_activity;
CREATE POLICY "Admins can manage digital_activity"
  ON public.digital_activity FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage menu_items" ON public.menu_items;
CREATE POLICY "Admins can manage menu_items"
  ON public.menu_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));


-- 4) SEED restaurant_settings (mirrors CENTER_MIX in src/lib/demo-data.ts)
INSERT INTO public.restaurant_settings (name, seats_total, service_hours_per_day, revenue_centers)
SELECT
  'MISE.OPS Demo Restaurant',
  150,
  11,
  '[
    {"value":"dining_room","label":"Main Dining Room","share":0.45,"ppa_mul":1.15,"seats":80},
    {"value":"bar","label":"Bar","share":0.18,"ppa_mul":0.7,"seats":30},
    {"value":"patio","label":"Patio","share":0.12,"ppa_mul":1.0,"seats":40},
    {"value":"takeout","label":"Takeout","share":0.1,"ppa_mul":0.8,"seats":0},
    {"value":"delivery","label":"Delivery","share":0.1,"ppa_mul":0.85,"seats":0},
    {"value":"catering","label":"Catering","share":0.05,"ppa_mul":1.4,"seats":0}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.restaurant_settings);
