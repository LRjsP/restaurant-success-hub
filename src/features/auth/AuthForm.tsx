import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AuthMode } from "./data";

export function AuthForm({
  mode,
  onModeChange,
  email,
  password,
  fullName,
  onChange,
  loading,
  onSubmit,
}: {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  email: string;
  password: string;
  fullName: string;
  onChange: (patch: { email?: string; password?: string; fullName?: string }) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as AuthMode)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Sign up</TabsTrigger>
      </TabsList>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <TabsContent value="signup" className="space-y-4 mt-0">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => onChange({ fullName: e.target.value })} />
          </div>
        </TabsContent>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => onChange({ email: e.target.value })}
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
            onChange={(e) => onChange({ password: e.target.value })}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </Tabs>
  );
}
