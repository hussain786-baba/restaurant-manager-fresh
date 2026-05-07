import { useState } from "react";
import { Link } from "wouter";
import {
  useListAdminOrders,
  useUpdateOrderStatus,
  getListAdminOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ChevronRight, ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/Brand";
import { money, shortTime, timeAgo } from "@/lib/format";

const STATUSES = [
  { id: "all", label: "All orders" },
  { id: "placed", label: "Placed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served" },
  { id: "paid", label: "Paid" },
  { id: "cancelled", label: "Cancelled" },
] as const;

const NEXT: Record<string, string | null> = {
  placed: "preparing",
  preparing: "ready",
  ready: "served",
  served: "paid",
  paid: null,
  cancelled: null,
};

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const params = {
    status: status === "all" ? undefined : status,
    search: search || undefined,
  };
  const orders = useListAdminOrders(params, {
    query: {
      queryKey: getListAdminOrdersQueryKey(params),
      refetchInterval: 10000,
    },
  });
  const update = useUpdateOrderStatus();
  const qc = useQueryClient();

  async function advance(id: number, current: string) {
    const next = NEXT[current];
    if (!next) return;
    try {
      await update.mutateAsync({
        id,
        data: { status: next as "preparing" | "ready" | "served" | "paid" | "cancelled" | "placed" },
      });
      toast.success(`Order moved to ${next}.`);
      qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
    } catch {
      toast.error("Could not update.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="gold-stamp">The pass</span>
        <h1 className="font-display text-4xl mt-2">Orders</h1>
        <p className="text-ink-3 text-sm mt-1">
          Move tickets through the kitchen.
        </p>
      </div>

      <div className="paper-card p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or guest…"
            className="input-paper pl-9"
          />
        </div>
        <div className="overflow-x-auto -mx-1">
          <div className="flex gap-1 px-1 w-max">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                  status === s.id
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line text-ink-2"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[140px_1fr_140px_120px_120px_140px_50px] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-ink-3 border-b border-line bg-paper-2/40">
          <div>Code</div>
          <div>Items</div>
          <div>Table</div>
          <div>Status</div>
          <div className="text-right">Total</div>
          <div>Time</div>
          <div></div>
        </div>
        {orders.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : (orders.data?.length ?? 0) === 0 ? (
          <div className="text-center py-16">
            <div className="font-display text-2xl">No orders yet</div>
            <p className="text-ink-3 text-sm mt-2">
              Try simulating one from the dashboard.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.data?.map((o) => (
              <li
                key={o.id}
                className="md:grid md:grid-cols-[140px_1fr_140px_120px_120px_140px_50px] md:items-center gap-4 px-5 py-4 hover:bg-paper-2/30 transition-colors"
              >
                <div className="flex md:block items-center justify-between md:gap-0">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-sm font-semibold hover:underline"
                  >
                    {o.code}
                  </Link>
                  <span className="md:hidden">
                    <StatusPill status={o.status} />
                  </span>
                </div>
                <div className="text-sm text-ink-2 mt-1 md:mt-0 truncate">
                  {o.items
                    .map((i) => `${i.name} × ${i.quantity}`)
                    .join(" · ")}
                </div>
                <div className="text-sm mt-1 md:mt-0 text-ink-3">
                  {o.tableLabel}
                  {o.guestName ? (
                    <span className="block text-[11px] text-ink-4">
                      {o.guestName}
                    </span>
                  ) : null}
                </div>
                <div className="hidden md:block">
                  <StatusPill status={o.status} />
                </div>
                <div className="font-mono text-sm md:text-right mt-1 md:mt-0 numeric">
                  {money(o.total)}
                </div>
                <div className="text-[11px] text-ink-3 mt-1 md:mt-0">
                  <div>{shortTime(o.createdAt)}</div>
                  <div className="text-ink-4">{timeAgo(o.createdAt)}</div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 md:mt-0">
                  {NEXT[o.status] ? (
                    <button
                      type="button"
                      onClick={() => advance(o.id, o.status)}
                      className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-gold-3 hover:text-ink"
                      title={`Move to ${NEXT[o.status]}`}
                    >
                      {NEXT[o.status]} <ArrowRight size={11} />
                    </button>
                  ) : null}
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-paper-2 text-ink-3"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
