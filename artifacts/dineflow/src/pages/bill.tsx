import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetCustomerOrder,
  usePayOrder,
  useCallWaiter,
  getGetCustomerOrderQueryKey,
} from "@workspace/api-client-react";
import { CreditCard, Wallet, Smartphone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { money, moneyPrecise } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIPS: { value: number; label: string }[] = [
  { value: 0, label: "None" },
  { value: 0.05, label: "5%" },
  { value: 0.1, label: "10%" },
  { value: 0.15, label: "15%" },
];

const METHODS = [
  { id: "upi" as const, label: "UPI", icon: Smartphone, hint: "GPay, PhonePe, Paytm" },
  { id: "card" as const, label: "Card", icon: CreditCard, hint: "Tap or insert" },
  { id: "cash" as const, label: "Cash", icon: Wallet, hint: "Pay at counter" },
];

export default function BillPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, setLoc] = useLocation();
  const orderQ = useGetCustomerOrder(id, {
    query: { queryKey: getGetCustomerOrderQueryKey(id), enabled: id > 0 },
  });
  const pay = usePayOrder();
  const callWaiter = useCallWaiter();
  const [tipPct, setTipPct] = useState<number>(0.1);
  const [customTip, setCustomTip] = useState<string>("");
  const [method, setMethod] = useState<"upi" | "card" | "cash">("upi");
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (orderQ.isLoading || !orderQ.data) {
    return (
      <CustomerShell header={<CustomerHeader back={`/order/${id}`} title="Bill" />}>
        <div className="skeleton h-72 mt-4" />
      </CustomerShell>
    );
  }
  const order = orderQ.data;
  if (order.status === "paid") {
    setLoc(`/order/${id}/paid`);
    return null;
  }

  const subtotal = order.subtotal;
  const tax = order.tax;
  const tip =
    customTip !== ""
      ? Math.max(0, Number(customTip) || 0)
      : Math.round(subtotal * tipPct * 100) / 100;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;

  async function payNow() {
    try {
      await pay.mutateAsync({ id, data: { method, tip } });
      toast.success("Payment received. Thank you for dining.");
      setLoc(`/order/${id}/paid`);
    } catch {
      toast.error("Payment failed. Please try again.");
    }
  }

  async function leaveWithoutPaying() {
    try {
      await callWaiter.mutateAsync({ id });
    } catch {
      // ignore
    }
    toast.message("Manager has been notified.", {
      description: "Please wait at the table.",
    });
    setConfirmLeave(false);
  }

  return (
    <CustomerShell
      header={
        <CustomerHeader
          back={`/order/${id}`}
          title="The bill"
          subtitle={`Order ${order.code} · ${order.tableLabel}`}
        />
      }
    >
      <div className="paper-card p-5 mt-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-3">
          Itemised
        </div>
        <ul className="space-y-2 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3">
              <span className="truncate">
                <span className="text-ink-2">{it.name}</span>
                <span className="text-ink-4 ml-2 font-mono">× {it.quantity}</span>
              </span>
              <span className="font-mono">{money(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="gold-divider my-4" />
        <div className="space-y-1.5 text-sm">
          <Row label="Subtotal" value={moneyPrecise(subtotal)} />
          <Row label="GST (5%)" value={moneyPrecise(tax)} />
          {tip > 0 && <Row label="Tip" value={moneyPrecise(tip)} />}
        </div>
        <div className="gold-divider my-3" />
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl">Total</span>
          <span className="font-mono numeric text-2xl font-semibold">
            {moneyPrecise(total)}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-2">
          Tip the team
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TIPS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setTipPct(t.value);
                setCustomTip("");
              }}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                customTip === "" && tipPct === t.value
                  ? "bg-ink text-paper border-ink"
                  : "bg-white border-line text-ink-2 hover:border-gold"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Custom amount (₹)"
          value={customTip}
          onChange={(e) => setCustomTip(e.target.value)}
          className="input-paper mt-2"
        />
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-2">
          How are you paying?
        </div>
        <div className="space-y-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const selected = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-2xl p-4 border transition-colors ${
                  selected
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line hover:border-gold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      selected ? "bg-gold text-ink" : "bg-paper-2 text-ink-2"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{m.label}</div>
                    <div
                      className={`text-[11px] ${
                        selected ? "text-paper/70" : "text-ink-4"
                      }`}
                    >
                      {m.hint}
                    </div>
                  </div>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 ${
                    selected ? "bg-gold border-gold" : "border-line-2"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={payNow}
        disabled={pay.isPending}
        className="btn-gold w-full rounded-2xl py-4 mt-6 text-base font-semibold disabled:opacity-60"
      >
        {pay.isPending ? "Processing…" : `Pay ${moneyPrecise(total)}`}
      </button>

      <button
        type="button"
        onClick={() => setConfirmLeave(true)}
        className="block mx-auto mt-4 text-[11px] uppercase tracking-wider text-crimson/80 hover:text-crimson"
      >
        Leave without paying
      </button>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl flex items-center gap-2">
              <AlertTriangle size={18} className="text-crimson" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Walking out without paying is a serious matter. We'll alert a
              manager — please remain at your table until they arrive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-crimson hover:bg-crimson/90"
              onClick={leaveWithoutPaying}
            >
              Notify manager
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-[11px] text-ink-4 text-center mt-6 italic">
        Need anything else?{" "}
        <Link
          href={`/order/${id}`}
          className="underline underline-offset-2 hover:text-ink"
        >
          Back to order
        </Link>
      </p>
    </CustomerShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
