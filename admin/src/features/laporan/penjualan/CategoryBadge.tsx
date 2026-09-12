export function CategoryBadge({ category }: { category: string }) {
  const label =
    category === "cup" ? "Cup" : category === "galon" ? "Galon" : "Botol";
  const className =
    category === "cup"
      ? "bg-blue-100 text-blue-700"
      : category === "galon"
        ? "bg-cyan-100 text-cyan-700"
        : "bg-purple-100 text-purple-700";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
