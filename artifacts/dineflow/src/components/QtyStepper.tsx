import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onChange,
  small = false,
}: {
  value: number;
  onChange: (n: number) => void;
  small?: boolean;
}) {
  if (value <= 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        className={
          small
            ? "btn-gold rounded-full px-3 py-1 text-xs"
            : "btn-gold rounded-full px-4 py-2 text-sm"
        }
      >
        Add
      </button>
    );
  }
  const dim = small ? "h-7" : "h-9";
  const btn =
    "inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 transition-colors";
  return (
    <div
      className={`inline-flex items-center gap-2 hairline rounded-full bg-white px-1 py-1 ${dim}`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className={`${btn} ${small ? "h-5 w-5" : "h-7 w-7"}`}
        aria-label="Decrease"
      >
        <Minus size={small ? 12 : 14} />
      </button>
      <span
        className={`numeric font-mono font-semibold ${small ? "text-xs w-4" : "text-sm w-5"} text-center`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={`${btn} ${small ? "h-5 w-5" : "h-7 w-7"}`}
        aria-label="Increase"
      >
        <Plus size={small ? 12 : 14} />
      </button>
    </div>
  );
}
