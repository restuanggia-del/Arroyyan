import { formatNumber } from "../../../lib/formatters";
import { SalesSummary } from "./distribusiSalesUtils";

interface Props {
  data: SalesSummary[];
}

const HEADERS = [
  "No",
  "Sales",
  "Jumlah Distribusi",
  "Total Qty",
  "Sudah Diterima",
  "Belum Diterima",
];

export function RekapPerSalesTable({ data }: Props) {
  if (data.length === 0) {
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
          {data.map((s, i) => (
            <tr
              key={s.salesId}
              className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
            >
              <td className="py-3 px-3 text-gray-500">{i + 1}</td>
              <td className="py-3 px-3 font-medium">{s.salesName}</td>
              <td className="py-3 px-3">{formatNumber(s.jumlahDistribusi)}</td>
              <td className="py-3 px-3 font-semibold">
                {formatNumber(s.totalQty)} unit
              </td>
              <td className="py-3 px-3 text-green-700">
                {formatNumber(s.diterima)} unit
              </td>
              <td className="py-3 px-3 text-orange-600">
                {formatNumber(s.belumDiterima)} unit
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
