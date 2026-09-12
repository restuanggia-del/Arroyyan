import { TopProduct } from "../../../services/reportService";
import { formatRp } from "../../../lib/formatters";
import { CategoryBadge } from "./CategoryBadge";

interface TopProductsTableProps {
  data: TopProduct[];
}

export function TopProductsTable({ data }: TopProductsTableProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Produk Terlaris
        </h3>
        <p className="text-sm text-gray-500">
          Berdasarkan total transaksi keseluruhan
        </p>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Belum ada data transaksi
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                {["#", "Produk", "Kategori", "Total Terjual", "Pendapatan"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.product_id}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-3 px-3">
                    <span
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                            ? "bg-gray-200 text-gray-700"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">{row.product_name}</td>
                  <td className="py-3 px-3">
                    <CategoryBadge category={row.category} />
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {row.totalSold} unit
                  </td>
                  <td className="py-3 px-3 font-semibold text-green-600">
                    {formatRp(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
