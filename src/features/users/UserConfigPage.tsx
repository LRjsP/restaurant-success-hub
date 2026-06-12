/**
 * User Config — admin-only team management page.
 * Composes presentational sub-components; data hooks live in ./data.
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMyRole, useUsersList } from "./data";
import { InviteUserForm } from "./InviteUserForm";
import { UsersTable } from "./UsersTable";

export function UserConfigPage() {
  const navigate = useNavigate();
  const meQuery = useMyRole();

  useEffect(() => {
    if (meQuery.data && !meQuery.data.isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/floor", search: { range: "7d", center: "all", compare: true } });
    }
  }, [meQuery.data, navigate]);

  const usersQuery = useUsersList(!!meQuery.data?.isAdmin);

  if (!meQuery.data?.isAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Checking permissions…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-tight">User Config</h1>
        <p className="mt-1 text-xs text-muted-foreground">Invite teammates and manage their access levels.</p>
      </div>
      <InviteUserForm />
      <UsersTable users={usersQuery.data} isLoading={usersQuery.isLoading} currentUserId={meQuery.data?.userId} />
    </div>
  );
}
