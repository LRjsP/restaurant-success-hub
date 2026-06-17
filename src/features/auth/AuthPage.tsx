/**
 * Auth — sign in / sign up / Google OAuth / forgot password.
 */
import { useState, useEffect } from "react";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { AuthForm } from "./AuthForm";
import { DemoSetupCard } from "./DemoSetupCard";
import {
  getActiveSession,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  useDemoStatus,
  useSeedDemoUsers,
  type AuthMode,
} from "./data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const FLOOR_SEARCH = { range: "7d" as const, center: "all" as const, compare: true };

const routeApi = getRouteApi("/auth");

export function AuthPage() {
  const navigate = useNavigate();
  const search = routeApi.useSearch();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const demoStatus = useDemoStatus();
  const seedMut = useSeedDemoUsers();

  useEffect(() => {
    if (search.reason === "expired") return; // don't bounce a just-expired user
    getActiveSession().then((session) => {
      if (session) navigate({ to: "/floor", search: FLOOR_SEARCH });
    });
  }, [navigate, search.reason]);

  const onSubmit = async (values: { email: string; password: string; fullName: string }, m: AuthMode) => {
    if (m === "signin") {
      await signIn(values.email, values.password);
      toast.success("Welcome back");
    } else {
      await signUp(values.email, values.password, values.fullName);
      toast.success("Account created");
    }
    navigate({ to: "/floor", search: FLOOR_SEARCH });
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.redirected) return;
      navigate({ to: "/floor", search: FLOOR_SEARCH });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      toast.success("Reset email sent — check your inbox");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  const setupDemoAccounts = async () => {
    try {
      const result = await seedMut.mutateAsync();
      const admin = result.accounts.find((a) => a.role === "admin");
      if (admin) {
        setMode("signin");
        setDefaultEmail(admin.email);
        setDefaultPassword(result.password);
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

        {search.reason === "expired" && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
            <p className="text-xs text-foreground">
              Your session expired — please sign in again.
            </p>
          </div>
        )}

        {demoStatus.data?.canSetupDemo && (
          <DemoSetupCard status={demoStatus.data} loading={seedMut.isPending} onSetup={setupDemoAccounts} />
        )}

        <AuthForm
          mode={mode}
          onModeChange={setMode}
          defaultEmail={defaultEmail}
          defaultPassword={defaultPassword}
          googleLoading={googleLoading}
          onSubmit={onSubmit}
          onGoogle={onGoogle}
          onForgot={(email) => {
            setForgotEmail(email);
            setForgotOpen(true);
          }}
        />
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <form onSubmit={onForgotSubmit}>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>
                Enter your email and we&apos;ll send a link to set a new password.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={forgotLoading}>
                {forgotLoading ? "Sending…" : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
