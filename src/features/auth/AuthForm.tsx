import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AuthMode } from "./data";

type FormValues = { email: string; password: string; fullName: string };

export function AuthForm({
  mode,
  onModeChange,
  defaultEmail = "",
  defaultPassword = "",
  googleLoading,
  onSubmit,
  onGoogle,
  onForgot,
}: {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  defaultEmail?: string;
  defaultPassword?: string;
  googleLoading: boolean;
  /** Throws on failure; AuthForm surfaces the message inline. */
  onSubmit: (values: FormValues, mode: AuthMode) => Promise<void>;
  onGoogle: () => void;
  onForgot: (email: string) => void;
}) {
  const form = useForm<FormValues>({
    defaultValues: { email: defaultEmail, password: defaultPassword, fullName: "" },
    mode: "onSubmit",
  });
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // Keep external default fills (e.g. demo seed) in sync.
  useEffect(() => {
    if (defaultEmail) setValue("email", defaultEmail);
    if (defaultPassword) setValue("password", defaultPassword);
  }, [defaultEmail, defaultPassword, setValue]);

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await onSubmit(values, mode);
    } catch (err: any) {
      setError("root", { message: err?.message ?? "Authentication failed" });
    }
  });

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => {
        clearErrors("root");
        onModeChange(v as AuthMode);
      }}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Sign up</TabsTrigger>
      </TabsList>

      <Button
        type="button"
        variant="outline"
        className="mt-6 w-full gap-2"
        onClick={onGoogle}
        disabled={googleLoading || isSubmitting}
      >
        <GoogleGlyph />
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </Button>

      <div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <TabsContent value="signup" className="space-y-4 mt-0">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...register("fullName", {
                validate: (v) => mode !== "signup" || v.trim().length > 0 || "Full name is required",
              })}
            />
            {errors.fullName && (
              <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
            )}
          </div>
        </TabsContent>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: "Enter a valid email" },
            })}
          />
          {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => onForgot(getValues("email"))}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Forgot?
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-invalid={!!errors.password}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
          {errors.password && (
            <p className="text-[11px] text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
          {isSubmitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        {errors.root && (
          <p
            role="alert"
            className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] text-destructive"
          >
            {errors.root.message}
          </p>
        )}
      </form>
    </Tabs>
  );
}

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.3 5.3c-.4.4 6.4-4.7 6.4-15 0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
