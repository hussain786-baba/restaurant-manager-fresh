export const TAX_RATE = 0.05; // 5% GST

export function computeOrderTotals(
  items: { unitPrice: number; quantity: number }[],
  tip = 0,
) {
  const subtotal = items.reduce(
    (sum, it) => sum + it.unitPrice * it.quantity,
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax + tip) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    total,
  };
}

export function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `D-${ts}${rand}`;
}
