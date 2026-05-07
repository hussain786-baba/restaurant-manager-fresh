import { useEffect, useState } from "react";
import {
  useListStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useGetMe,
  getListStaffQueryKey,
} from "@workspace/api-client-react";
import type { StaffUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Crown, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminStaffPage() {
  const me = useGetMe();
  const staff = useListStaff();
  const [editing, setEditing] = useState<StaffUser | "new" | null>(null);
  const isSuper = me.data?.user?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="gold-stamp">The team</span>
          <h1 className="font-display text-4xl mt-2">Staff</h1>
          <p className="text-ink-3 text-sm mt-1">
            People with access to the dashboard.
          </p>
        </div>
        {isSuper ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="btn-gold rounded-full px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Plus size={14} /> Invite staff
          </button>
        ) : (
          <div className="text-xs text-ink-3 inline-flex items-center gap-2 paper-card px-3 py-2">
            <ShieldAlert size={13} /> Read-only · super admin can manage staff
          </div>
        )}
      </div>

      <div className="paper-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_240px_140px_60px] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-ink-3 border-b border-line bg-paper-2/40">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div></div>
        </div>
        <ul className="divide-y divide-line">
          {staff.data?.map((u) => (
            <li
              key={u.id}
              className="md:grid md:grid-cols-[1fr_240px_140px_60px] md:items-center gap-4 px-5 py-4 hover:bg-paper-2/30"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gold/15 text-gold-3 flex items-center justify-center font-semibold text-sm">
                  {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="font-medium">{u.name}</div>
              </div>
              <div className="text-sm text-ink-3 font-mono mt-1 md:mt-0 truncate">
                {u.email}
              </div>
              <div className="mt-1 md:mt-0">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] uppercase tracking-wider ${
                    u.role === "super_admin"
                      ? "bg-gold/15 text-gold-3 border border-gold/30"
                      : "bg-paper-2 text-ink-3"
                  }`}
                >
                  {u.role === "super_admin" ? <Crown size={10} /> : null}
                  {u.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center md:justify-end gap-2 mt-2 md:mt-0">
                {isSuper && (
                  <button
                    type="button"
                    onClick={() => setEditing(u)}
                    className="text-ink-4 hover:text-ink"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <StaffDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function StaffDialog({
  editing,
  onClose,
}: {
  editing: StaffUser | "new" | null;
  onClose: () => void;
}) {
  const isNew = editing === "new";
  const u = isNew ? null : editing;
  const [name, setName] = useState(u?.name ?? "");
  const [email, setEmail] = useState(u?.email ?? "");
  const [role, setRole] = useState<"manager" | "super_admin">(
    (u?.role as "manager" | "super_admin") ?? "manager",
  );
  const [password, setPassword] = useState("");

  const create = useCreateStaff();
  const update = useUpdateStaff();
  const del = useDeleteStaff();
  const qc = useQueryClient();

  useEffect(() => {
    setName(u?.name ?? "");
    setEmail(u?.email ?? "");
    setRole((u?.role as "manager" | "super_admin") ?? "manager");
    setPassword("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  async function save() {
    try {
      if (isNew) {
        if (!password) {
          toast.error("Password is required.");
          return;
        }
        await create.mutateAsync({
          data: { email, name, role, password },
        });
        toast.success("Staff invited.");
      } else if (u) {
        await update.mutateAsync({
          id: u.id,
          data: { name, role, ...(password ? { password } : {}) },
        });
        toast.success("Staff updated.");
      }
      qc.invalidateQueries({ queryKey: getListStaffQueryKey() });
      onClose();
    } catch {
      toast.error("Could not save.");
    }
  }

  async function remove() {
    if (!u) return;
    if (!confirm(`Remove ${u.name}'s access?`)) return;
    try {
      await del.mutateAsync({ id: u.id });
      qc.invalidateQueries({ queryKey: getListStaffQueryKey() });
      toast.success("Staff removed.");
      onClose();
    } catch {
      toast.error("Could not delete.");
    }
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isNew ? "Invite staff" : `Edit ${u?.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              Name
            </div>
            <input
              className="input-paper"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              Email
            </div>
            <input
              type="email"
              disabled={!isNew}
              className="input-paper"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              Role
            </div>
            <select
              className="input-paper"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "manager" | "super_admin")
              }
            >
              <option value="manager">Manager</option>
              <option value="super_admin">Super admin</option>
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              {isNew ? "Password" : "New password (optional)"}
            </div>
            <input
              type="password"
              className="input-paper"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="text-crimson text-sm hover:underline inline-flex items-center gap-1"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm hover:bg-paper-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn-gold rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {isNew ? "Send invite" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
