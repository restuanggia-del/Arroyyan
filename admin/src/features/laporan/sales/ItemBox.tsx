import { formatRp } from "../../../lib/formatters";

interface ItemBoxProps {
  title: string;
  totalLabel: string;
  total: number;
  rows: { left: string; right: string; jumlah: number }[];
  emptyText: string;
}

export function ItemBox({
  title,
  totalLabel,
  total,
  rows,
  emptyText,
}: ItemBoxProps) {
  return (
    <div className="clay-raised rounded-xl overflow-hidden mb-4">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-4 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-4 py-3">{emptyText}</p>
        ) : (
          rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">{r.left}</p>
                <p className="text-xs text-gray-400 truncate">{r.right}</p>
              </div>
              <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                {formatRp(r.jumlah)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
        <span className="text-sm font-bold text-gray-800">{totalLabel}</span>
        <span className="text-sm font-bold text-gray-900">
          {formatRp(total)}
        </span>
      </div>
    </div>
  );
}
