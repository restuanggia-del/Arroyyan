import { RefreshCw } from "lucide-react";
import { formatRp } from "../../../lib/formatters";

export interface KaryawanSummary {
  worker_key: string;
  nama: string;
  is_manual: boolean;
  jumlah_kegiatan: number;
  total_fee: number;
}

interface KaryawanFeeSummaryTableProps {
  loading: boolean;
  summary: KaryawanSummary[];
}

export function KaryawanFeeSummaryTable({
  loading,
  summary,
}: KaryawanFeeSummaryTableProps) {
  return (
    <div className="clay-raised rounded-lg overflow-hidden mb-8">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Rekap per Pekerja
        </h2>
      </div>
      {loading ? (
        <div className="py-10 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : summary.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          Belum ada data pada rentang tanggal ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]">
                {["Nama Pekerja", "Jumlah Kegiatan", "Total Fee Diterima"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr
                  key={s.worker_key}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {s.nama}
                    {s.is_manual && (
                      <span className="ml-2 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 align-middle">
                        manual
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {s.jumlah_kegiatan}
                  </td>
                  <td className="py-3 px-4 font-semibold text-orange-600">
                    {formatRp(s.total_fee)}
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
