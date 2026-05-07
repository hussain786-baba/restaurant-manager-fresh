import { useParams, Link } from "wouter";
import {
  useGetCustomerOrder,
  useCallWaiter,
  getGetCustomerOrderQueryKey,
} from "@workspace/api-client-react";
import { Bell, Check, ChefHat, Clock, Receipt, Soup } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { MenuTile } from "@/components/MenuTile";
import { StatusPill } from "@/components/Brand";
import { money, shortTime } from "@/lib/format";

const STEPS = [
  { key: "placed", label: "Order placed", icon: Receipt },
  { key: "preparing", label: "In the kitchen", icon: ChefHat },
  { key: "ready", label: "Ready to serve", icon: Soup },
  { key: "served", label: "On your table", icon: Check },
];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const orderQ = useGetCustomerOrder(id, {
    query: {
      queryKey: getGetCustomerOrderQueryKey(id),
      refetchInterval: 5000,
      enabled: id > 0,
    },
  });
  const callWaiter = useCallWaiter();

  if (orderQ.isLoading) {
    return (
      <CustomerShell header={<CustomerHeader back="/menu" title="Your order" />}>
        <div className="space-y-3 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      </CustomerShell>
    );
  }

  if (orderQ.isError || !orderQ.data) {
    return (
      <CustomerShell header={<CustomerHeader back="/menu" title="Your order" />}>
        <div className="text-center py-20">
          <div className="font-display text-2xl">Order not found</div>
          <Link
            href="/menu"
            className="btn-ink inline-block mt-5 rounded-full px-5 py-2 text-sm"
          >
            Back to menu
          </Link>
        </div>
      </CustomerShell>
    );
  }

  const order = orderQ.data;
  const currentIdx =
    order.status === "paid"
      ? STEPS.length
      : Math.max(
          0,
          STEPS.findIndex((s) => s.key === order.status),
        );

  async function ring() {
    try {
      await callWaiter.mutateAsync({ id });
      toast.success("Waiter is on the way.");
    } catch {
      toast.error("Could not call waiter. Please try again.");
    }
  }

  return (
    <CustomerShell
      header={
        <CustomerHeader
          back="/menu"
          title={`Order ${order.code}`}
          subtitle={`${order.tableLabel} · placed at ${shortTime(order.createdAt)}`}
          right={<StatusPill status={order.status} />}
        />
      }
    >
      <div className="paper-card p-5 mt-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4">
          Live progress
        </div>
        <div className="mt-3">
          {STEPS.map((step, i) => {
            const done = i < currentIdx || order.status === "paid";
            const active = i === currentIdx && order.status !== "paid";
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={`timeline-step ${done ? "done" : ""}`}
              >
                <div
                  className={`timeline-dot ${
                    done ? "done" : active ? "active" : ""
                  }`}
                >
                  <Icon size={12} />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm ${
                      done || active ? "font-medium" : "text-ink-3"
                    }`}
                  >
                    {step.label}
                  </div>
                  {active ? (
                    <div className="text-[11px] text-ink-4 mt-0.5 inline-flex items-center gap-1">
                      <Clock size={10} className="animate-pulse" />
                      In progress…
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(order.status === "ready" || order.status === "served") && (
        <Link
          href={`/order/${order.id}/bill`}
          className="btn-gold w-full rounded-2xl py-4 mt-5 text-base font-semibold inline-flex items-center justify-center gap-2"
        >
          <Receipt size={18} /> View bill & pay
        </Link>
      )}

      <div className="paper-card p-5 mt-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-3">
          Items ordered
        </div>
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex items-start gap-3">
              <MenuTile glyph={it.imageEmoji} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {it.name}{" "}
                  <span className="text-ink-4 font-mono ml-1">
                    × {it.quantity}
                  </span>
                </div>
                {it.specialInstructions ? (
                  <div className="text-[11px] text-ink-3 italic mt-0.5">
                    “{it.specialInstructions}”
                  </div>
                ) : null}
              </div>
              <div className="font-mono text-sm">{money(it.lineTotal)}</div>
            </li>
          ))}
        </ul>
        <div className="gold-divider my-3" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-3">Subtotal</span>
          <span className="font-mono">{money(order.subtotal)}</span>
        </div>
      </div>

      {order.status !== "paid" && (
        <button
          type="button"
          onClick={ring}
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 btn-ink rounded-full px-6 py-3 text-sm shadow-lg inline-flex items-center gap-2"
        >
          <Bell size={16} /> Call waiter
        </button>
      )}

      {order.status === "paid" && (
        <Link
          href="/menu"
          className="btn-ink w-full rounded-2xl py-4 mt-5 text-base inline-flex items-center justify-center"
        >
          Place another order
        </Link>
      )}
    </CustomerShell>
  );
}
