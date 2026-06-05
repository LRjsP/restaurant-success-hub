import { createServerFn } from "@tanstack/react-start";

export const DEMO_EMAIL = "demo@mise.ops";
export const DEMO_PASSWORD = "DemoPass!2026";

export const ensureDemoUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) return { ok: true, created: false };

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return { ok: true, created: true };
});
