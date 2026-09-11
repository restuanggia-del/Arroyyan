import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  Ban,
  FlaskConical,
  ClipboardList,
} from "lucide-react";
import {
  getProduksiHarianSessions,
  ProduksiHarianSession,
} from "../../../services/produksiHarianService";
import { today, formatTanggalPanjang } from "./laporanBahanExportUtils";

export function LaporanProduksiHarian() {
  const [tanggal, setTanggal] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProduksiHarianSession[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getProduksiHarianSessions(tanggal, tanggal);
    if (error) {
      setError("Gagal memuat Laporan Produksi Harian. Coba refresh.");
    }
    setSessions(data || []);
    setLoading(false);
  }, [tanggal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="clay-raised rounded-xl mb-6 p-6 flex items-end gap-3 flex-wrap">
        <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Tanggal Produksi
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
          />
        </div>
        <p className="text-xs text-gray-400 mb-2.5">
          Menampilkan sesi Pemakaian Produksi yang dicatat lewat tombol
          "Pemakaian Produksi" di Stok Sementara pada tanggal ini.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="clay-raised rounded-xl p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Belum ada sesi Pemakaian Produksi pada tanggal ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((s) => (
            <ProduksiHarianCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProduksiHarianCard({ session }: { session: ProduksiHarianSession }) {
  const rejectReasonMap = new Map<string, number>();
  for (const b of session.bahan) {
    for (const item of b.reject_detail) {
      const key = item.reason || "Lainnya";
      rejectReasonMap.set(
        key,
        (rejectReasonMap.get(key) || 0) + (Number(item.qtyPcs) || 0),
      );
    }
  }
  const rejectReasonRows = Array.from(rejectReasonMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const totalReject = session.bahan.reduce((s, b) => s + b.reject_pcs, 0);
  const totalSampel = session.bahan.reduce((s, b) => s + b.sampel_pcs, 0);
  const bahanRejectBahan = session.bahan.filter((b) => b.reject_bahan_pcs > 0);

  return (
    <div className="clay-raised rounded-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Hasil Produksi{" "}
        {session.product_name_snapshot ? session.product_name_snapshot : "—"}{" "}
        Tanggal {formatTanggalPanjang(session.tanggal)}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Bahan Material Dalam Ruang Produksi (Awal)
          </h3>
          {session.bahan.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada data bahan.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {session.bahan.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[rgba(140,172,214,0.15)] last:border-0"
                  >
                    <td className="py-1.5 text-gray-700">
                      {b.material_name_snapshot}
                    </td>
                    <td className="py-1.5 text-right font-medium text-gray-900">
                      {b.jumlah_awal_pcs.toLocaleString("id-ID")} pcs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Sisa Bahan Material di Dalam Ruangan (Akhir)
          </h3>
          {session.bahan.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada data bahan.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {session.bahan.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[rgba(140,172,214,0.15)] last:border-0"
                  >
                    <td className="py-1.5 text-gray-700">
                      {b.material_name_snapshot}
                    </td>
                    <td className="py-1.5 text-right font-medium text-gray-900">
                      {b.sisa_pcs.toLocaleString("id-ID")} pcs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
            <PackageCheck className="w-3.5 h-3.5" />
            Hasil Produksi
          </h3>
          {session.jumlah_dus > 0 ? (
            <p className="text-sm text-gray-800">
              Produk Jadi:{" "}
              <span className="font-semibold">
                {session.jumlah_dus.toLocaleString("id-ID")} dus (
                {session.jumlah_pcs.toLocaleString("id-ID")} pcs)
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Tidak ada hasil produksi dicatat.
            </p>
          )}
        </div>

        <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            Sampel
          </h3>
          <p className="text-sm text-gray-800">
            {totalSampel > 0 ? (
              <span className="font-semibold">
                {totalSampel.toLocaleString("id-ID")} pcs
              </span>
            ) : (
              <span className="text-gray-400">Tidak ada sampel dicatat.</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
            <Ban className="w-3.5 h-3.5" />
            Total Reject{" "}
            {totalReject > 0 && `${totalReject.toLocaleString("id-ID")} pcs`}
          </h3>
          {rejectReasonRows.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada reject dicatat.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {rejectReasonRows.map(([reason, qty]) => (
                  <tr
                    key={reason}
                    className="border-b border-red-100 last:border-0"
                  >
                    <td className="py-1.5 text-gray-700">{reason}</td>
                    <td className="py-1.5 text-right font-medium text-red-700">
                      {qty.toLocaleString("id-ID")} pcs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">
            <Ban className="w-3.5 h-3.5" />
            Reject Bahan
          </h3>
          {bahanRejectBahan.length === 0 ? (
            <p className="text-sm text-gray-400">
              Tidak ada reject bahan dicatat.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {bahanRejectBahan.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-rose-100 last:border-0"
                  >
                    <td className="py-1.5 text-gray-700">
                      {b.material_name_snapshot}
                      {b.reject_bahan_reason && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({b.reject_bahan_reason})
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-medium text-rose-700">
                      {b.reject_bahan_pcs.toLocaleString("id-ID")} pcs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Pemakaian Bersih per Bahan (termasuk Barang Keluar untuk Produksi)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(140,172,214,0.3)]">
              <th className="text-left py-1.5 text-xs text-gray-500 font-medium">
                Bahan
              </th>
              <th className="text-right py-1.5 text-xs text-gray-500 font-medium">
                Pemakaian Bersih
              </th>
            </tr>
          </thead>
          <tbody>
            {session.bahan.map((b) => (
              <tr
                key={b.id}
                className="border-b border-[rgba(140,172,214,0.15)] last:border-0"
              >
                <td className="py-1.5 text-gray-700">
                  {b.material_name_snapshot}
                </td>
                <td className="py-1.5 text-right font-medium text-gray-900">
                  {b.pemakaian_bersih_pcs.toLocaleString("id-ID")} pcs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {session.note && (
        <p className="text-xs text-gray-400 mt-4 italic">
          Catatan: {session.note}
        </p>
      )}
    </div>
  );
}
