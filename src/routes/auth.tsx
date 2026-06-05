import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign In — MISE.OPS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/floor" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Signing you in...");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/floor" });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-accent">
            <span className="font-mono text-sm font-bold text-accent-foreground">M</span>
          </div>
          <h1 className="font-mono text-xl font-semibold tracking-tight">
            MISE<span className="text-muted-foreground">.OPS</span>
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Restaurant Operator Terminal
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-md border border-border bg-card p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-background font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border bg-background font-mono"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase text-xs tracking-wider">
            {loading ? "..." : mode === "signin" ? "Enter Terminal" : "Create Account"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
