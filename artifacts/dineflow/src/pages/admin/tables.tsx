import { useEffect, useState } from "react";
import {
  useListTables,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useMarkTableClean,
  getListTablesQueryKey,
  getGetTablesOverviewQueryKey,
} from "@workspace/api-client-react";
import type { Table } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/Brand";

function customerUrlFor(code: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}menu?t=${encodeURIComponent(code)}`;
  return base;
}

function qrUrl(code: string, size = 240): string {
  const data = encodeURIComponent(customerUrlFor(code));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}&bgcolor=FEFCF8&color=0D0B0A&qzone=2`;
}

export default function AdminTablesPage() {
  const tables = useListTables();
  const [editing, setEditing] = useState<Table | "new" | null>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const markClean = useMarkTableClean();
  const qc = useQueryClient();

  async function clean(t: Table) {
    try {
      await markClean.mutateAsync({ id: t.id });
      toast.success(`${t.label} marked clean.`);
      qc.invalidateQueries({ queryKey: getListTablesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTablesOverviewQueryKey() });
    } catch {
      toast.error("Could not update.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="gold-stamp">Floor</span>
          <h1 className="font-display text-4xl mt-2">Tables</h1>
          <p className="text-ink-3 text-sm mt-1">
            Manage seating, generate QR codes, mark tables clean.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="btn-gold rounded-full px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <Plus size={14} /> New table
        </button>
      </div>

      {tables.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {tables.data?.map((t) => (
            <article
              key={t.id}
              className="paper-card p-4 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-2xl">{t.label}</div>
                  <div className="font-mono text-[11px] text-ink-4 uppercase">
                    {t.code} · seats {t.capacity}
                  </div>
                </div>
                <StatusPill status={t.status} />
              </div>
              <button
                type="button"
                onClick={() => setQrTable(t)}
                className="mt-4 mx-auto bg-paper-2 rounded-xl p-3 hairline hover:border-gold transition-colors"
              >
                <img
                  src={qrUrl(t.code, 140)}
                  alt={`QR for ${t.label}`}
                  width={140}
                  height={140}
                  className="block"
                />
              </button>
              {t.notes && (
                <div className="text-[11px] italic text-ink-3 mt-3 text-center">
                  “{t.notes}”
                </div>
              )}
              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => clean(t)}
                  className="text-[11px] uppercase tracking-wider text-gold-3 hover:text-ink inline-flex items-center gap-1"
                >
                  <Sparkles size={11} /> Clean
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(t)}
                    className="text-ink-4 hover:text-ink"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <TableDialog editing={editing} onClose={() => setEditing(null)} />
      <QrDialog table={qrTable} onClose={() => setQrTable(null)} />
    </div>
  );
}

function TableDialog({
  editing,
  onClose,
}: {
  editing: Table | "new" | null;
  onClose: () => void;
}) {
  const isNew = editing === "new";
  const t = isNew ? null : editing;
  const [code, setCode] = useState(t?.code ?? "");
  const [label, setLabel] = useState(t?.label ?? "");
  const [capacity, setCapacity] = useState(t?.capacity ?? 2);
  const [notes, setNotes] = useState(t?.notes ?? "");

  const create = useCreateTable();
  const update = useUpdateTable();
  const del = useDeleteTable();
  const qc = useQueryClient();

  useEffect(() => {
    setCode(t?.code ?? "");
    setLabel(t?.label ?? "");
    setCapacity(t?.capacity ?? 2);
    setNotes(t?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  async function save() {
    try {
      const payload = { code: code.trim(), label, capacity, notes };
      if (isNew) {
        await create.mutateAsync({ data: payload });
        toast.success("Table added.");
      } else if (t) {
        await update.mutateAsync({ id: t.id, data: payload });
        toast.success("Table updated.");
      }
      qc.invalidateQueries({ queryKey: getListTablesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTablesOverviewQueryKey() });
      onClose();
    } catch {
      toast.error("Could not save.");
    }
  }

  async function remove() {
    if (!t) return;
    if (!confirm(`Delete ${t.label}?`)) return;
    try {
      await del.mutateAsync({ id: t.id });
      qc.invalidateQueries({ queryKey: getListTablesQueryKey() });
      toast.success("Table removed.");
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
            {isNew ? "New table" : `Edit ${t?.label}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
                Code
              </div>
              <input
                className="input-paper font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label>
              <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
                Label
              </div>
              <input
                className="input-paper"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
          </div>
          <label>
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              Capacity
            </div>
            <input
              type="number"
              className="input-paper"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-1">
              Notes
            </div>
            <input
              className="input-paper"
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. by the window, near the bar"
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
              <Trash2 size={14} /> Delete
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
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrDialog({
  table,
  onClose,
}: {
  table: Table | null;
  onClose: () => void;
}) {
  if (!table) {
    return (
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }
  const customerUrl = customerUrlFor(table.code);
  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            QR for {table.label}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <img
            src={qrUrl(table.code, 320)}
            alt={`QR for ${table.label}`}
            width={320}
            height={320}
            className="mx-auto block hairline rounded-2xl"
          />
          <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Customer URL
          </div>
          <div className="font-mono text-xs mt-1 break-all px-4">
            {customerUrl}
          </div>
        </div>
        <DialogFooter>
          <a
            href={qrUrl(table.code, 600)}
            download={`${table.code}.png`}
            target="_blank"
            rel="noreferrer"
            className="btn-gold rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Download size={14} /> Download PNG
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
