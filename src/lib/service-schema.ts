import { z } from "zod";

export const orderLineSchema = z.object({
  menu_item_id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  qty: z.number().int().min(1),
  unit_price: z.number().nonnegative(),
  plate_cost: z.number().nonnegative(),
  comp: z.boolean().default(false),
});

export type OrderLine = z.infer<typeof orderLineSchema>;

export const submitOrderInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(23),
  revenue_center: z.string().min(1),
  party_size: z.number().int().min(1),
  table_no: z.string().optional().default(""),
  server_name: z.string().optional().default(""),
  guest_id: z.string().uuid().optional().nullable(),
  discount: z.number().min(0).default(0),
  lines: z.array(orderLineSchema).min(1),
});

export type SubmitOrderInput = z.infer<typeof submitOrderInput>;

export const voidOrderInput = z.object({ order_id: z.string().uuid() });

// Map menu category to sales bucket
export function bucketForCategory(category: string): "food" | "liquor" | "beer" | "wine" | "beverage" {
  const c = category.toLowerCase();
  if (c.includes("cocktail") || c.includes("liquor") || c.includes("spirit")) return "liquor";
  if (c.includes("beer")) return "beer";
  if (c.includes("wine")) return "wine";
  if (c.includes("beverage") || c.includes("drink") || c.includes("soft") || c.includes("coffee") || c.includes("tea")) return "beverage";
  return "food";
}

export function computeOrderTotals(lines: OrderLine[], discount: number) {
  let gross = 0;
  let comps = 0;
  let food_sales = 0, beverage_sales = 0, liquor_sales = 0, beer_sales = 0, wine_sales = 0;
  let food_cost = 0, beverage_cost = 0;
  for (const l of lines) {
    const lineTotal = l.qty * l.unit_price;
    const lineCost = l.qty * l.plate_cost;
    gross += lineTotal;
    if (l.comp) comps += lineTotal;
    else {
      const b = bucketForCategory(l.category);
      if (b === "food") { food_sales += lineTotal; food_cost += lineCost; }
      else {
        beverage_sales += lineTotal;
        beverage_cost += lineCost;
        if (b === "liquor") liquor_sales += lineTotal;
        else if (b === "beer") beer_sales += lineTotal;
        else if (b === "wine") wine_sales += lineTotal;
      }
    }
  }
  const discountClamped = Math.min(discount, Math.max(0, gross - comps));
  const net = Math.max(0, gross - comps - discountClamped);
  return {
    gross_sales: gross,
    comps,
    discounts: discountClamped,
    net_sales: net,
    food_sales, beverage_sales, liquor_sales, beer_sales, wine_sales,
    food_cost, beverage_cost,
  };
}
