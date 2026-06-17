import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { useDeleteUser, useUpdateRole, type AppRole } from "./data";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/Skeletons";

type Row = { id: string; email: string; full_name?: string | null; role: AppRole };

export function UsersTable({ users, isLoading, currentUserId }: { users?: Row[]; isLoading: boolean; currentUserId?: string }) {
  const roleMut = useUpdateRole();
  const deleteMut = useDeleteUser();

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Team ({users?.length ?? 0})</h2>
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
            {isLoading && (
              <tr><td colSpan={4} className="px-5 py-6"><TableRowsSkeleton rows={4} cols={4} /></td></tr>
            )}
            {!isLoading && (!users || users.length === 0) && (
              <tr>
                <td colSpan={4} className="px-5 py-6">
                  <EmptyState
                    icon={UserPlus}
                    message="No teammates yet."
                    ctaLabel="Invite teammate"
                    onCta={() => {
                      const el = document.getElementById("invite-email");
                      el?.focus();
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                </td>
              </tr>
            )}
            {users?.map((u) => {
              const isMe = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    {u.full_name || "—"}
                    {isMe && <span className="ml-2 text-[10px] font-mono uppercase text-accent">you</span>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <Select
                      value={u.role}
                      onValueChange={(v) => roleMut.mutate({ userId: u.id, role: v as AppRole })}
                      disabled={isMe}
                    >
                      <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
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
  );
}
