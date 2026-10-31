import { formatDate } from "../../../lib/dateUtils";
import { formatNumber } from "../../../lib/formatters";
import { DistRow, statusBadge, statusLabel } from "./distribusiSalesUtils";

interface Props {
  rows: DistRow[];
  totalQty: number;
}

const HEADERS = [
  "Tanggal",
  "No. Distribusi",
  "Sales",
  "Produk",
  "Total Qty",
  "Status",
  "Keterangan",
];

export function RincianDistribusiTable({ rows, totalQty }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Tidak ada data distribusi ke sales pada filter ini
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
            >
              <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                {formatDate(r.date)}
              </td>
              <td className="py-3 px-3 font-mono font-medium">#{r.shortId}</td>
              <td className="py-3 px-3 font-medium">{r.salesName}</td>
              <td className="py-3 px-3">
                <div className="flex flex-col gap-0.5">
                  {r.items.map((it, i) => (
                    <span key={i} className="text-gray-700">
                      {it.name}{" "}
                      <span className="text-gray-500">
                        × {formatNumber(it.qty)}
                      </span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-3 font-semibold whitespace-nowrap">
                {formatNumber(r.totalQty)} unit
              </td>
              <td className="py-3 px-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusBadge[r.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabel[r.status] ?? r.status}
                </span>
              </td>
              <td className="py-3 px-3 text-gray-600 max-w-xs whitespace-pre-line">
                {r.keterangan || "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[rgba(140,172,214,0.35)] font-semibold">
            <td className="py-3 px-3" colSpan={4}>
              Total
            </td>
            <td className="py-3 px-3 whitespace-nowrap">
              {formatNumber(totalQty)} unit
            </td>
            <td />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
