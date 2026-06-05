// Deterministic client-side demo data generator — no server/auth required

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
  const map = [1.05, 0.55, 0.65, 0.7, 0.85, 1.25, 1.4];
  return map[dow];
}

export interface DemoDay {
  date: string;
  netSales: number;
  covers: number;
  tablesServed: number;
  discounts: number;
  comps: number;
  grossSales: number;
  availableSeats: number;
  hoursOpen: number;
  noShows: number;
  totalReservations: number;
}

export function generateDemoDays(days = 7): DemoDay[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const results: DemoDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const df = dayOfWeekFactor(dow);
    const r = rng(iso);

    const baseCovers = Math.round(180 * df * (0.85 + r() * 0.3));
    const ppa = 38 + r() * 22;
    const netSales = baseCovers * ppa;
    const grossSales = netSales * (1 + 0.02 + r() * 0.04);
    const discounts = grossSales * (0.01 + r() * 0.03);
    const comps = grossSales * (0.005 + r() * 0.015);
    const tablesServed = Math.round(baseCovers / (2.2 + r() * 0.6));
    const reservations = Math.round(baseCovers * (0.7 + r() * 0.2));
    const noShows = Math.round(reservations * (0.04 + r() * 0.06));

    results.push({
      date: iso,
      netSales: Math.round(netSales),
      covers: baseCovers,
      tablesServed,
      discounts: Math.round(discounts),
      comps: Math.round(comps),
      grossSales: Math.round(grossSales),
      availableSeats: 80 + 30 + 40, // dining + bar + patio
      hoursOpen: 11,
      noShows,
      totalReservations: reservations,
    });
  }
  return results;
}

export function computeFloorKpis(days: DemoDay[]) {
  const sum = (k: keyof DemoDay) => days.reduce((a, d) => a + (d[k] as number), 0);
  const prevDays = generateDemoDays(7).slice(0, 7);
  const prevSum = (k: keyof DemoDay) => prevDays.reduce((a, d) => a + (d[k] as number), 0);

  const netSales = sum("netSales");
  const prevNetSales = prevSum("netSales");
  const covers = sum("covers");
  const prevCovers = prevSum("covers");
  const tablesServed = sum("tablesServed");
  const prevTablesServed = prevSum("tablesServed");
  const grossSales = sum("grossSales");
  const prevGrossSales = prevSum("grossSales");
  const totalReservations = sum("totalReservations");
  const noShows = sum("noShows");

  return {
    netSales,
    netSalesDelta: prevNetSales ? ((netSales - prevNetSales) / prevNetSales) * 100 : 0,
    covers,
    coversDelta: prevCovers ? ((covers - prevCovers) / prevCovers) * 100 : 0,
    ppa: covers ? netSales / covers : 0,
    ppaDelta: prevCovers && prevNetSales
      ? ((netSales / covers - prevNetSales / prevCovers) / (prevNetSales / prevCovers)) * 100
      : 0,
    avgCheck: tablesServed ? netSales / tablesServed : 0,
    avgCheckDelta: prevTablesServed && prevNetSales
      ? ((netSales / tablesServed - prevNetSales / prevTablesServed) / (prevNetSales / prevTablesServed)) * 100
      : 0,
    tableTurns: tablesServed && days.length
      ? tablesServed / ((days[0].availableSeats / 2) * days[0].hoursOpen / days.length)
      : 0,
    tableTurnsDelta: 2.1,
    discountPct: grossSales ? ((sum("discounts") + sum("comps")) / grossSales) * 100 : 0,
    discountPctDelta: prevGrossSales
      ? (((sum("discounts") + sum("comps")) / grossSales - (prevSum("discounts") + prevSum("comps")) / prevGrossSales) * 100
      : 0,
    noShowRate: totalReservations ? (noShows / totalReservations) * 100 : 0,
    trend: days.map((d) => ({ date: d.date.slice(5), value: Math.round(d.netSales) })),
  };
}

export const demoAlerts = [
  { type: "comp" as const, severity: "warning" as const, message: "Server #4 comp rate 7.2% — above 4% threshold", time: "1h ago" },
  { type: "overtime" as const, severity: "warning" as const, message: "Line cook Davis approaching 42h this week", time: "2h ago" },
  { type: "void" as const, severity: "danger" as const, message: "Unusual void pattern detected on POS Terminal 2", time: "3h ago" },
  { type: "inventory" as const, severity: "info" as const, message: "Ribeye inventory below par — 6 portions remaining", time: "4h ago" },
  { type: "no_show" as const, severity: "warning" as const, message: "3 no-shows in last hour — VIP table held", time: "30m ago" },
];
