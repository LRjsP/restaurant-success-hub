import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useInviteUser, type AppRole } from "./data";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const inviteMut = useInviteUser();

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-accent" />
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Invite user</h2>
      </div>
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          inviteMut.mutate(
            { email, fullName, role },
            {
              onSuccess: () => {
                setEmail("");
                setFullName("");
                setRole("staff");
              },
            },
          );
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="invite-email" className="text-xs">Email</Label>
          <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@restaurant.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-name" className="text-xs">Full name</Label>
          <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={inviteMut.isPending} className="w-full md:w-auto">
            {inviteMut.isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
