import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, X, Clock, Award } from "lucide-react";
import { useGetCustomerMenu } from "@workspace/api-client-react";
import type { MenuItem } from "@workspace/api-client-react";
import { CustomerShell, CustomerHeader } from "@/components/CustomerShell";
import { MenuTile } from "@/components/MenuTile";
import { QtyStepper } from "@/components/QtyStepper";
import { VegDot } from "@/components/Brand";
import { CartFab } from "@/components/CartFab";
import { useCart } from "@/lib/cart";
import {
  getTableCode,
  setTableCode,
  clearTableCode,
} from "@/lib/session";
import { money } from "@/lib/format";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function MenuPage() {
  const [, setLoc] = useLocation();
  const [tableCode, setTableCodeState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [vegOnly, setVegOnly] = useState(false);

  const cart = useCart();
  const menu = useGetCustomerMenu();

  // Handle ?t= param + persisted table code
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("t");
    if (t) {
      setTableCode(t);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
    const persisted = getTableCode();
    if (!persisted) {
      setLoc("/");
      return;
    }
    setTableCodeState(persisted);
  }, [setLoc]);

  const items = menu.data?.items ?? [];
  const categories = menu.data?.categories ?? [];

  const filtered = useMemo(() => {
    let list = items;
    if (vegOnly) list = list.filter((i) => i.isVeg);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q),
      );
    }
    if (activeCat) list = list.filter((i) => i.categoryId === activeCat);
    return list;
  }, [items, search, activeCat, vegOnly]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof items>();
    for (const it of filtered) {
      if (!map.has(it.categoryId)) map.set(it.categoryId, []);
      map.get(it.categoryId)!.push(it);
    }
    return categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, items: map.get(c.id) ?? [] }));
  }, [filtered, categories]);

  function getQty(id: number): number {
    return cart.lines.find((l) => l.menuItemId === id)?.quantity ?? 0;
  }

  function changeQty(item: MenuItem, qty: number) {
    if (qty <= 0) {
      cart.remove(item.id);
      return;
    }
    if (getQty(item.id) === 0) {
      cart.add({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageEmoji: item.imageEmoji ?? null,
        isVeg: item.isVeg,
        quantity: qty,
        specialInstructions: "",
      });
    } else {
      cart.setQty(item.id, qty);
    }
  }

  return (
    <CustomerShell
      header={
        <CustomerHeader
          back="/"
          title="The menu"
          subtitle={
            tableCode ? (
              <>
                Seated at{" "}
                <span className="font-mono text-ink">{tableCode}</span>{" "}
                <button
                  type="button"
                  className="ml-2 text-[10px] uppercase tracking-wider text-gold-3 hover:underline"
                  onClick={() => {
                    clearTableCode();
                    setLoc("/");
                  }}
                >
                  change
                </button>
              </>
            ) as unknown as string : "Pick a table to begin"
          }
          right={
            <Link
              href="/history"
              className="text-[11px] uppercase tracking-[0.16em] text-ink-3 hover:text-ink"
            >
              History
            </Link>
          }
        />
      }
    >
      {/* Search + filters */}
      <div className="sticky top-[64px] z-20 -mx-5 bg-paper/95 backdrop-blur-sm pt-3 pb-2 px-5">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes, ingredients…"
            className="input-paper pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="mt-3 -mx-5 px-5 overflow-x-auto scroll-x-snap">
          <div className="flex gap-2 pb-1 w-max">
            <button
              type="button"
              onClick={() => setActiveCat(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                activeCat === null
                  ? "bg-ink text-paper border-ink"
                  : "bg-white border-line text-ink-2"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setActiveCat(activeCat === c.id ? null : c.id)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                  activeCat === c.id
                    ? "bg-ink text-paper border-ink"
                    : "bg-white border-line text-ink-2"
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setVegOnly(!vegOnly)}
              className={`ml-1 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap inline-flex items-center gap-1.5 ${
                vegOnly
                  ? "bg-sage/10 border-sage text-sage"
                  : "bg-white border-line text-ink-2"
              }`}
            >
              <span className="dot-veg" /> Veg only
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      {menu.isLoading ? (
        <div className="space-y-4 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-[88px]" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20">
          <div className="font-display text-2xl">Nothing matches</div>
          <p className="text-ink-3 text-sm mt-2">Try a different search.</p>
        </div>
      ) : (
        <div className="space-y-8 mt-4">
          {grouped.map(({ category, items }) => (
            <section key={category.id}>
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-display text-2xl">{category.name}</h2>
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-4">
                  {items.length} dishes
                </span>
              </div>
              {category.description && (
                <p className="text-xs text-ink-3 italic mb-3">
                  {category.description}
                </p>
              )}
              <div className="gold-divider mb-2" />
              <ul className="divide-y divide-line">
                {items.map((it) => {
                  const qty = getQty(it.id);
                  return (
                    <li
                      key={it.id}
                      className="py-4 flex gap-4 items-start cursor-pointer hover:bg-paper-2/40 -mx-2 px-2 rounded-lg transition-colors"
                      onClick={() => setOpenItem(it)}
                    >
                      <MenuTile glyph={it.imageEmoji} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <VegDot isVeg={it.isVeg} />
                          {it.isBestseller && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold-3 font-semibold">
                              <Award size={10} /> Bestseller
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-[15px] mt-1 leading-tight">
                          {it.name}
                        </div>
                        <div className="text-xs text-ink-3 line-clamp-2 mt-1">
                          {it.description}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-mono numeric text-[15px] font-semibold">
                            {money(it.price)}
                          </span>
                          {it.prepTimeMinutes ? (
                            <span className="text-[11px] text-ink-4 inline-flex items-center gap-1">
                              <Clock size={10} /> {it.prepTimeMinutes} min
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="self-center"
                      >
                        <QtyStepper
                          value={qty}
                          onChange={(n) => changeQty(it, n)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <CartFab />

      <Sheet open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-line p-0 max-h-[88vh]"
        >
          {openItem ? (
            <ItemDetail
              item={openItem}
              qty={getQty(openItem.id)}
              onChange={(n) => changeQty(openItem, n)}
              onClose={() => setOpenItem(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </CustomerShell>
  );
}

function ItemDetail({
  item,
  qty,
  onChange,
  onClose,
}: {
  item: MenuItem;
  qty: number;
  onChange: (n: number) => void;
  onClose: () => void;
}) {
  const cart = useCart();
  const [notes, setNotes] = useState(
    cart.lines.find((l) => l.menuItemId === item.id)?.specialInstructions ?? "",
  );
  return (
    <div className="overflow-y-auto max-h-[88vh]">
      <div className="px-6 pt-2 pb-6">
        <div className="mx-auto w-12 h-1.5 bg-line-2 rounded-full" />
      </div>
      <div className="px-6 pb-8">
        <div className="flex items-center gap-2">
          <VegDot isVeg={item.isVeg} />
          <span className="text-[11px] uppercase tracking-wider text-ink-3">
            {item.isVeg ? "Vegetarian" : "Non-vegetarian"}
          </span>
          {item.isBestseller && (
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold-3 font-semibold">
              <Award size={10} /> Bestseller
            </span>
          )}
        </div>
        <h2 className="font-display text-3xl mt-2 leading-tight">
          {item.name}
        </h2>
        <p className="text-[14px] text-ink-3 mt-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <MenuTile glyph={item.imageEmoji} size={72} />
          <div>
            <div className="font-mono numeric text-2xl font-semibold">
              {money(item.price)}
            </div>
            {item.prepTimeMinutes ? (
              <div className="text-xs text-ink-3 inline-flex items-center gap-1 mt-1">
                <Clock size={12} /> Ready in ~{item.prepTimeMinutes} min
              </div>
            ) : null}
          </div>
        </div>

        {item.includes && item.includes.length > 0 ? (
          <>
            <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-2">
              Comes with
            </div>
            <ul className="space-y-1.5">
              {item.includes.map((inc, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-2 inline-block w-1 h-1 rounded-full bg-gold" />
                  {inc}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink-4 mb-2">
          Special instructions
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="No onions, mild spice, etc."
          className="input-paper min-h-[72px] resize-none"
        />

        <div className="sticky bottom-0 -mx-6 mt-6 px-6 pt-4 pb-2 bg-paper border-t border-line flex items-center justify-between gap-3">
          <QtyStepper value={qty} onChange={onChange} />
          <button
            type="button"
            onClick={() => {
              if (qty === 0) onChange(1);
              cart.setNotes(item.id, notes);
              onClose();
            }}
            className="btn-gold rounded-2xl px-5 py-3 flex-1 text-sm font-semibold"
          >
            {qty === 0 ? "Add to order" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
