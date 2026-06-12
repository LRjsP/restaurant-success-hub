/**
 * Auth — sign in / sign up page with optional first-time demo seeding.
 * Display logic only — auth + demo seeding live in ./data.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthForm } from "./AuthForm";
import { DemoSetupCard } from "./DemoSetupCard";
import {
  getActiveSession,
  signIn,
  signUp,
  useDemoStatus,
  useSeedDemoUsers,
  type AuthMode,
} from "./data";

const FLOOR_SEARCH = { range: "7d" as const, center: "all" as const, compare: true };

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const demoStatus = useDemoStatus();
  const seedMut = useSeedDemoUsers();

  useEffect(() => {
    getActiveSession().then((session) => {
      if (session) navigate({ to: "/floor", search: FLOOR_SEARCH });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast.success("Welcome back");
      } else {
        await signUp(email, password, fullName);
        toast.success("Account created");
      }
      navigate({ to: "/floor", search: FLOOR_SEARCH });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const setupDemoAccounts = async () => {
    try {
      const result = await seedMut.mutateAsync();
      const admin = result.accounts.find((a) => a.role === "admin");
      if (admin) {
        setMode("signin");
        setEmail(admin.email);
        setPassword(result.password);
      }
      await demoStatus.refetch();
      toast.success("Demo admin and staff accounts are ready");
    } catch (err: any) {
      toast.error(err.message ?? "Could not create demo accounts");
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
          <DemoSetupCard status={demoStatus.data} loading={seedMut.isPending} onSetup={setupDemoAccounts} />
        )}

        <AuthForm
          mode={mode}
          onModeChange={setMode}
          email={email}
          password={password}
          fullName={fullName}
          onChange={(p) => {
            if (p.email !== undefined) setEmail(p.email);
            if (p.password !== undefined) setPassword(p.password);
            if (p.fullName !== undefined) setFullName(p.fullName);
          }}
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
