export function ProductCell({ items }: { items: string }) {
  const parts = items
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const first = parts[0] ?? "—";
  const rest = parts.length - 1;

  return (
    <div className="flex items-center gap-1.5 max-w-[220px]">
      <span className="truncate text-sm text-gray-800">{first}</span>
      {rest > 0 && (
        <span
          className="flex-shrink-0 px-1.5 py-0.5 bg-[rgba(215,233,255,0.55)] text-gray-500 text-xs rounded-full cursor-default"
          title={parts.slice(1).join(", ")}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
