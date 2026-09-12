import { DistributionReportRow } from "../../../services/reportService";
import { ProductCell } from "../penjualan/ProductCell";

interface DistributionReportTableProps {
  data: DistributionReportRow[];
  startDate: string;
  endDate: string;
}

export function DistributionReportTable({
  data,
  startDate,
  endDate,
}: DistributionReportTableProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Distribusi
        </h3>
        <p className="text-sm text-gray-500">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada data distribusi pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                {[
                  "Tanggal",
                  "No. Distribusi",
                  "Karyawan",
                  "Produk",
                  "Total Qty",
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
              {data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-3 px-3 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-3 font-mono font-medium">#{row.id}</td>
                  <td className="py-3 px-3">{row.karyawan}</td>
                  <td className="py-3 px-3">
                    <ProductCell items={row.items} />
                  </td>
                  <td className="py-3 px-3 text-left font-semibold">
                    {row.totalQty} unit
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === "Diterima"
                          ? "bg-green-100 text-green-700"
                          : row.status === "Dikirim"
                            ? "bg-blue-100 text-blue-700"
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
