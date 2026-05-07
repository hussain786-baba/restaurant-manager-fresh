import { Link } from "wouter";
import { ScrollText } from "lucide-react";
import { useGetOrdersBySession } from "@workspace/api-client-react";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { StatusPill } from "@/components/Brand";
import { getSessionId } from "@/lib/session";
import { money, timeAgo } from "@/lib/format";

export default function HistoryPage() {
  const sessionId = getSessionId();
  const ordersQ = useGetOrdersBySession(sessionId);
  const orders = ordersQ.data ?? [];

  return (
    <CustomerShell
      header={<CustomerHeader back="/menu" title="Your orders" />}
    >
      {ordersQ.isLoading ? (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto h-14 w-14 rounded-full bg-paper-2 hairline flex items-center justify-center">
            <ScrollText size={22} className="text-ink-3" />
          </div>
          <div className="font-display text-2xl mt-5">No orders yet</div>
          <p className="text-ink-3 text-sm mt-2 max-w-[260px] mx-auto">
            Once you place an order this session, it'll appear here.
          </p>
          <Link
            href="/menu"
            className="btn-ink inline-block mt-6 rounded-full px-5 py-2 text-sm"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="space-y-3 mt-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={
                  o.status === "paid"
                    ? `/order/${o.id}/paid`
                    : `/order/${o.id}`
                }
                className="paper-card p-4 block hover:border-gold transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-mono text-sm">{o.code}</div>
                  <StatusPill status={o.status} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="text-xs text-ink-3">
                    {o.tableLabel}
                    <span className="divider-dot" />
                    {timeAgo(o.createdAt)}
                  </div>
                  <div className="font-mono numeric font-semibold">
                    {money(o.total)}
                  </div>
                </div>
                <div className="text-[11px] text-ink-4 mt-1 truncate">
                  {o.items
                    .map((i) => `${i.name} × ${i.quantity}`)
                    .join("  ·  ")}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CustomerShell>
  );
}
