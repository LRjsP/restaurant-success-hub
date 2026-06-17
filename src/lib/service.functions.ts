import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { submitOrderInput, voidOrderInput, computeOrderTotals } from "./service-schema";
import { z } from "zod";

export const getServiceCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [items, settings] = await Promise.all([
      supabase.from("menu_items").select("id,name,category,price,plate_cost,is_active").eq("is_active", true).order("category").order("name"),
      supabase.from("restaurant_settings").select("revenue_centers").limit(1).maybeSingle(),
    ]);
    if (items.error) throw new Error(items.error.message);
    const centers = ((settings.data?.revenue_centers as any[]) ?? []).map((c: any) => ({
      value: String(c.value),
      label: String(c.label ?? c.value),
    }));
    return {
      items: (items.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, category: r.category,
        price: Number(r.price), plate_cost: Number(r.plate_cost),
      })),
      revenue_centers: centers,
    };
  });

export const searchGuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("guests").select("id,name,email,tier,visit_count,lifetime_value")
      .or(`name.ilike.%${data.q}%,email.ilike.%${data.q}%`).limit(8);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1), email: z.string().email().optional().or(z.literal("")) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guests").insert({ name: data.name, email: data.email || null, tier: "new", visit_count: 0, lifetime_value: 0 })
      .select("id,name,email,tier,visit_count,lifetime_value").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const submitOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => submitOrderInput.parse(d))
  .handler(async ({ data, context }) => {
    const totals = computeOrderTotals(
      data.lines.map((l) => ({ ...l })),
      data.discount,
    );
    const payload = {
      ...totals,
      date: data.date,
      hour: data.hour,
      revenue_center: data.revenue_center,
      party_size: data.party_size,
      table_no: data.table_no ?? "",
      server_name: data.server_name ?? "",
      guest_id: data.guest_id ?? null,
      actor_id: context.userId,
      lines: data.lines.map((l) => ({
        menu_item_id: l.menu_item_id,
        name: l.name,
        category: l.category,
        units: l.qty,
        revenue: l.comp ? 0 : l.qty * l.unit_price,
        cost: l.qty * l.plate_cost,
      })),
    };
    const { data: orderId, error } = await context.supabase.rpc("apply_order_deltas", { payload });
    if (error) throw new Error(error.message);
    return { order_id: orderId as string, totals };
  });

export const voidOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => voidOrderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("audit_log").select("meta,entity_id,action").eq("entity_id", data.order_id).eq("action", "order.submit").maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found");
    const original = row.meta as any;
    const payload = { ...original, void: true, order_id: data.order_id, actor_id: context.userId };
    const { error: rpcErr } = await context.supabase.rpc("apply_order_deltas", { payload });
    if (rpcErr) throw new Error(rpcErr.message);
    return { ok: true };
  });

export const recentOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("entity_id,action,meta,created_at,actor_id")
      .eq("entity", "service_order")
      .gte("created_at", `${today}T00:00:00Z`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    // Collapse voided orders
    const voided = new Set(
      (data ?? []).filter((r: any) => r.action === "order.void").map((r: any) => r.entity_id),
    );
    return (data ?? [])
      .filter((r: any) => r.action === "order.submit")
      .map((r: any) => ({
        order_id: r.entity_id,
        created_at: r.created_at,
        voided: voided.has(r.entity_id),
        revenue_center: r.meta?.revenue_center,
        party_size: r.meta?.party_size,
        net_sales: Number(r.meta?.net_sales ?? 0),
        line_count: Array.isArray(r.meta?.lines) ? r.meta.lines.length : 0,
        table_no: r.meta?.table_no ?? "",
      }));
  });
