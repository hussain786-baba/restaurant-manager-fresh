import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  menuItemId: number;
  name: string;
  price: number;
  imageEmoji: string | null;
  quantity: number;
  specialInstructions: string;
  isVeg: boolean;
}

interface CartState {
  lines: CartLine[];
  guestName: string;
  guestCount: number;
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQty: (menuItemId: number, qty: number) => void;
  setNotes: (menuItemId: number, notes: string) => void;
  remove: (menuItemId: number) => void;
  clear: () => void;
  setGuestName: (n: string) => void;
  setGuestCount: (n: number) => void;
  subtotal: () => number;
  totalQty: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      guestName: "",
      guestCount: 2,
      add: (line) => {
        const qty = line.quantity ?? 1;
        const lines = get().lines;
        const existing = lines.find((l) => l.menuItemId === line.menuItemId);
        if (existing) {
          set({
            lines: lines.map((l) =>
              l.menuItemId === line.menuItemId
                ? { ...l, quantity: l.quantity + qty, specialInstructions: line.specialInstructions || l.specialInstructions }
                : l,
            ),
          });
        } else {
          set({
            lines: [
              ...lines,
              {
                menuItemId: line.menuItemId,
                name: line.name,
                price: line.price,
                imageEmoji: line.imageEmoji,
                quantity: qty,
                specialInstructions: line.specialInstructions ?? "",
                isVeg: line.isVeg,
              },
            ],
          });
        }
      },
      setQty: (menuItemId, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.menuItemId !== menuItemId) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.menuItemId === menuItemId ? { ...l, quantity: qty } : l,
          ),
        });
      },
      setNotes: (menuItemId, notes) => {
        set({
          lines: get().lines.map((l) =>
            l.menuItemId === menuItemId
              ? { ...l, specialInstructions: notes }
              : l,
          ),
        });
      },
      remove: (menuItemId) => {
        set({ lines: get().lines.filter((l) => l.menuItemId !== menuItemId) });
      },
      clear: () => set({ lines: [], guestName: "", guestCount: 2 }),
      setGuestName: (n) => set({ guestName: n }),
      setGuestCount: (n) => set({ guestCount: Math.max(1, n) }),
      subtotal: () =>
        get().lines.reduce((s, l) => s + l.price * l.quantity, 0),
      totalQty: () => get().lines.reduce((s, l) => s + l.quantity, 0),
    }),
    {
      name: "dineflow.cart",
      partialize: (s) => ({
        lines: s.lines,
        guestName: s.guestName,
        guestCount: s.guestCount,
      }),
    },
  ),
);
