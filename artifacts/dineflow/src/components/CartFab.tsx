import { Link, useLocation } from "wouter";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export function CartFab() {
  const [loc] = useLocation();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart((s) => s.subtotal());
  const qty = useCart((s) => s.totalQty());
  if (qty === 0) return null;
  if (loc.startsWith("/cart") || loc.startsWith("/order/")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-3 pointer-events-none">
      <div className="mx-auto max-w-[460px] pointer-events-auto">
        <Link
          href="/cart"
          className="btn-gold flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
              <ShoppingBag size={16} />
            </span>
            <span className="font-medium">
              {qty} {qty === 1 ? "item" : "items"} · {lines.length} dishes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold numeric">
              {money(subtotal)}
            </span>
            <span className="text-xs uppercase tracking-wider opacity-80">
              View cart →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
