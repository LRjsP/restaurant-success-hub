/**
 * User Config feature — data layer.
 * Wraps the server functions in TanStack Query hooks. Components stay
 * presentational and consume these hooks.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  inviteUser,
  updateUserRole,
  deleteUser,
  getMyRole,
  type AppRole,
} from "@/lib/users.functions";
import { toast } from "sonner";

export type { AppRole };

export function useMyRole() {
  const fetchMe = useServerFn(getMyRole);
  return useQuery({ queryKey: ["my-role"], queryFn: () => fetchMe() });
}

export function useUsersList(enabled: boolean) {
  const fetchUsers = useServerFn(listUsers);
  return useQuery({ queryKey: ["users"], queryFn: () => fetchUsers(), enabled });
}

export function useInviteUser() {
  const qc = useQueryClient();
  const invite = useServerFn(inviteUser);
  return useMutation({
    mutationFn: (vars: { email: string; fullName: string; role: AppRole }) => invite({ data: vars }),
    onSuccess: () => {
      toast.success("Invitation sent");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to invite"),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  const setRole = useServerFn(updateUserRole);
  return useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) => setRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteUser);
  return useMutation({
    mutationFn: (userId: string) => remove({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete user"),
  });
}
