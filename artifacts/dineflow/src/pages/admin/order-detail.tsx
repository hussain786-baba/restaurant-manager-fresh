import { useParams, Link } from "wouter";
import {
  useGetAdminOrder,
  useUpdateOrderStatus,
  getGetAdminOrderQueryKey,
  getListAdminOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Check } from "lucide-react";
import { MenuTile } from "@/components/MenuTile";
import { StatusPill } from "@/components/Brand";
import { money, moneyPrecise, shortTime } from "@/lib/format";

const FLOW = ["placed", "preparing", "ready", "served", "paid"] as const;

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const orderQ = useGetAdminOrder(id, {
    query: {
      queryKey: getGetAdminOrderQueryKey(id),
      refetchInterval: 8000,
      enabled: id > 0,
    },
  });
  const update = useUpdateOrderStatus();
  const qc = useQueryClient();

  async function setStatus(s: (typeof FLOW)[number] | "cancelled") {
    try {
      await update.mutateAsync({ id, data: { status: s } });
      qc.invalidateQueries({ queryKey: getGetAdminOrderQueryKey(id) });
      qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
      toast.success(`Updated to ${s}`);
    } catch {
      toast.error("Could not update.");
    }
  }

  if (orderQ.isLoading || !orderQ.data) {
    return <div className="skeleton h-72" />;
  }
  const order = orderQ.data;
  const idx = FLOW.indexOf(order.status as (typeof FLOW)[number]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink"
      >
        <ChevronLeft size={14} /> All orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl">Order {order.code}</span>
            <StatusPill status={order.status} />
          </div>
          <p className="text-ink-3 text-sm mt-1">
            {order.tableLabel}
            <span className="divider-dot" />
            placed {shortTime(order.createdAt)}
            {order.guestName ? (
              <>
                <span className="divider-dot" /> {order.guestName}
              </>
            ) : null}
            {order.guestCount ? (
              <>
                <span className="divider-dot" /> {order.guestCount} diners
              </>
            ) : null}
          </p>
        </div>
        <div className="font-display text-4xl numeric">
          {moneyPrecise(order.total)}
        </div>
      </div>

      <div className="paper-card p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-4">
          Move ticket
        </div>
        <div className="flex flex-wrap gap-2">
          {FLOW.map((s, i) => {
            const done = i <= idx && order.status !== "cancelled";
            const next = i === idx + 1;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                disabled={i < idx || order.status === "cancelled"}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                  done
                    ? "bg-sage/10 border-sage text-sage"
                    : next
                    ? "bg-ink text-paper border-ink hover:bg-ink-2"
                    : "bg-white text-ink-3 border-line hover:border-gold"
                }`}
              >
                {done ? <Check size={11} className="inline mr-1" /> : null}
                {s}
              </button>
            );
          })}
          {order.status !== "paid" && order.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setStatus("cancelled")}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-crimson/30 text-crimson hover:bg-crimson/5"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="paper-card p-5 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">
            Items
          </div>
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="py-3 flex items-start gap-4">
                <MenuTile glyph={it.imageEmoji} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px]">
                    {it.name}{" "}
                    <span className="text-ink-4 font-mono ml-1">
                      × {it.quantity}
                    </span>
                  </div>
                  {it.specialInstructions ? (
                    <div className="text-xs text-warm-orange italic mt-1 bg-paper-2 px-2 py-1 rounded inline-block">
                      “{it.specialInstructions}”
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold">
                    {money(it.lineTotal)}
                  </div>
                  <div className="text-[11px] text-ink-4 font-mono">
                    {money(it.unitPrice)} ea
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-card p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">
            Bill
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={moneyPrecise(order.subtotal)} />
            <Row label="GST (5%)" value={moneyPrecise(order.tax)} />
            <Row label="Tip" value={moneyPrecise(order.tip)} />
            <div className="gold-divider my-3" />
            <Row
              label="Total"
              value={moneyPrecise(order.total)}
              bold
            />
          </div>
          {order.paymentMethod ? (
            <div className="mt-4 text-[11px] text-ink-4 capitalize">
              Paid via {order.paymentMethod}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-display text-lg" : "text-ink-3"}>
        {label}
      </span>
      <span
        className={`font-mono numeric ${bold ? "text-lg font-semibold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
