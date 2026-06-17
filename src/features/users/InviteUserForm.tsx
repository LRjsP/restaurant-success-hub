import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useInviteUser, type AppRole } from "./data";

type FormValues = { email: string; fullName: string; role: AppRole };

export function InviteUserForm() {
  const inviteMut = useInviteUser();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", fullName: "", role: "staff" },
  });
  const role = watch("role");

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await inviteMut.mutateAsync(values);
      reset({ email: "", fullName: "", role: "staff" });
    } catch (err: any) {
      setError("root", { message: err?.message ?? "Failed to invite" });
    }
  });

  return (
    <Card id="invite-user-form" className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-accent" />
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Invite user</h2>
      </div>
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="invite-email" className="text-xs">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@restaurant.com"
            aria-invalid={!!errors.email}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /[^@\s]+@[^@\s]+\.[^@\s]+/, message: "Enter a valid email" },
            })}
          />
          {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name" className="text-xs">Full name</Label>
          <Input id="invite-name" placeholder="Optional" {...register("fullName")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={(v) => setValue("role", v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? "Sending…" : "Send invite"}
          </Button>
        </div>
        {errors.root && (
          <p
            role="alert"
            className="md:col-span-4 rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] text-destructive"
          >
            {errors.root.message}
          </p>
        )}
      </form>
    </Card>
  );
}
