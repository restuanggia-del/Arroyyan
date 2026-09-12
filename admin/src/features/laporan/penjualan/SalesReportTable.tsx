import { SalesReportRow } from "../../../services/reportService";
import { formatRp } from "../../../lib/formatters";

interface SalesReportTableProps {
  data: SalesReportRow[];
  startDate: string;
  endDate: string;
}

export function SalesReportTable({
  data,
  startDate,
  endDate,
}: SalesReportTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ringkasan Transaksi Penjualan
          </h3>
          <p className="text-sm text-gray-500">
            Periode: {startDate} s/d {endDate}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-gray-500">Total Penjualan</p>
          <p className="text-xl font-bold text-blue-600">
            {formatRp(data.reduce((s, r) => s + r.total, 0))}
          </p>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada data penjualan pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                {[
                  "Tanggal",
                  "No. Transaksi",
                  "Pelanggan",
                  "Karyawan",
                  "Produk",
                  "Total",
                  "Bayar",
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
              {data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-3 px-3 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-3 font-mono font-medium">#{row.id}</td>
                  <td className="py-3 px-3">{row.customer}</td>
                  <td className="py-3 px-3 text-gray-500">{row.karyawan}</td>
                  <td
                    className="py-3 px-3 max-w-[200px] truncate"
                    title={row.items}
                  >
                    {row.items}
                  </td>
                  <td className="py-3 px-3 font-semibold text-left whitespace-nowrap">
                    {formatRp(row.total)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.payment === "Cash"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.payment}
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
