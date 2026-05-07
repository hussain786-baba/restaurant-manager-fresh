import { Link } from "wouter";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="font-display text-[28px] leading-none tracking-tight">
        Dine<span className="gold-text">Flow</span>
      </span>
    </div>
  );
}

export function HomeLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-baseline gap-2 text-current no-underline"
    >
      <Wordmark />
    </Link>
  );
}

export function StatusPill({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const cls = `pill pill-${status} ${className}`;
  const label = status.replace(/_/g, " ");
  return <span className={cls}>{label}</span>;
}

export function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={isVeg ? "dot-veg" : "dot-nonveg"}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    />
  );
}
