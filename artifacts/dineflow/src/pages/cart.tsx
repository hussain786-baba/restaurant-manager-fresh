import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Trash2, Users, ShoppingBag } from "lucide-react";
import {
  useCreateCustomerOrder,
  getGetOrdersBySessionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { MenuTile } from "@/components/MenuTile";
import { QtyStepper } from "@/components/QtyStepper";
import { VegDot } from "@/components/Brand";
import { useCart } from "@/lib/cart";
import { getSessionId, getTableCode, resetSessionId } from "@/lib/session";
import { money, moneyPrecise } from "@/lib/format";

const TAX_RATE = 0.05;

export default function CartPage() {
  const [, setLoc] = useLocation();
  const cart = useCart();
  const subtotal = cart.subtotal();
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const tableCode = getTableCode();
  const qc = useQueryClient();
  const placeOrder = useCreateCustomerOrder();
  const [submitting, setSubmitting] = useState(false);

  async function place() {
    if (!tableCode) {
      toast.error("Please pick a table first.");
      setLoc("/");
      return;
    }
    if (cart.lines.length === 0) {
      toast.error("Add a few dishes to your cart.");
      return;
    }
    setSubmitting(true);
    try {
      const sessionId = getSessionId();
      const order = await placeOrder.mutateAsync({
        data: {
          tableCode,
          sessionId,
          guestName: cart.guestName || undefined,
          guestCount: cart.guestCount,
          items: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            specialInstructions: l.specialInstructions || undefined,
          })),
        },
      });
      cart.clear();
      qc.invalidateQueries({
        queryKey: getGetOrdersBySessionQueryKey(sessionId),
      });
      toast.success("Order placed. Sending it to the kitchen.");
      setLoc(`/order/${order.id}`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Could not place order.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <CustomerShell
        header={<CustomerHeader back="/menu" title="Your order" />}
      >
        <div className="text-center py-20">
          <div className="mx-auto h-14 w-14 rounded-full bg-paper-2 hairline flex items-center justify-center">
            <ShoppingBag size={22} className="text-ink-3" />
          </div>
          <div className="font-display text-2xl mt-5">Cart is empty</div>
          <p className="text-ink-3 text-sm mt-2 max-w-[260px] mx-auto">
            Add a few dishes from the menu and they'll show up here.
          </p>
          <Link
            href="/menu"
            className="btn-gold inline-block mt-6 rounded-full px-6 py-2.5"
          >
            Browse the menu
          </Link>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell
      header={
        <CustomerHeader
          back="/menu"
          title="Your order"
          subtitle={tableCode ? `Table ${tableCode}` : undefined}
        />
      }
    >
      <ul className="divide-y divide-line">
        {cart.lines.map((l) => (
          <li key={l.menuItemId} className="py-4 flex gap-4 items-start">
            <MenuTile glyph={l.imageEmoji} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <VegDot isVeg={l.isVeg} />
                <span className="font-medium text-[15px] truncate">
                  {l.name}
                </span>
              </div>
              <div className="text-xs text-ink-4 mt-0.5">
                <span className="font-mono">{money(l.price)}</span> each
              </div>
              <textarea
                placeholder="Special instructions (optional)"
                value={l.specialInstructions}
                onChange={(e) => cart.setNotes(l.menuItemId, e.target.value)}
                className="input-paper text-xs mt-2 min-h-[44px] resize-none"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <QtyStepper
                value={l.quantity}
                onChange={(n) => cart.setQty(l.menuItemId, n)}
              />
              <div className="font-mono numeric text-sm font-semibold">
                {money(l.price * l.quantity)}
              </div>
              <button
                type="button"
                onClick={() => cart.remove(l.menuItemId)}
                className="text-ink-4 hover:text-crimson"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="paper-card p-4 mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-3">
          Guest details
        </div>
        <div className="space-y-3">
          <input
            placeholder="Your name (optional)"
            value={cart.guestName}
            onChange={(e) => cart.setGuestName(e.target.value)}
            className="input-paper"
          />
          <div className="flex items-center justify-between bg-paper-2 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-ink-3" />
              <span className="text-sm">Number of diners</span>
            </div>
            <QtyStepper
              value={cart.guestCount}
              onChange={(n) => cart.setGuestCount(n)}
              small
            />
          </div>
        </div>
      </div>

      <div className="paper-card p-4 mt-4">
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={moneyPrecise(subtotal)} />
          <Row label="GST (5%)" value={moneyPrecise(tax)} />
          <div className="gold-divider my-2" />
          <Row
            label="Total"
            value={moneyPrecise(total)}
            bold
          />
        </div>
        <p className="text-[11px] text-ink-4 mt-3 italic">
          Tip can be added when you settle the bill.
        </p>
      </div>

      <button
        type="button"
        onClick={place}
        disabled={submitting}
        className="btn-gold w-full rounded-2xl py-4 mt-5 text-base font-semibold disabled:opacity-60"
      >
        {submitting ? "Sending to kitchen…" : `Place order · ${money(total)}`}
      </button>

      <button
        type="button"
        onClick={() => {
          cart.clear();
          resetSessionId();
        }}
        className="block mx-auto mt-4 text-[11px] uppercase tracking-wider text-ink-4 hover:text-ink-3"
      >
        Clear cart
      </button>
    </CustomerShell>
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
      <span
        className={
          bold
            ? "font-display text-lg"
            : "text-ink-3"
        }
      >
        {label}
      </span>
      <span
        className={`font-mono numeric ${
          bold ? "text-lg font-semibold" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
