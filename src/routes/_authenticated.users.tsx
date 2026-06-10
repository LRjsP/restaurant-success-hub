import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  listUsers,
  inviteUser,
  updateUserRole,
  deleteUser,
  getMyRole,
  type AppRole,
} from "@/lib/users.functions";
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
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Config — MISE.OPS" }] }),
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMyRole);
  const fetchUsers = useServerFn(listUsers);
  const invite = useServerFn(inviteUser);
  const setRole = useServerFn(updateUserRole);
  const remove = useServerFn(deleteUser);

  const meQuery = useQuery({ queryKey: ["my-role"], queryFn: () => fetchMe() });

  useEffect(() => {
    if (meQuery.data && !meQuery.data.isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
    }
  }, [meQuery.data, navigate]);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    enabled: !!meQuery.data?.isAdmin,
  });

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setNewRole] = useState<AppRole>("staff");

  const inviteMut = useMutation({
    mutationFn: (vars: { email: string; fullName: string; role: AppRole }) =>
      invite({ data: vars }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setEmail("");
      setFullName("");
      setNewRole("staff");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to invite"),
  });

  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) => setRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => remove({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete user"),
  });

  if (!meQuery.data?.isAdmin) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Checking permissions…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-tight">User Config</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Invite teammates and manage their access levels.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-accent" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Invite user</h2>
        </div>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            inviteMut.mutate({ email, fullName, role });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@restaurant.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-name" className="text-xs">Full name</Label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setNewRole(v as AppRole)}>
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

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
            Team ({usersQuery.data?.length ?? 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-mono">User</th>
                <th className="px-5 py-2.5 text-left font-mono">Email</th>
                <th className="px-5 py-2.5 text-left font-mono">Role</th>
                <th className="px-5 py-2.5 text-right font-mono">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading && (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {usersQuery.data?.map((u) => {
                const isMe = u.id === meQuery.data?.userId;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-5 py-3">{u.full_name || "—"}{isMe && <span className="ml-2 text-[10px] font-mono uppercase text-accent">you</span>}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      <Select
                        value={u.role}
                        onValueChange={(v) => roleMut.mutate({ userId: u.id, role: v as AppRole })}
                        disabled={isMe}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">
                            <span className="inline-flex items-center gap-2"><ShieldOff className="h-3 w-3" /> Staff</span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Admin</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isMe || deleteMut.isPending}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                            deleteMut.mutate(u.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
