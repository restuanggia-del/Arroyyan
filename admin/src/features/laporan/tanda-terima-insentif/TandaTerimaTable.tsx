import { RefreshCw, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { IncentiveReceipt } from "../../../services/incentiveReceiptService";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";

interface TandaTerimaTableProps {
  data: IncentiveReceipt[];
  actionLoading: string | null;
  onToggleStatus: (receipt: IncentiveReceipt) => void;
  onRequestDelete: (receipt: IncentiveReceipt) => void;
}

const COLUMNS = [
  "Jenis",
  "Nama",
  "Produksi",
  "Fee Jualan",
  "Handling",
  "Fee Rekap",
  "Bonus",
  "Total",
  "Status",
  "Aksi",
];

export function TandaTerimaTable({
  data,
  actionLoading,
  onToggleStatus,
  onRequestDelete,
}: TandaTerimaTableProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Belum ada rekap untuk periode ini. Klik "Hitung / Refresh Rekap" untuk
        menghitung dari data yang sudah tersimpan.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
            {COLUMNS.map((h) => (
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
          {data.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
            >
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    r.sales_id
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {r.sales_id ? "Sales" : "Karyawan"}
                </span>
              </td>
              <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">
                {r.sales?.nama_sales ?? r.karyawan?.nama ?? "—"}
              </td>
              <td className="py-3 px-3 text-gray-600">
                {formatRp(r.total_produksi)}
              </td>
              <td className="py-3 px-3 text-gray-600">
                {formatRp(r.total_fee_penjualan)}
              </td>
              <td className="py-3 px-3 text-gray-600">
                {formatRp(r.total_handling)}
              </td>
              <td className="py-3 px-3 text-gray-600">
                {formatRp(r.total_fee_rekapan)}
              </td>
              <td className="py-3 px-3 text-gray-600">
                {formatRp(r.total_bonus_target)}
              </td>
              <td className="py-3 px-3 font-bold text-indigo-700 whitespace-nowrap">
                {formatRp(r.jumlah_total)}
              </td>
              <td className="py-3 px-3">
                {actionLoading === r.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <button
                    onClick={() => onToggleStatus(r)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      r.status_tanda_terima === "sudah"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-[rgba(215,233,255,0.55)] text-gray-500 hover:bg-gray-200"
                    }`}
                    title={
                      r.status_tanda_terima === "sudah"
                        ? `Diterima ${r.tanggal_terima ? formatDate(r.tanggal_terima) : ""}`
                        : "Klik untuk tandai sudah diterima"
                    }
                  >
                    {r.status_tanda_terima === "sudah" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    {r.status_tanda_terima === "sudah"
                      ? "Sudah Terima"
                      : "Belum"}
                  </button>
                )}
              </td>
              <td className="py-3 px-3">
                <button
                  onClick={() => onRequestDelete(r)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
