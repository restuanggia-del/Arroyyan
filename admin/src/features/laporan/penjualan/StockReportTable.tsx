import { StockReportRow } from "../../../services/reportService";
import { CategoryBadge } from "./CategoryBadge";

interface StockReportTableProps {
  data: StockReportRow[];
}

export function StockReportTable({ data }: StockReportTableProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Laporan Stok</h3>
        <p className="text-sm text-gray-500">Snapshot stok saat ini</p>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Belum ada data stok
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                {[
                  "Produk",
                  "Kategori",
                  "Stok Pusat",
                  "Stok Karyawan",
                  "Total",
                  "Min. Stok",
                  "Status",
                ].map((h) => (
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
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-3 px-3 font-medium">{row.product_name}</td>
                  <td className="py-3 px-3">
                    <CategoryBadge category={row.category} />
                  </td>
                  <td className="py-3 px-3 text-left">{row.stockPusat}</td>
                  <td className="py-3 px-3 text-left">{row.stockKaryawan}</td>
                  <td className="py-3 px-3 text-left font-semibold">
                    {row.total}
                  </td>
                  <td className="py-3 px-3 text-left text-gray-500">
                    {row.minimum}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === "Aman"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {row.status}
                    </span>
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
