
CREATE OR REPLACE FUNCTION public.apply_order_deltas(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date := (payload->>'date')::date;
  v_hour int := (payload->>'hour')::int;
  v_center text := payload->>'revenue_center';
  v_covers int := COALESCE((payload->>'party_size')::int, 0);
  v_tables int := CASE WHEN COALESCE(payload->>'table_no','') <> '' THEN 1 ELSE 0 END;
  v_gross numeric := COALESCE((payload->>'gross_sales')::numeric, 0);
  v_disc numeric := COALESCE((payload->>'discounts')::numeric, 0);
  v_comps numeric := COALESCE((payload->>'comps')::numeric, 0);
  v_net numeric := COALESCE((payload->>'net_sales')::numeric, 0);
  v_food_sales numeric := COALESCE((payload->>'food_sales')::numeric, 0);
  v_bev_sales numeric := COALESCE((payload->>'beverage_sales')::numeric, 0);
  v_liq_sales numeric := COALESCE((payload->>'liquor_sales')::numeric, 0);
  v_beer_sales numeric := COALESCE((payload->>'beer_sales')::numeric, 0);
  v_wine_sales numeric := COALESCE((payload->>'wine_sales')::numeric, 0);
  v_food_cost numeric := COALESCE((payload->>'food_cost')::numeric, 0);
  v_bev_cost numeric := COALESCE((payload->>'beverage_cost')::numeric, 0);
  v_guest uuid := NULLIF(payload->>'guest_id','')::uuid;
  v_actor uuid := NULLIF(payload->>'actor_id','')::uuid;
  v_void boolean := COALESCE((payload->>'void')::boolean, false);
  v_sign int := CASE WHEN v_void THEN -1 ELSE 1 END;
  v_order_id uuid := COALESCE(NULLIF(payload->>'order_id','')::uuid, gen_random_uuid());
  v_line jsonb;
BEGIN
  -- daily_metrics
  INSERT INTO public.daily_metrics(
    date, revenue_center, net_sales, gross_sales, covers, tables_served,
    discounts, comps, food_cost, beverage_cost, liquor_cost, beer_cost, wine_cost,
    food_sales, beverage_sales, liquor_sales, beer_sales, wine_sales,
    labor_cost, labor_hours, total_reservations, no_shows, available_seats, hours_open
  ) VALUES (
    v_date, v_center, v_sign*v_net, v_sign*v_gross, v_sign*v_covers, v_sign*v_tables,
    v_sign*v_disc, v_sign*v_comps, v_sign*v_food_cost, v_sign*v_bev_cost, 0, 0, 0,
    v_sign*v_food_sales, v_sign*v_bev_sales, v_sign*v_liq_sales, v_sign*v_beer_sales, v_sign*v_wine_sales,
    0, 0, 0, 0, 0, 0
  )
  ON CONFLICT (date, revenue_center) DO UPDATE SET
    net_sales = daily_metrics.net_sales + EXCLUDED.net_sales,
    gross_sales = daily_metrics.gross_sales + EXCLUDED.gross_sales,
    covers = daily_metrics.covers + EXCLUDED.covers,
    tables_served = daily_metrics.tables_served + EXCLUDED.tables_served,
    discounts = daily_metrics.discounts + EXCLUDED.discounts,
    comps = daily_metrics.comps + EXCLUDED.comps,
    food_cost = daily_metrics.food_cost + EXCLUDED.food_cost,
    beverage_cost = daily_metrics.beverage_cost + EXCLUDED.beverage_cost,
    food_sales = daily_metrics.food_sales + EXCLUDED.food_sales,
    beverage_sales = daily_metrics.beverage_sales + EXCLUDED.beverage_sales,
    liquor_sales = daily_metrics.liquor_sales + EXCLUDED.liquor_sales,
    beer_sales = daily_metrics.beer_sales + EXCLUDED.beer_sales,
    wine_sales = daily_metrics.wine_sales + EXCLUDED.wine_sales;

  -- hourly_metrics
  INSERT INTO public.hourly_metrics(date, hour, revenue_center, revenue, covers, available_seats)
  VALUES (v_date, v_hour, v_center, v_sign*v_net, v_sign*v_covers, 0)
  ON CONFLICT (date, hour, revenue_center) DO UPDATE SET
    revenue = hourly_metrics.revenue + EXCLUDED.revenue,
    covers = hourly_metrics.covers + EXCLUDED.covers;

  -- menu_item_daily_sales
  FOR v_line IN SELECT * FROM jsonb_array_elements(payload->'lines') LOOP
    INSERT INTO public.menu_item_daily_sales(menu_item_id, date, revenue_center, units_sold, revenue, cost)
    VALUES (
      (v_line->>'menu_item_id')::uuid, v_date, v_center,
      v_sign * COALESCE((v_line->>'units')::int, 0),
      v_sign * COALESCE((v_line->>'revenue')::numeric, 0),
      v_sign * COALESCE((v_line->>'cost')::numeric, 0)
    )
    ON CONFLICT (menu_item_id, date, revenue_center) DO UPDATE SET
      units_sold = menu_item_daily_sales.units_sold + EXCLUDED.units_sold,
      revenue = menu_item_daily_sales.revenue + EXCLUDED.revenue,
      cost = menu_item_daily_sales.cost + EXCLUDED.cost,
      updated_at = now();
  END LOOP;

  -- guests
  IF v_guest IS NOT NULL THEN
    UPDATE public.guests
    SET visit_count = GREATEST(0, visit_count + v_sign),
        lifetime_value = GREATEST(0, lifetime_value + v_sign*v_net),
        last_visit_at = CASE WHEN v_void THEN last_visit_at ELSE now() END,
        tier = CASE
          WHEN GREATEST(0, lifetime_value + v_sign*v_net) >= 2000 THEN 'vip'
          WHEN GREATEST(0, lifetime_value + v_sign*v_net) >= 500 THEN 'regular'
          ELSE 'new'
        END
    WHERE id = v_guest;
  END IF;

  -- audit_log
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, meta)
  VALUES (v_actor, CASE WHEN v_void THEN 'order.void' ELSE 'order.submit' END, 'service_order', v_order_id, payload);

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_order_deltas(jsonb) TO authenticated;
