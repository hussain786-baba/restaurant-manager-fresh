export function MenuTile({
  glyph,
  size = 56,
  className = "",
}: {
  glyph?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`menu-tile ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden
    >
      <span style={{ filter: "saturate(0.85)" }}>{glyph ?? "🍽"}</span>
    </div>
  );
}
