import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const filterSchema = z.object({
  from: z.string(),
  to: z.string(),
  prevFrom: z.string(),
  prevTo: z.string(),
  center: z.string().default("all"),
});

type Filter = z.infer<typeof filterSchema>;

async function fetchDaily(supabase: any, from: string, to: string, center: string) {
  let q = supabase.from("daily_metrics").select("*").gte("date", from).lte("date", to);
  if (center !== "all") q = q.eq("revenue_center", center);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function sumRows(rows: any[]) {
  const s = {
    net_sales: 0, gross_sales: 0, covers: 0, tables_served: 0, discounts: 0, comps: 0,
    food_cost: 0, beverage_cost: 0, liquor_cost: 0, beer_cost: 0, wine_cost: 0,
    food_sales: 0, beverage_sales: 0, liquor_sales: 0, beer_sales: 0, wine_sales: 0,
    labor_cost: 0, labor_hours: 0, total_reservations: 0, no_shows: 0,
    available_seats: 0, hours_open: 0,
  };
  for (const r of rows) {
    for (const k of Object.keys(s) as (keyof typeof s)[]) {
      s[k] += Number(r[k] ?? 0);
    }
  }
  return s;
}

// ---------- THE FLOOR ----------
export const getFloorKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [curr, prev] = await Promise.all([
      fetchDaily(supabase, data.from, data.to, data.center),
      fetchDaily(supabase, data.prevFrom, data.prevTo, data.center),
    ]);
    const c = sumRows(curr);
    const p = sumRows(prev);

    // daily trend
    const dailyByDate: Record<string, number> = {};
    for (const r of curr) {
      dailyByDate[r.date] = (dailyByDate[r.date] || 0) + Number(r.net_sales);
    }
    const trend = Object.entries(dailyByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    // alerts
    const { data: alerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("resolved", false)
      .order("occurred_at", { ascending: false })
      .limit(10);

    return {
      current: {
        netSales: c.net_sales,
        covers: c.covers,
        ppa: c.covers ? c.net_sales / c.covers : 0,
        avgCheck: c.tables_served ? c.net_sales / c.tables_served : 0,
        tableTurns: c.tables_served && c.available_seats
          ? c.tables_served / (c.available_seats / 2)
          : 0,
        discountPct: c.gross_sales ? ((c.discounts + c.comps) / c.gross_sales) * 100 : 0,
      },
      previous: {
        netSales: p.net_sales,
        covers: p.covers,
        ppa: p.covers ? p.net_sales / p.covers : 0,
        avgCheck: p.tables_served ? p.net_sales / p.tables_served : 0,
        tableTurns: p.tables_served && p.available_seats
          ? p.tables_served / (p.available_seats / 2)
          : 0,
        discountPct: p.gross_sales ? ((p.discounts + p.comps) / p.gross_sales) * 100 : 0,
      },
      trend,
      alerts: alerts ?? [],
    };
  });

// ---------- THE OFFICE ----------
export const getOfficeKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [curr, prev] = await Promise.all([
      fetchDaily(supabase, data.from, data.to, data.center),
      fetchDaily(supabase, data.prevFrom, data.prevTo, data.center),
    ]);
    const c = sumRows(curr);
    const p = sumRows(prev);

    const calc = (s: typeof c) => {
      const totalCogs = s.food_cost + s.beverage_cost;
      return {
        primeCost: s.net_sales ? ((totalCogs + s.labor_cost) / s.net_sales) * 100 : 0,
        foodCostPct: s.food_sales ? (s.food_cost / s.food_sales) * 100 : 0,
        liquorPct: s.liquor_sales ? (s.liquor_cost / s.liquor_sales) * 100 : 0,
        beerPct: s.beer_sales ? (s.beer_cost / s.beer_sales) * 100 : 0,
        winePct: s.wine_sales ? (s.wine_cost / s.wine_sales) * 100 : 0,
        laborPct: s.gross_sales ? (s.labor_cost / s.gross_sales) * 100 : 0,
        splh: s.labor_hours ? s.net_sales / s.labor_hours : 0,
        cogs: totalCogs,
        labor: s.labor_cost,
        netSales: s.net_sales,
      };
    };

    // daily series for chart
    const byDate: Record<string, { sales: number; hours: number }> = {};
    for (const r of curr) {
      const d = byDate[r.date] ||= { sales: 0, hours: 0 };
      d.sales += Number(r.net_sales);
      d.hours += Number(r.labor_hours);
    }
    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        sales: Math.round(v.sales),
        laborHours: Math.round(v.hours),
        splh: v.hours ? Math.round((v.sales / v.hours) * 10) / 10 : 0,
      }));

    return { current: calc(c), previous: calc(p), series };
  });

// ---------- THE ARCHITECT ----------
export const getArchitectKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    let hQ = supabase
      .from("hourly_metrics")
      .select("*")
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.center !== "all" && data.center !== "dining_room") {
      // hourly is dining_room only; return empty if other center selected
      hQ = hQ.eq("revenue_center", data.center);
    }
    const { data: hourly } = await hQ;

    // build heatmap grid: dow (0..6) x hour (11..23)
    const grid: Record<string, { revenue: number; covers: number; seatHours: number; count: number }> = {};
    for (const r of hourly ?? []) {
      const d = new Date(r.date + "T12:00:00Z");
      const dow = d.getUTCDay();
      const key = `${dow}-${r.hour}`;
      const g = grid[key] ||= { revenue: 0, covers: 0, seatHours: 0, count: 0 };
      g.revenue += Number(r.revenue);
      g.covers += Number(r.covers);
      g.seatHours += Number(r.available_seats);
      g.count += 1;
    }
    const heatmap: { dow: number; hour: number; revpash: number; revenue: number; covers: number }[] = [];
    for (let dow = 0; dow < 7; dow++) {
      for (let h = 11; h <= 23; h++) {
        const g = grid[`${dow}-${h}`];
        if (!g) continue;
        const revpash = g.seatHours ? g.revenue / g.seatHours : 0;
        heatmap.push({ dow, hour: h, revpash: Math.round(revpash * 100) / 100, revenue: g.revenue, covers: g.covers });
      }
    }

    // overall seat occupancy + revpash avg
    const daily = await fetchDaily(supabase, data.from, data.to, data.center);
    const s = sumRows(daily);
    const seatHoursAvail = s.available_seats * s.hours_open;
    const seatOccupancy = seatHoursAvail ? (s.covers / seatHoursAvail) * 100 : 0;
    const revpashAvg = seatHoursAvail ? s.net_sales / seatHoursAvail : 0;
    const revpati = s.tables_served && s.hours_open
      ? s.net_sales / ((s.available_seats / 2) * s.hours_open)
      : 0;

    // menu engineering
    const { data: items } = await supabase.from("menu_items").select("*").eq("is_active", true);
    const enriched = (items ?? []).map((m: any) => {
      const margin = Number(m.price) - Number(m.plate_cost);
      const contribution = margin * m.units_sold_30d;
      const foodCostPct = Number(m.price) ? (Number(m.plate_cost) / Number(m.price)) * 100 : 0;
      return { ...m, margin, contribution, foodCostPct };
    });
    const sortedByPop = [...enriched].sort((a, b) => b.units_sold_30d - a.units_sold_30d);
    const sortedByMargin = [...enriched].sort((a, b) => b.margin - a.margin);
    const popMedian = sortedByPop[Math.floor(sortedByPop.length / 2)]?.units_sold_30d ?? 0;
    const marginMedian = sortedByMargin[Math.floor(sortedByMargin.length / 2)]?.margin ?? 0;
    const classified = enriched.map((m: any) => {
      const popHigh = m.units_sold_30d >= popMedian;
      const marginHigh = m.margin >= marginMedian;
      const quadrant = popHigh && marginHigh ? "star"
        : popHigh && !marginHigh ? "plowhorse"
        : !popHigh && marginHigh ? "puzzle"
        : "dog";
      return { ...m, quadrant };
    });

    const dogs = classified.filter((m: any) => m.quadrant === "dog")
      .sort((a: any, b: any) => a.contribution - b.contribution)
      .slice(0, 5);

    return {
      heatmap,
      seatOccupancy,
      revpashAvg,
      revpati,
      menu: classified,
      dogs,
      maxRevpash: heatmap.reduce((m, c) => Math.max(m, c.revpash), 0),
    };
  });

// ---------- THE PIPELINE ----------
export const getPipelineKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: events } = await supabase.from("events_pipeline").select("*");
    const stages = ["inquiry", "proposal", "contract", "deposit", "won", "lost"];
    const byStage: Record<string, { count: number; value: number }> = {};
    stages.forEach((s) => (byStage[s] = { count: 0, value: 0 }));
    for (const e of events ?? []) {
      const s = byStage[e.stage] ||= { count: 0, value: 0 };
      s.count += 1;
      s.value += Number(e.value);
    }
    const inquiryCount = byStage.inquiry.count + byStage.proposal.count + byStage.contract.count + byStage.deposit.count + byStage.won.count + byStage.lost.count;
    const wonCount = byStage.won.count;
    const conversionRate = inquiryCount ? (wonCount / inquiryCount) * 100 : 0;
    const pipelineValue = byStage.inquiry.value + byStage.proposal.value + byStage.contract.value + byStage.deposit.value;
    const wonValue = byStage.won.value;
    const eventAov = wonCount ? wonValue / wonCount : 0;

    const funnel = [
      { stage: "Inquiry", count: byStage.inquiry.count + byStage.proposal.count + byStage.contract.count + byStage.deposit.count + byStage.won.count + byStage.lost.count },
      { stage: "Proposal", count: byStage.proposal.count + byStage.contract.count + byStage.deposit.count + byStage.won.count },
      { stage: "Contract", count: byStage.contract.count + byStage.deposit.count + byStage.won.count },
      { stage: "Deposit", count: byStage.deposit.count + byStage.won.count },
      { stage: "Won", count: byStage.won.count },
    ];

    // VIPs at risk
    const { data: guests } = await supabase
      .from("guests")
      .select("*")
      .order("lifetime_value", { ascending: false });
    const now = Date.now();
    const guestsWithRisk = (guests ?? []).map((g: any) => {
      const daysSince = g.last_visit_at
        ? Math.floor((now - new Date(g.last_visit_at).getTime()) / 86400000)
        : 9999;
      let risk: "low" | "medium" | "high" = "low";
      if (daysSince > 60) risk = "high";
      else if (daysSince > 30) risk = "medium";
      return { ...g, daysSinceLastVisit: daysSince, risk };
    });
    const atRisk = guestsWithRisk.filter((g: any) => g.risk !== "low" && g.tier !== "occasional").slice(0, 10);
    const vipChurnRate = guestsWithRisk.filter((g: any) => g.tier === "vip").length
      ? (guestsWithRisk.filter((g: any) => g.tier === "vip" && g.daysSinceLastVisit > 90).length /
        guestsWithRisk.filter((g: any) => g.tier === "vip").length) * 100
      : 0;

    // Digital activity
    const { data: digital } = await supabase
      .from("digital_activity")
      .select("*")
      .gte("date", data.from)
      .lte("date", data.to)
      .order("date");
    const digitalSum = (digital ?? []).reduce(
      (a: any, d: any) => ({
        mau: Math.max(a.mau, d.mau),
        online_orders: a.online_orders + d.online_orders,
        cart_starts: a.cart_starts + d.cart_starts,
        cart_completed: a.cart_completed + d.cart_completed,
      }),
      { mau: 0, online_orders: 0, cart_starts: 0, cart_completed: 0 }
    );
    const cartAbandonRate = digitalSum.cart_starts
      ? ((digitalSum.cart_starts - digitalSum.cart_completed) / digitalSum.cart_starts) * 100
      : 0;

    // No-show rate
    const daily = await fetchDaily(supabase, data.from, data.to, data.center);
    const s = sumRows(daily);
    const noShowRate = s.total_reservations ? (s.no_shows / s.total_reservations) * 100 : 0;

    return {
      funnel,
      conversionRate,
      pipelineValue,
      eventAov,
      atRisk,
      vipChurnRate,
      digitalSeries: digital ?? [],
      digitalSum,
      cartAbandonRate,
      noShowRate,
    };
  });

// ---------- SEED CHECK ----------
export const hasSeedData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("daily_metrics")
      .select("*", { count: "exact", head: true });
    return { seeded: (count ?? 0) > 0, rows: count ?? 0 };
  });
