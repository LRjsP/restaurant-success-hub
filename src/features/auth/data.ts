/**
 * Auth feature — data layer.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

export async function signInWithGoogle() {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
  return result;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password",
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getActiveSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
