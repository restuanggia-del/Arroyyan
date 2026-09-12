import { formatRp } from "../../../lib/formatters";

interface SetoranBoxProps {
  title: string;
  totalLabel: string;
  total: number;
  children: React.ReactNode;
}

export function SetoranBox({
  title,
  totalLabel,
  total,
  children,
}: SetoranBoxProps) {
  return (
    <div className="clay-raised rounded-xl overflow-hidden">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-4 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
        <span className="text-sm font-bold text-gray-800">{totalLabel}</span>
        <span className="text-sm font-bold text-gray-900">
          {formatRp(total)}
        </span>
      </div>
    </div>
  );
}

export function SetoranRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">
        {formatRp(value)}
      </span>
    </div>
  );
}
