
-- Daily aggregated metrics per revenue center
CREATE TABLE public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  revenue_center TEXT NOT NULL DEFAULT 'dining_room',
  net_sales NUMERIC NOT NULL DEFAULT 0,
  gross_sales NUMERIC NOT NULL DEFAULT 0,
  covers INTEGER NOT NULL DEFAULT 0,
  tables_served INTEGER NOT NULL DEFAULT 0,
  discounts NUMERIC NOT NULL DEFAULT 0,
  comps NUMERIC NOT NULL DEFAULT 0,
  food_cost NUMERIC NOT NULL DEFAULT 0,
  beverage_cost NUMERIC NOT NULL DEFAULT 0,
  liquor_cost NUMERIC NOT NULL DEFAULT 0,
  beer_cost NUMERIC NOT NULL DEFAULT 0,
  wine_cost NUMERIC NOT NULL DEFAULT 0,
  food_sales NUMERIC NOT NULL DEFAULT 0,
  beverage_sales NUMERIC NOT NULL DEFAULT 0,
  liquor_sales NUMERIC NOT NULL DEFAULT 0,
  beer_sales NUMERIC NOT NULL DEFAULT 0,
  wine_sales NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  labor_hours NUMERIC NOT NULL DEFAULT 0,
  total_reservations INTEGER NOT NULL DEFAULT 0,
  no_shows INTEGER NOT NULL DEFAULT 0,
  available_seats INTEGER NOT NULL DEFAULT 80,
  hours_open NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, revenue_center)
);

-- Hourly revenue/cover snapshots for RevPASH heatmap
CREATE TABLE public.hourly_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  revenue_center TEXT NOT NULL DEFAULT 'dining_room',
  revenue NUMERIC NOT NULL DEFAULT 0,
  covers INTEGER NOT NULL DEFAULT 0,
  available_seats INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, hour, revenue_center)
);

CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  plate_cost NUMERIC NOT NULL,
  units_sold_30d INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  lifetime_value NUMERIC NOT NULL DEFAULT 0,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  tier TEXT NOT NULL DEFAULT 'regular',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.events_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  company TEXT,
  stage TEXT NOT NULL DEFAULT 'inquiry',
  value NUMERIC NOT NULL DEFAULT 0,
  event_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.digital_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mau INTEGER NOT NULL DEFAULT 0,
  online_orders INTEGER NOT NULL DEFAULT 0,
  cart_starts INTEGER NOT NULL DEFAULT 0,
  cart_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hourly_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_pipeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.daily_metrics, public.hourly_metrics, public.menu_items, public.guests, public.events_pipeline, public.digital_activity, public.alerts TO service_role;

-- RLS — single-owner dashboard: any authenticated user has full access
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all daily_metrics" ON public.daily_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all hourly_metrics" ON public.hourly_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all menu_items" ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all guests" ON public.guests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all events_pipeline" ON public.events_pipeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all digital_activity" ON public.digital_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all alerts" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX daily_metrics_date_idx ON public.daily_metrics (date DESC);
CREATE INDEX hourly_metrics_date_idx ON public.hourly_metrics (date DESC, hour);
CREATE INDEX guests_last_visit_idx ON public.guests (last_visit_at DESC NULLS LAST);
CREATE INDEX events_pipeline_stage_idx ON public.events_pipeline (stage);
CREATE INDEX digital_activity_date_idx ON public.digital_activity (date DESC);
