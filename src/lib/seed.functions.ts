import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CENTERS = ["dining_room", "bar", "patio", "takeout", "delivery", "catering"] as const;

// deterministic pseudo-random based on string seed
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
  // Mon..Sun -> 0..6 (Mon=1 in JS getUTCDay where Sun=0)
  // convert: 0=Sun
  const map = [1.05, 0.55, 0.65, 0.7, 0.85, 1.25, 1.4]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  return map[dow];
}

function centerWeight(center: string) {
  switch (center) {
    case "dining_room": return 1.0;
    case "bar": return 0.35;
    case "patio": return 0.25;
    case "takeout": return 0.2;
    case "delivery": return 0.18;
    case "catering": return 0.12;
    default: return 1.0;
  }
}

function hourFactor(hour: number) {
  // 11am-2pm lunch, 5pm-10pm dinner
  if (hour < 11 || hour > 23) return 0;
  if (hour >= 11 && hour <= 14) return 0.6 + (hour === 12 || hour === 13 ? 0.4 : 0);
  if (hour >= 17 && hour <= 22) return 0.7 + (hour === 19 || hour === 20 ? 0.5 : 0.2);
  return 0.15;
}

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // Wipe existing demo data
    await supabase.from("daily_metrics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("hourly_metrics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("guests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("events_pipeline").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("digital_activity").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const daily: any[] = [];
    const hourly: any[] = [];
    const digital: any[] = [];

    for (let i = 105; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dow = d.getUTCDay();
      const dayFactor = dayOfWeekFactor(dow);
      const r = rng(iso);

      let totalDayRevenue = 0;
      let totalDayCovers = 0;

      for (const center of CENTERS) {
        const cw = centerWeight(center);
        const baseCovers = Math.round(180 * dayFactor * cw * (0.85 + r() * 0.3));
        const ppa = (38 + r() * 22) * (center === "bar" ? 0.6 : center === "takeout" || center === "delivery" ? 0.7 : 1);
        const netSales = baseCovers * ppa;
        const grossSales = netSales * (1 + 0.02 + r() * 0.04);
        const discounts = grossSales * (0.01 + r() * 0.03);
        const comps = grossSales * (0.005 + r() * 0.015);
        const foodSales = netSales * (center === "bar" ? 0.25 : 0.7);
        const bevSales = netSales - foodSales;
        const liquorSales = bevSales * 0.45;
        const beerSales = bevSales * 0.25;
        const wineSales = bevSales * 0.3;
        const foodCost = foodSales * (0.28 + r() * 0.06);
        const liquorCost = liquorSales * (0.15 + r() * 0.04);
        const beerCost = beerSales * (0.2 + r() * 0.04);
        const wineCost = wineSales * (0.32 + r() * 0.08);
        const bevCost = liquorCost + beerCost + wineCost;
        const laborHours = baseCovers * (0.35 + r() * 0.1);
        const laborCost = laborHours * (22 + r() * 6);
        const tablesServed = Math.round(baseCovers / (2.2 + r() * 0.6));
        const reservations = Math.round(baseCovers * (0.7 + r() * 0.2));
        const noShows = Math.round(reservations * (0.04 + r() * 0.06));

        totalDayRevenue += netSales;
        totalDayCovers += baseCovers;

        daily.push({
          date: iso,
          revenue_center: center,
          net_sales: round2(netSales),
          gross_sales: round2(grossSales),
          covers: baseCovers,
          tables_served: tablesServed,
          discounts: round2(discounts),
          comps: round2(comps),
          food_cost: round2(foodCost),
          beverage_cost: round2(bevCost),
          liquor_cost: round2(liquorCost),
          beer_cost: round2(beerCost),
          wine_cost: round2(wineCost),
          food_sales: round2(foodSales),
          beverage_sales: round2(bevSales),
          liquor_sales: round2(liquorSales),
          beer_sales: round2(beerSales),
          wine_sales: round2(wineSales),
          labor_cost: round2(laborCost),
          labor_hours: round2(laborHours),
          total_reservations: reservations,
          no_shows: noShows,
          available_seats: center === "dining_room" ? 80 : center === "bar" ? 30 : center === "patio" ? 40 : 0,
          hours_open: 11,
        });
      }

      // hourly for dining_room only (heatmap source)
      for (let h = 11; h <= 23; h++) {
        const hf = hourFactor(h);
        if (hf === 0) continue;
        const covers = Math.round(180 * dayFactor * hf * (0.8 + r() * 0.4) * 0.4);
        const revenue = covers * (38 + r() * 22);
        hourly.push({
          date: iso,
          hour: h,
          revenue_center: "dining_room",
          revenue: round2(revenue),
          covers,
          available_seats: 80,
        });
      }

      digital.push({
        date: iso,
        mau: Math.round(800 + r() * 400 + i * -2),
        online_orders: Math.round(40 + r() * 30 + dayFactor * 25),
        cart_starts: Math.round(120 + r() * 60),
        cart_completed: Math.round((40 + r() * 30 + dayFactor * 25) * 0.85),
      });
    }

    // Insert in chunks (Supabase 1000-row default insert limit-ish)
    for (let i = 0; i < daily.length; i += 500) {
      await supabase.from("daily_metrics").insert(daily.slice(i, i + 500));
    }
    for (let i = 0; i < hourly.length; i += 500) {
      await supabase.from("hourly_metrics").insert(hourly.slice(i, i + 500));
    }
    await supabase.from("digital_activity").insert(digital);

    // Menu items
    const menu = [
      { name: "Dry-Aged Ribeye", category: "Mains", price: 68, plate_cost: 24, units_sold_30d: 412 },
      { name: "Hamachi Crudo", category: "Starters", price: 22, plate_cost: 6.5, units_sold_30d: 388 },
      { name: "Tagliatelle Bolognese", category: "Pastas", price: 28, plate_cost: 4.2, units_sold_30d: 522 },
      { name: "Roasted Branzino", category: "Mains", price: 42, plate_cost: 14, units_sold_30d: 287 },
      { name: "Burrata & Heirloom", category: "Starters", price: 18, plate_cost: 5.4, units_sold_30d: 341 },
      { name: "Wagyu Tartare", category: "Starters", price: 26, plate_cost: 11, units_sold_30d: 198 },
      { name: "Braised Short Rib", category: "Mains", price: 38, plate_cost: 12, units_sold_30d: 256 },
      { name: "Truffle Risotto", category: "Pastas", price: 34, plate_cost: 9, units_sold_30d: 312 },
      { name: "Caesar Salad", category: "Starters", price: 16, plate_cost: 2.8, units_sold_30d: 480 },
      { name: "Margherita Pizza", category: "Pizzas", price: 19, plate_cost: 3.1, units_sold_30d: 398 },
      { name: "Lamb Shank", category: "Mains", price: 44, plate_cost: 18, units_sold_30d: 142 },
      { name: "Polenta Fries", category: "Sides", price: 9, plate_cost: 4.5, units_sold_30d: 64 },
      { name: "Beet & Goat Cheese", category: "Starters", price: 17, plate_cost: 8.2, units_sold_30d: 48 },
      { name: "Escargot Bourguignon", category: "Starters", price: 21, plate_cost: 9.8, units_sold_30d: 38 },
      { name: "Duck Confit", category: "Mains", price: 39, plate_cost: 15.5, units_sold_30d: 88 },
      { name: "Chocolate Soufflé", category: "Desserts", price: 14, plate_cost: 3.2, units_sold_30d: 245 },
      { name: "Olive Oil Cake", category: "Desserts", price: 12, plate_cost: 2.1, units_sold_30d: 178 },
      { name: "House Negroni", category: "Cocktails", price: 16, plate_cost: 3, units_sold_30d: 612 },
      { name: "Old Fashioned", category: "Cocktails", price: 18, plate_cost: 3.4, units_sold_30d: 488 },
      { name: "Espresso Martini", category: "Cocktails", price: 17, plate_cost: 3.2, units_sold_30d: 412 },
    ];
    await supabase.from("menu_items").insert(menu);

    // Guests
    const guestNames = [
      "Marcus Thorne", "Elena Rodriguez", "James Holloway", "Sofia Chen", "David Park",
      "Isabella Romano", "Henry Whitfield", "Aisha Khan", "Robert Sterling", "Maya Patel",
      "Thomas Reed", "Charlotte Dubois", "Nathan Cole", "Priya Sharma", "William Hayes",
      "Olivia Bennett", "Carlos Mendez", "Hannah Liu", "Edward Marsh", "Grace Kim",
    ];
    const now = Date.now();
    const guests = guestNames.map((name, i) => {
      const r = rng(name);
      const tier = i < 6 ? "vip" : i < 14 ? "regular" : "occasional";
      const daysSince = tier === "vip" ? Math.floor(r() * 80) : Math.floor(r() * 60);
      const visits = tier === "vip" ? 20 + Math.floor(r() * 40) : 4 + Math.floor(r() * 12);
      const avgSpend = tier === "vip" ? 180 + r() * 200 : 90 + r() * 80;
      return {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        lifetime_value: round2(visits * avgSpend),
        visit_count: visits,
        last_visit_at: new Date(now - daysSince * 86400000).toISOString(),
        tier,
      };
    });
    await supabase.from("guests").insert(guests);

    // Events pipeline
    const stages = ["inquiry", "proposal", "contract", "deposit", "won", "lost"];
    const companies = ["Apex Partners", "Northwind Bio", "Helix Capital", "Meridian Group", "Vanta Labs", "Orion Pharma", "Crest Holdings", "Lumen & Co", "Cobalt Ventures", "Pinnacle Realty"];
    const events: any[] = [];
    companies.forEach((co, i) => {
      const r = rng(co);
      const stageIdx = Math.floor(r() * stages.length);
      events.push({
        contact_name: ["Sarah Miller", "Tom Davies", "Rachel Kim", "Mike Brooks", "Lila Singh"][i % 5],
        company: co,
        stage: stages[stageIdx],
        value: round2(2500 + r() * 18000),
        event_date: new Date(now + (Math.floor(r() * 60) - 10) * 86400000).toISOString().slice(0, 10),
        notes: null,
      });
    });
    // add a few more inquiries
    for (let i = 0; i < 30; i++) {
      const r = rng(`extra-${i}`);
      events.push({
        contact_name: ["Alex Wong", "Nina Powell", "Jordan Estevez", "Riya Joshi", "Sam O'Connor"][i % 5],
        company: `${["Acme", "Beacon", "Crystal", "Drift", "Echo"][i % 5]} ${["Inc", "LLC", "Group", "Co", "Studio"][(i + 1) % 5]}`,
        stage: stages[Math.floor(r() * (stages.length - 1))],
        value: round2(1500 + r() * 12000),
        event_date: new Date(now + (Math.floor(r() * 90)) * 86400000).toISOString().slice(0, 10),
        notes: null,
      });
    }
    await supabase.from("events_pipeline").insert(events);

    // Alerts
    const alerts = [
      { type: "comp", severity: "warning", message: "Server #4 comp rate 7.2% — above 4% threshold", occurred_at: new Date(now - 3600000).toISOString() },
      { type: "overtime", severity: "warning", message: "Line cook Davis approaching 42h this week", occurred_at: new Date(now - 7200000).toISOString() },
      { type: "void", severity: "danger", message: "Unusual void pattern detected on POS Terminal 2", occurred_at: new Date(now - 10800000).toISOString() },
      { type: "inventory", severity: "info", message: "Ribeye inventory below par — 6 portions remaining", occurred_at: new Date(now - 14400000).toISOString() },
      { type: "no_show", severity: "warning", message: "3 no-shows in last hour — VIP table held", occurred_at: new Date(now - 1800000).toISOString() },
    ];
    await supabase.from("alerts").insert(alerts);

    return { ok: true, days: 90 };
  });

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
