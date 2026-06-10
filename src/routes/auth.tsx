import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDemoSetupStatus, seedInitialDemoUsers } from "@/lib/demo-user.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — MISE.OPS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const fetchDemoStatus = useServerFn(getDemoSetupStatus);
  const seedDemoUsers = useServerFn(seedInitialDemoUsers);
  const demoStatus = useQuery({ queryKey: ["demo-setup-status"], queryFn: () => fetchDemoStatus() });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || null },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;
        toast.success("Account created");
      }
      navigate({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const setupDemoAccounts = async () => {
    setSetupLoading(true);
    try {
      const result = await seedDemoUsers();
      const admin = result.accounts.find((account) => account.role === "admin");
      if (admin) {
        setMode("signin");
        setEmail(admin.email);
        setPassword(result.password);
      }
      await demoStatus.refetch();
      toast.success("Demo admin and staff accounts are ready");
    } catch (err: any) {
      toast.error(err.message ?? "Could not create demo accounts");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-accent">
            <span className="font-mono text-sm font-bold text-accent-foreground">M</span>
          </div>
          <h1 className="font-mono text-lg font-semibold tracking-tight">
            MISE<span className="text-muted-foreground">.OPS</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">Restaurant operations intelligence</p>
        </div>

        {demoStatus.data?.canSetupDemo && (
          <div className="mb-5 rounded-sm border border-border bg-card p-4 text-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              First-time setup
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {demoStatus.data.accounts.map((account) => (
                <div key={account.email} className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{account.email}</span>
                  <span className="font-mono uppercase tracking-wider">{account.role}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <span>Password</span>
                <span className="font-mono text-foreground">{demoStatus.data.password}</span>
              </div>
            </div>
            <Button type="button" className="mt-4 w-full" onClick={setupDemoAccounts} disabled={setupLoading}>
              {setupLoading ? "Creating accounts…" : "Create demo accounts"}
            </Button>
          </div>
        )}

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <TabsContent value="signup" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </TabsContent>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
