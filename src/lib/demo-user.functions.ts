import { createServerFn } from "@tanstack/react-start";

export const DEMO_ADMIN_EMAIL = "admin@miseops.dev";
export const DEMO_STAFF_EMAIL = "staff@miseops.dev";
export const DEMO_PASSWORD = "MiseDemo!2026";

const DEMO_USERS = [
  { email: DEMO_ADMIN_EMAIL, fullName: "Demo Admin", role: "admin" as const },
  { email: DEMO_STAFF_EMAIL, fullName: "Demo Staff", role: "staff" as const },
];

async function authUserCount(supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw new Error(error.message);
  return data.users.length;
}

export const getDemoSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    canSetupDemo: (await authUserCount(supabaseAdmin)) === 0,
    accounts: DEMO_USERS.map(({ email, fullName, role }) => ({ email, fullName, role })),
    password: DEMO_PASSWORD,
  };
});

export const seedInitialDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if ((await authUserCount(supabaseAdmin)) > 0) {
    throw new Error("Demo setup is only available before the first user is created.");
  }

  const createdAccounts = [];
  for (const account of DEMO_USERS) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw new Error(error.message);
    const userId = data.user?.id;
    if (!userId) throw new Error(`Could not create ${account.email}`);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: account.email,
      full_name: account.fullName,
    });
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: account.role });
    if (roleError) throw new Error(roleError.message);

    createdAccounts.push({ email: account.email, fullName: account.fullName, role: account.role });
  }

  return { ok: true, accounts: createdAccounts, password: DEMO_PASSWORD };
});

export const ensureDemoUser = createServerFn({ method: "POST" }).handler(async () => {
  const result = await seedInitialDemoUsers();
  return { ok: result.ok, created: true };
});
