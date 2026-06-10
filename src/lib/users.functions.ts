import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "staff";

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin role required");
}

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .order("role", { ascending: true });
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r: any) => r.role as AppRole);
    return {
      userId: context.userId,
      roles,
      isAdmin: roles.includes("admin"),
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserRow[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (authErr) throw new Error(authErr.message);

    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, email");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, AppRole>();
    (roles ?? []).forEach((r: any) => {
      // admin wins over staff
      if (r.role === "admin" || !roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role);
    });

    return authList.users.map((u) => ({
      id: u.id,
      email: u.email ?? profileMap.get(u.id)?.email ?? "",
      full_name: profileMap.get(u.id)?.full_name ?? null,
      role: (roleMap.get(u.id) ?? "staff") as AppRole,
      created_at: u.created_at,
    }));
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; role: AppRole; fullName?: string }) => {
    if (!d.email || !/.+@.+\..+/.test(d.email)) throw new Error("Valid email required");
    if (d.role !== "admin" && d.role !== "staff") throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const redirectTo =
      (process.env.SITE_URL ?? "") + "/auth";

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName ?? null },
      redirectTo: redirectTo || undefined,
    });
    if (error) throw new Error(error.message);

    const userId = invited.user?.id;
    if (userId) {
      // The trigger inserts 'staff' by default; upgrade if admin requested.
      if (data.role === "admin") {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
      }
    }
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) => {
    if (d.role !== "admin" && d.role !== "staff") throw new Error("Invalid role");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("You can't delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
