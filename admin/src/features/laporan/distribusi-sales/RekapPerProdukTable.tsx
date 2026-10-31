import { formatNumber } from "../../../lib/formatters";
import { ProductSummary } from "./distribusiSalesUtils";

interface Props {
  data: ProductSummary[];
}

const HEADERS = ["No", "Produk", "Kategori", "Total Qty", "Jumlah Distribusi"];

export function RekapPerProdukTable({ data }: Props) {
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
          {data.map((p, i) => (
            <tr
              key={p.name}
              className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
            >
              <td className="py-3 px-3 text-gray-500">{i + 1}</td>
              <td className="py-3 px-3 font-medium">{p.name}</td>
              <td className="py-3 px-3 text-gray-600">{p.category}</td>
              <td className="py-3 px-3 font-semibold">
                {formatNumber(p.totalQty)} unit
              </td>
              <td className="py-3 px-3">{formatNumber(p.jumlahDistribusi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
