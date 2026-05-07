import { useParams, Link } from "wouter";
import {
  useGetCustomerOrder,
  getGetCustomerOrderQueryKey,
} from "@workspace/api-client-react";
import { Check } from "lucide-react";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { moneyPrecise } from "@/lib/format";
import { resetSessionId } from "@/lib/session";

export default function PaidPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const orderQ = useGetCustomerOrder(id, {
    query: { queryKey: getGetCustomerOrderQueryKey(id), enabled: id > 0 },
  });
  const order = orderQ.data;

  return (
    <CustomerShell header={<CustomerHeader title="Settled" />}>
      <div className="text-center py-12 fade-in">
        <div className="mx-auto h-20 w-20 rounded-full bg-sage flex items-center justify-center text-paper">
          <Check size={36} strokeWidth={2.5} />
        </div>
        <div className="font-display text-3xl mt-6">Thank you.</div>
        <p className="text-ink-3 text-sm mt-2 max-w-[300px] mx-auto">
          Your bill is settled. We hope you enjoyed every bite.
        </p>

        {order ? (
          <div className="paper-card p-5 mt-8 mx-auto max-w-[320px] text-left">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4">
              Receipt
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-sm">{order.code}</span>
              <span className="text-xs text-ink-3">{order.tableLabel}</span>
            </div>
            <div className="gold-divider my-3" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-3">Total paid</span>
              <span className="font-mono numeric text-xl font-semibold">
                {moneyPrecise(order.total)}
              </span>
            </div>
            <div className="text-[11px] text-ink-4 mt-1 text-right capitalize">
              via {order.paymentMethod}
            </div>
          </div>
        ) : null}

        <div className="mt-10 space-y-3">
          <Link
            href="/menu"
            className="btn-gold inline-block rounded-full px-6 py-3 text-sm font-semibold"
            onClick={() => resetSessionId()}
          >
            Place another order
          </Link>
          <div>
            <Link
              href="/history"
              className="text-[12px] uppercase tracking-wider text-ink-3 hover:text-ink"
            >
              See order history
            </Link>
          </div>
        </div>

        <p className="mt-12 text-[12px] italic text-ink-4">
          “To eat is a necessity, but to eat intelligently is an art.”
        </p>
      </div>
    </CustomerShell>
  );
}
