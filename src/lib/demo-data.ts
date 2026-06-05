// Deterministic client-side demo data — driven by date range + revenue center.

import { DATE_PRESETS, type DatePreset } from "@/lib/format";

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function dayOfWeekFactor(dow: number) {
  // Sun, Mon..Sat
  const map = [1.05, 0.55, 0.65, 0.7, 0.85, 1.25, 1.4];
  return map[dow];
}

// Revenue center weights (share of total + PPA modifier)
const CENTER_MIX: Record<string, { share: number; ppaMul: number; seats: number }> = {
  all: { share: 1, ppaMul: 1, seats: 150 },
  dining_room: { share: 0.45, ppaMul: 1.15, seats: 80 },
  bar: { share: 0.18, ppaMul: 0.7, seats: 30 },
  patio: { share: 0.12, ppaMul: 1.0, seats: 40 },
  takeout: { share: 0.1, ppaMul: 0.8, seats: 0 },
  delivery: { share: 0.1, ppaMul: 0.85, seats: 0 },
  catering: { share: 0.05, ppaMul: 1.4, seats: 0 },
};

export function daysForPreset(p: DatePreset) {
  return DATE_PRESETS.find((d) => d.value === p)?.days ?? 7;
}

export interface DemoDay {
  date: string;
  netSales: number;
  covers: number;
  tablesServed: number;
  discounts: number;
  comps: number;
  grossSales: number;
  food: number;
  beverage: number;
  labor: number;
  cogs: number;
  availableSeats: number;
  hoursOpen: number;
  noShows: number;
  totalReservations: number;
}

export function generateDemoDays(days: number, center = "all", offset = 0): DemoDay[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const mix = CENTER_MIX[center] ?? CENTER_MIX.all;
  const results: DemoDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i - offset);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const df = dayOfWeekFactor(dow);
    const r = rng(iso + center);

    const baseCovers = Math.max(8, Math.round(180 * mix.share * df * (0.85 + r() * 0.3)));
    const ppa = (38 + r() * 22) * mix.ppaMul;
    const netSales = baseCovers * ppa;
    const grossSales = netSales * (1 + 0.02 + r() * 0.04);
    const discounts = grossSales * (0.01 + r() * 0.03);
    const comps = grossSales * (0.005 + r() * 0.015);
    const tablesServed = Math.round(baseCovers / (2.2 + r() * 0.6));
    const reservations = Math.round(baseCovers * (0.7 + r() * 0.2));
    const noShows = Math.round(reservations * (0.04 + r() * 0.06));
    const beverageShare = 0.22 + r() * 0.1;
    const beverage = netSales * beverageShare;
    const food = netSales - beverage;
    const labor = netSales * (0.27 + r() * 0.05);
    const cogs = netSales * (0.3 + r() * 0.04);

    results.push({
      date: iso,
      netSales: Math.round(netSales),
      covers: baseCovers,
      tablesServed,
      discounts: Math.round(discounts),
      comps: Math.round(comps),
      grossSales: Math.round(grossSales),
      food: Math.round(food),
      beverage: Math.round(beverage),
      labor: Math.round(labor),
      cogs: Math.round(cogs),
      availableSeats: Math.max(40, mix.seats + 20),
      hoursOpen: 11,
      noShows,
      totalReservations: reservations,
    });
  }
  return results;
}

// Compress N days into ~24 buckets for charts on long ranges
export function compressTrend(days: DemoDay[], maxPoints = 30) {
  if (days.length <= maxPoints) {
    return days.map((d) => ({ date: d.date.slice(5), value: d.netSales, covers: d.covers }));
  }
  const bucketSize = Math.ceil(days.length / maxPoints);
  const buckets: { date: string; value: number; covers: number }[] = [];
  for (let i = 0; i < days.length; i += bucketSize) {
    const slice = days.slice(i, i + bucketSize);
    const value = slice.reduce((a, d) => a + d.netSales, 0);
    const covers = slice.reduce((a, d) => a + d.covers, 0);
    buckets.push({ date: slice[0].date.slice(5), value, covers });
  }
  return buckets;
}

export function computeFloorKpis(days: DemoDay[], prev: DemoDay[]) {
  const sum = (arr: DemoDay[], k: keyof DemoDay) =>
    arr.reduce((a, d) => a + (d[k] as number), 0);

  const netSales = sum(days, "netSales");
  const prevNetSales = sum(prev, "netSales");
  const covers = sum(days, "covers");
  const prevCovers = sum(prev, "covers");
  const tablesServed = sum(days, "tablesServed");
  const prevTablesServed = sum(prev, "tablesServed");
  const grossSales = sum(days, "grossSales");
  const prevGrossSales = sum(prev, "grossSales");
  const totalReservations = sum(days, "totalReservations");
  const noShows = sum(days, "noShows");

  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

  return {
    netSales,
    netSalesDelta: pct(netSales, prevNetSales),
    covers,
    coversDelta: pct(covers, prevCovers),
    ppa: covers ? netSales / covers : 0,
    ppaDelta: pct(covers ? netSales / covers : 0, prevCovers ? prevNetSales / prevCovers : 0),
    avgCheck: tablesServed ? netSales / tablesServed : 0,
    avgCheckDelta: pct(
      tablesServed ? netSales / tablesServed : 0,
      prevTablesServed ? prevNetSales / prevTablesServed : 0,
    ),
    discountPct: grossSales ? ((sum(days, "discounts") + sum(days, "comps")) / grossSales) * 100 : 0,
    discountPctDelta: pct(
      grossSales ? (sum(days, "discounts") + sum(days, "comps")) / grossSales : 0,
      prevGrossSales ? (sum(prev, "discounts") + sum(prev, "comps")) / prevGrossSales : 0,
    ),
    noShowRate: totalReservations ? (noShows / totalReservations) * 100 : 0,
    trend: compressTrend(days),
  };
}

// ---------- The Office: P&L ----------
export function computeOfficePnl(days: DemoDay[], prev: DemoDay[]) {
  const sum = (arr: DemoDay[], k: keyof DemoDay) =>
    arr.reduce((a, d) => a + (d[k] as number), 0);
  const netSales = sum(days, "netSales");
  const prevNet = sum(prev, "netSales");
  const food = sum(days, "food");
  const beverage = sum(days, "beverage");
  const labor = sum(days, "labor");
  const cogs = sum(days, "cogs");
  const fixed = netSales * 0.18; // rent + utilities + insurance approx
  const profit = netSales - labor - cogs - fixed;
  const prevProfit =
    prevNet - sum(prev, "labor") - sum(prev, "cogs") - prevNet * 0.18;

  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

  return {
    netSales,
    food,
    beverage,
    labor,
    laborPct: netSales ? (labor / netSales) * 100 : 0,
    cogs,
    cogsPct: netSales ? (cogs / netSales) * 100 : 0,
    fixed,
    profit,
    profitDelta: pct(profit, prevProfit),
    margin: netSales ? (profit / netSales) * 100 : 0,
    netSalesDelta: pct(netSales, prevNet),
    series: compressTrend(days).map((b, i) => ({
      ...b,
      labor: Math.round(days[i]?.labor ?? b.value * 0.28),
      cogs: Math.round(days[i]?.cogs ?? b.value * 0.31),
    })),
    pnlRows: [
      { label: "Food Sales", value: food, pct: netSales ? (food / netSales) * 100 : 0 },
      { label: "Beverage Sales", value: beverage, pct: netSales ? (beverage / netSales) * 100 : 0 },
      { label: "Net Revenue", value: netSales, pct: 100, bold: true },
      { label: "Cost of Goods Sold", value: -cogs, pct: -(netSales ? (cogs / netSales) * 100 : 0) },
      { label: "Labor", value: -labor, pct: -(netSales ? (labor / netSales) * 100 : 0) },
      { label: "Fixed Costs", value: -fixed, pct: -18 },
      { label: "Operating Profit", value: profit, pct: netSales ? (profit / netSales) * 100 : 0, bold: true },
    ],
  };
}

// ---------- The Architect: Menu items ----------
export interface MenuItem {
  name: string;
  category: "Apps" | "Mains" | "Desserts" | "Drinks";
  price: number;
  cost: number;
  sold: number;
  revenue: number;
  margin: number;
  marginPct: number;
  classification: "Star" | "Plowhorse" | "Puzzle" | "Dog";
}

const MENU_SEED: { name: string; category: MenuItem["category"]; price: number; cost: number; popularity: number }[] = [
  { name: "Heirloom Tomato Burrata", category: "Apps", price: 18, cost: 5.2, popularity: 0.9 },
  { name: "Tuna Tartare", category: "Apps", price: 21, cost: 7.8, popularity: 0.7 },
  { name: "Charred Octopus", category: "Apps", price: 24, cost: 9.5, popularity: 0.45 },
  { name: "Roasted Beet Salad", category: "Apps", price: 16, cost: 3.4, popularity: 0.55 },
  { name: "Dry-Aged Ribeye 16oz", category: "Mains", price: 68, cost: 26, popularity: 0.85 },
  { name: "Pan-Seared Halibut", category: "Mains", price: 42, cost: 14, popularity: 0.6 },
  { name: "Bucatini Cacio e Pepe", category: "Mains", price: 28, cost: 5.5, popularity: 0.95 },
  { name: "Roasted Chicken for Two", category: "Mains", price: 52, cost: 11, popularity: 0.5 },
  { name: "Wagyu Burger", category: "Mains", price: 26, cost: 8, popularity: 0.88 },
  { name: "Wild Mushroom Risotto", category: "Mains", price: 32, cost: 7, popularity: 0.65 },
  { name: "Chocolate Tart", category: "Desserts", price: 14, cost: 2.8, popularity: 0.7 },
  { name: "Olive Oil Cake", category: "Desserts", price: 12, cost: 1.9, popularity: 0.4 },
  { name: "House Negroni", category: "Drinks", price: 16, cost: 3.2, popularity: 0.8 },
  { name: "Sommelier Pour", category: "Drinks", price: 22, cost: 6.5, popularity: 0.6 },
];

export function computeMenuMatrix(totalCovers: number): MenuItem[] {
  const items = MENU_SEED.map((m) => {
    const r = rng(m.name);
    const sold = Math.max(2, Math.round(totalCovers * 0.18 * m.popularity * (0.85 + r() * 0.3)));
    const revenue = sold * m.price;
    const margin = (m.price - m.cost) * sold;
    const marginPct = ((m.price - m.cost) / m.price) * 100;
    return { ...m, sold, revenue, margin, marginPct, classification: "Dog" as MenuItem["classification"] };
  });
  // Star = high popularity + high margin %, Plowhorse = high pop + low margin,
  // Puzzle = low pop + high margin, Dog = low pop + low margin.
  const avgSold = items.reduce((a, i) => a + i.sold, 0) / items.length;
  const avgMargin = items.reduce((a, i) => a + i.marginPct, 0) / items.length;
  return items.map((i) => {
    const popHigh = i.sold >= avgSold;
    const marHigh = i.marginPct >= avgMargin;
    const classification: MenuItem["classification"] = popHigh && marHigh
      ? "Star"
      : popHigh
      ? "Plowhorse"
      : marHigh
      ? "Puzzle"
      : "Dog";
    return { ...i, classification };
  });
}

// ---------- The Pipeline: CRM + Events ----------
export interface PipelineEvent {
  id: string;
  client: string;
  type: "Private Dining" | "Wedding" | "Corporate" | "Tasting";
  date: string;
  guests: number;
  value: number;
  stage: "Inquiry" | "Proposal" | "Confirmed" | "Deposit Paid" | "Lost";
}

const CLIENTS = [
  "Marlowe & Vance LLP",
  "Heritage Capital Partners",
  "The Kowalski Wedding",
  "Northpoint Architects",
  "Cedar & Pine Studio",
  "Bellweather Foundation",
  "Veritas Health Group",
  "Pemberton Family",
  "Tessera Holdings",
  "Aria Tech Summit",
  "Hartwell Estate",
  "Brookline Society",
];
const TYPES: PipelineEvent["type"][] = ["Private Dining", "Wedding", "Corporate", "Tasting"];
const STAGES: PipelineEvent["stage"][] = ["Inquiry", "Proposal", "Confirmed", "Deposit Paid", "Lost"];

export function generatePipeline(range: DatePreset): PipelineEvent[] {
  const horizon = Math.min(180, Math.max(14, daysForPreset(range) * 2));
  const r = rng("pipeline" + range);
  const today = new Date();
  return CLIENTS.map((client, i) => {
    const offset = Math.floor(r() * horizon) - 7;
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + offset);
    const guests = 8 + Math.floor(r() * 90);
    const ppg = 95 + Math.floor(r() * 180);
    return {
      id: `EV-${1200 + i}`,
      client,
      type: TYPES[Math.floor(r() * TYPES.length)],
      date: d.toISOString().slice(0, 10),
      guests,
      value: guests * ppg,
      stage: STAGES[Math.floor(r() * STAGES.length)],
    };
  });
}

// ---------- Alerts ----------
export const demoAlerts = [
  { type: "comp" as const, severity: "warning" as const, message: "Server #4 comp rate 7.2% — above 4% threshold", time: "1h ago" },
  { type: "overtime" as const, severity: "warning" as const, message: "Line cook Davis approaching 42h this week", time: "2h ago" },
  { type: "void" as const, severity: "danger" as const, message: "Unusual void pattern detected on POS Terminal 2", time: "3h ago" },
  { type: "inventory" as const, severity: "info" as const, message: "Ribeye inventory below par — 6 portions remaining", time: "4h ago" },
  { type: "no_show" as const, severity: "warning" as const, message: "3 no-shows in last hour — VIP table held", time: "30m ago" },
];

// ---------- Day x Time Heatmap ----------
export const HEATMAP_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
export const HEATMAP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface HeatmapCell {
  day: number; // 0..6
  hour: number; // 0..23
  covers: number;
  netSales: number;
}

// Hour-of-day shape: lunch bump 12-14, dinner peak 18-21.
function hourFactor(h: number) {
  const map: Record<number, number> = {
    11: 0.25, 12: 0.85, 13: 0.95, 14: 0.55, 15: 0.18, 16: 0.2, 17: 0.45,
    18: 0.9, 19: 1.25, 20: 1.35, 21: 1.1, 22: 0.7, 23: 0.4, 0: 0.18,
  };
  return map[h] ?? 0.1;
}

export function generateHeatmap(center = "all"): HeatmapCell[] {
  const mix = CENTER_MIX[center] ?? CENTER_MIX.all;
  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    const df = dayOfWeekFactor(day);
    for (const hour of HEATMAP_HOURS) {
      const r = rng(`hm-${center}-${day}-${hour}`);
      const hf = hourFactor(hour);
      const baseCovers = 22 * mix.share * df * hf * (0.85 + r() * 0.3);
      const covers = Math.max(0, Math.round(baseCovers));
      const ppa = (38 + r() * 22) * mix.ppaMul;
      cells.push({
        day,
        hour,
        covers,
        netSales: Math.round(covers * ppa),
      });
    }
  }
  return cells;
}
