/**
 * Auth feature — data layer.
 * Wraps Supabase auth + demo seeding into reusable hooks. Display
 * components stay free of Supabase imports.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDemoSetupStatus, seedInitialDemoUsers } from "@/lib/demo-user.functions";

export type AuthMode = "signin" | "signup";

export function useDemoStatus() {
  const fetchDemoStatus = useServerFn(getDemoSetupStatus);
  return useQuery({ queryKey: ["demo-setup-status"], queryFn: () => fetchDemoStatus() });
}

export function useSeedDemoUsers() {
  const seed = useServerFn(seedInitialDemoUsers);
  return useMutation({ mutationFn: () => seed() });
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, fullName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: window.location.origin + "/auth",
    },
  });
  if (error) throw error;
}

export async function getActiveSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
