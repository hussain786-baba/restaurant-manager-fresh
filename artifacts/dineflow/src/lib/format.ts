const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function money(n: number): string {
  return inr.format(n);
}

export function moneyPrecise(n: number): string {
  return inrPrecise.format(n);
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const seconds = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function shortTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
