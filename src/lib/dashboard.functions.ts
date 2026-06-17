/**
 * Dashboard server functions — return UI-shaped data for the four feature pages.
 * Backed by Lovable Cloud (Supabase) tables; gracefully returns zero/empty
 * shapes when seed data is missing so the UI renders without crashing.
 */
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
  return (data ?? []) as any[];
}

const num = (v: any) => Number(v ?? 0);
const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

function aggDaily(rows: any[]) {
  const a = {
    netSales: 0, grossSales: 0, covers: 0, tablesServed: 0,
    discounts: 0, comps: 0, food: 0, beverage: 0, labor: 0, cogs: 0,
    noShows: 0, totalReservations: 0,
  };
  for (const r of rows) {
    a.netSales += num(r.net_sales);
    a.grossSales += num(r.gross_sales);
    a.covers += num(r.covers);
    a.tablesServed += num(r.tables_served);
    a.discounts += num(r.discounts);
    a.comps += num(r.comps);
    a.food += num(r.food_sales);
    a.beverage += num(r.beverage_sales);
    a.labor += num(r.labor_cost);
    a.cogs += num(r.food_cost) + num(r.beverage_cost);
    a.noShows += num(r.no_shows);
    a.totalReservations += num(r.total_reservations);
  }
  return a;
}

function trendSeries(rows: any[]) {
  const byDate: Record<string, { value: number; covers: number; labor: number; cogs: number }> = {};
  for (const r of rows) {
    const d = byDate[r.date] ||= { value: 0, covers: 0, labor: 0, cogs: 0 };
    d.value += num(r.net_sales);
    d.covers += num(r.covers);
    d.labor += num(r.labor_cost);
    d.cogs += num(r.food_cost) + num(r.beverage_cost);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5),
      value: Math.round(v.value),
      covers: v.covers,
      labor: Math.round(v.labor),
      cogs: Math.round(v.cogs),
    }));
}

// ============= THE FLOOR =============
export const getFloorData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [curr, prev, alertsResp] = await Promise.all([
      fetchDaily(supabase, data.from, data.to, data.center),
      fetchDaily(supabase, data.prevFrom, data.prevTo, data.center),
      supabase.from("alerts").select("*").eq("resolved", false)
        .order("occurred_at", { ascending: false }).limit(8),
    ]);
    const c = aggDaily(curr);
    const p = aggDaily(prev);

    const cPpa = c.covers ? c.netSales / c.covers : 0;
    const pPpa = p.covers ? p.netSales / p.covers : 0;
    const cAvg = c.tablesServed ? c.netSales / c.tablesServed : 0;
    const pAvg = p.tablesServed ? p.netSales / p.tablesServed : 0;
    const cDisc = c.grossSales ? ((c.discounts + c.comps) / c.grossSales) * 100 : 0;
    const pDisc = p.grossSales ? ((p.discounts + p.comps) / p.grossSales) * 100 : 0;

    const now = Date.now();
    const alerts = (alertsResp.data ?? []).map((a: any) => {
      const mins = Math.max(1, Math.floor((now - new Date(a.occurred_at).getTime()) / 60000));
      const time = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
      return { severity: a.severity as "danger" | "warning" | "info", message: a.message, time };
    });

    return {
      kpis: {
        netSales: c.netSales,
        netSalesDelta: pct(c.netSales, p.netSales),
        covers: c.covers,
        coversDelta: pct(c.covers, p.covers),
        ppa: cPpa,
        ppaDelta: pct(cPpa, pPpa),
        avgCheck: cAvg,
        avgCheckDelta: pct(cAvg, pAvg),
        discountPct: cDisc,
        discountPctDelta: cDisc - pDisc,
        noShowRate: c.totalReservations ? (c.noShows / c.totalReservations) * 100 : 0,
        trend: trendSeries(curr),
      },
      alerts,
    };
  });

// ============= THE OFFICE =============
export const getOfficeData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [curr, prev] = await Promise.all([
      fetchDaily(supabase, data.from, data.to, data.center),
      fetchDaily(supabase, data.prevFrom, data.prevTo, data.center),
    ]);
    const c = aggDaily(curr);
    const p = aggDaily(prev);

    const fixed = c.netSales * 0.18;
    const profit = c.netSales - c.labor - c.cogs - fixed;
    const prevFixed = p.netSales * 0.18;
    const prevProfit = p.netSales - p.labor - p.cogs - prevFixed;

    const laborPct = c.netSales ? (c.labor / c.netSales) * 100 : 0;
    const cogsPct = c.netSales ? (c.cogs / c.netSales) * 100 : 0;
    const margin = c.netSales ? (profit / c.netSales) * 100 : 0;

    return {
      netSales: c.netSales,
      netSalesDelta: pct(c.netSales, p.netSales),
      food: c.food,
      beverage: c.beverage,
      labor: c.labor,
      laborPct,
      cogs: c.cogs,
      cogsPct,
      fixed,
      profit,
      profitDelta: pct(profit, prevProfit),
      margin,
      series: trendSeries(curr),
      pnlRows: [
        { label: "Food Sales", value: c.food, pct: c.netSales ? (c.food / c.netSales) * 100 : 0 },
        { label: "Beverage Sales", value: c.beverage, pct: c.netSales ? (c.beverage / c.netSales) * 100 : 0 },
        { label: "Net Revenue", value: c.netSales, pct: 100, bold: true },
        { label: "Cost of Goods Sold", value: -c.cogs, pct: -cogsPct },
        { label: "Labor", value: -c.labor, pct: -laborPct },
        { label: "Fixed Costs", value: -fixed, pct: -18 },
        { label: "Operating Profit", value: profit, pct: margin, bold: true },
      ],
    };
  });

// ============= THE ARCHITECT =============
export const getArchitectData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const [itemsResp, salesResp] = await Promise.all([
      supabase.from("menu_items").select("*").eq("is_active", true),
      supabase.from("menu_item_daily_sales").select("*").gte("date", data.from).lte("date", data.to),
    ]);
    const items = (itemsResp.data ?? []) as any[];
    const sales = (salesResp.data ?? []) as any[];

    // Aggregate sales per menu_item_id within the period.
    const agg: Record<string, { sold: number; revenue: number; cost: number }> = {};
    for (const s of sales) {
      const a = agg[s.menu_item_id] ||= { sold: 0, revenue: 0, cost: 0 };
      a.sold += num(s.units_sold);
      a.revenue += num(s.revenue);
      a.cost += num(s.cost);
    }

    // Fallback to units_sold_30d when no period sales exist.
    const enriched = items.map((m: any) => {
      const a = agg[m.id];
      const sold = a?.sold ?? num(m.units_sold_30d);
      const price = num(m.price);
      const plate = num(m.plate_cost);
      const revenue = a?.revenue ?? sold * price;
      const margin = (price - plate) * sold;
      const marginPct = price ? ((price - plate) / price) * 100 : 0;
      return {
        name: m.name as string,
        category: m.category as string,
        price,
        cost: plate,
        sold,
        revenue,
        margin,
        marginPct,
        classification: "Dog" as "Star" | "Plowhorse" | "Puzzle" | "Dog",
      };
    });

    const median = (nums: number[]) => {
      if (!nums.length) return 0;
      const s = [...nums].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    const medianSold = median(enriched.map((i) => i.sold));
    const medianMargin = median(enriched.map((i) => i.margin));

    const classified = enriched.map((i) => {
      const popHigh = i.sold >= medianSold;
      const marHigh = i.margin >= medianMargin;
      const cls: "Star" | "Plowhorse" | "Puzzle" | "Dog" =
        popHigh && marHigh ? "Star" :
        popHigh ? "Plowhorse" :
        marHigh ? "Puzzle" : "Dog";
      return { ...i, classification: cls };
    }).sort((a, b) => b.margin - a.margin);

    const totalRevenue = classified.reduce((a, i) => a + i.revenue, 0);
    const totalMargin = classified.reduce((a, i) => a + i.margin, 0);
    const blendedPct = totalRevenue ? (totalMargin / totalRevenue) * 100 : 0;
    const stars = classified.filter((i) => i.classification === "Star").length;
    const dogs = classified.filter((i) => i.classification === "Dog").length;

    return {
      items: classified,
      totalRevenue,
      totalMargin,
      blendedPct,
      stars,
      dogs,
      medianSold,
      medianMargin,
    };
  });

// ============= THE PIPELINE =============
const STAGE_MAP: Record<string, "Inquiry" | "Proposal" | "Confirmed" | "Deposit Paid" | "Lost"> = {
  inquiry: "Inquiry",
  proposal: "Proposal",
  contract: "Confirmed",
  confirmed: "Confirmed",
  deposit: "Deposit Paid",
  won: "Deposit Paid",
  lost: "Lost",
};

export const getPipelineData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const span = Math.max(
      1,
      Math.round((new Date(data.to).getTime() - new Date(data.from).getTime()) / 86400000) + 1,
    );

    const { data: rows } = await supabase.from("events_pipeline").select("*");
    const events = (rows ?? []).map((e: any) => {
      const stage = STAGE_MAP[String(e.stage ?? "").toLowerCase()] ?? "Inquiry";
      const value = num(e.value);
      const guests = Math.max(2, Math.round(value / 120));
      return {
        id: e.id as string,
        client: (e.company || e.contact_name || "—") as string,
        type: "Private Dining" as string,
        date: (e.event_date ?? today.toISOString().slice(0, 10)) as string,
        guests,
        value,
        stage,
      };
    });

    const STAGES = ["Inquiry", "Proposal", "Confirmed", "Deposit Paid", "Lost"] as const;
    const byStage = STAGES.map((s) => ({
      stage: s,
      count: events.filter((e) => e.stage === s).length,
      value: events.filter((e) => e.stage === s).reduce((a, e) => a + e.value, 0),
    }));
    const maxStageValue = Math.max(...byStage.map((s) => s.value), 1);

    const horizonEnd = new Date(today);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + span);
    const inHorizon = events.filter((e) => {
      const d = new Date(e.date);
      return d >= today && d <= horizonEnd;
    });

    const totalPipeline = events.filter((e) => e.stage !== "Lost").reduce((a, e) => a + e.value, 0);
    const confirmedValue = events
      .filter((e) => e.stage === "Confirmed" || e.stage === "Deposit Paid")
      .reduce((a, e) => a + e.value, 0);
    const winRate = events.length
      ? (events.filter((e) => e.stage === "Deposit Paid").length / events.length) * 100
      : 0;
    const upcomingGuests = inHorizon.reduce((a, e) => a + e.guests, 0);
    const upcoming = events
      .filter((e) => e.stage !== "Lost")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
    const activeCount = events.filter((e) => e.stage !== "Lost").length;

    return {
      events, span, totalPipeline, confirmedValue, winRate, upcomingGuests,
      byStage, maxStageValue, upcoming, activeCount,
    };
  });

// ============= HEATMAP =============
export const getHeatmapData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string(), to: z.string(), center: z.string().default("all") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("hourly_metrics").select("*").gte("date", data.from).lte("date", data.to);
    if (data.center !== "all") q = q.eq("revenue_center", data.center);
    const { data: rows } = await q;

    const grid: Record<string, { covers: number; netSales: number }> = {};
    for (const r of rows ?? []) {
      const d = new Date(r.date + "T12:00:00Z");
      const day = d.getUTCDay();
      const key = `${day}-${r.hour}`;
      const g = grid[key] ||= { covers: 0, netSales: 0 };
      g.covers += num(r.covers);
      g.netSales += num(r.revenue);
    }
    const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
    const cells: { day: number; hour: number; covers: number; netSales: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (const hour of HOURS) {
        const g = grid[`${day}-${hour}`] ?? { covers: 0, netSales: 0 };
        cells.push({ day, hour, covers: g.covers, netSales: Math.round(g.netSales) });
      }
    }
    return cells;
  });
