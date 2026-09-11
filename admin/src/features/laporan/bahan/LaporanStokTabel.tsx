import { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  PackageX,
  Ban,
  FlaskConical,
} from "lucide-react";
import {
  getStokGudangReport,
  getStokSementaraReport,
  getRejectReasonBreakdown,
  MaterialStockReportRow,
  ReasonBreakdownRow,
} from "../../../services/laporanBahanService";
import {
  exportToExcel,
  exportToPDF,
  today,
  firstOfMonth,
  STATUS_LABEL,
  STATUS_CLASS,
} from "./laporanBahanExportUtils";

interface LaporanStokTabelProps {
  activeTab: "gudang" | "sementara";
}

export function LaporanStokTabel({ activeTab }: LaporanStokTabelProps) {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MaterialStockReportRow[]>([]);
  const [rejectReasons, setRejectReasons] = useState<ReasonBreakdownRow[]>([]);
  const [rejectBahanReasons, setRejectBahanReasons] = useState<
    ReasonBreakdownRow[]
  >([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startDate > endDate) {
      setError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      setLoading(false);
      return;
    }

    const fn =
      activeTab === "gudang" ? getStokGudangReport : getStokSementaraReport;
    const { data, error } = await fn(startDate, endDate);
    if (error) {
      setError(
        activeTab === "gudang"
          ? "Gagal memuat laporan stok gudang. Coba refresh."
          : "Gagal memuat laporan stok sementara. Coba refresh.",
      );
    }
    setData(data || []);

    if (activeTab === "sementara") {
      const [rejectRes, rejectBahanRes] = await Promise.all([
        getRejectReasonBreakdown(startDate, endDate, "reject"),
        getRejectReasonBreakdown(startDate, endDate, "reject_bahan"),
      ]);
      setRejectReasons(rejectRes.data || []);
      setRejectBahanReasons(rejectBahanRes.data || []);
    } else {
      setRejectReasons([]);
      setRejectBahanReasons([]);
    }

    setLoading(false);
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalSaldo = data.reduce((s, r) => s + r.saldo_saat_ini, 0);
  const totalMenipisHabis = data.filter(
    (r) => r.status === "menipis" || r.status === "habis",
  ).length;
  const totalRejectBahan =
    activeTab === "sementara"
      ? data.reduce((s, r) => s + (r.total_reject_bahan ?? 0), 0)
      : 0;
  const totalSampel =
    activeTab === "sementara"
      ? data.reduce((s, r) => s + (r.total_sampel ?? 0), 0)
      : 0;

  const isSementara = activeTab === "sementara";
  const fileLabel = isSementara ? "stok-sementara" : "stok-gudang";
  const reportTitle = isSementara
    ? "Laporan Bahan di Stok Sementara"
    : "Laporan Bahan di Stok Gudang";

  // Jumlah kolom grid kartu ringkasan mengikuti jumlah kartu yang benar-benar
  // tampil, supaya selalu rata penuh (sama seperti di Laporan Stok) — bukan
  // dipaksa ke jumlah kolom tetap yang bisa menyisakan ruang kosong.
  const summaryGridClass = isSementara
    ? "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
    : "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8";

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      const headers = isSementara
        ? [
            "Nama Bahan",
            "Satuan",
            "Saldo Saat Ini",
            "Pcs",
            "Total Masuk (Periode)",
            "Total Keluar (Periode)",
            "Reject Hasil Produksi (Periode)",
            "Reject Bahan (Periode)",
            "Sampel (Periode)",
            "Status",
          ]
        : [
            "Nama Bahan",
            "Satuan",
            "Saldo Saat Ini",
            "Pcs",
            "Total Masuk (Periode)",
            "Total Keluar (Periode)",
            "Status",
          ];

      await exportToExcel(
        data.map((r) => {
          const base: Record<string, any> = {
            "Nama Bahan": r.nama_bahan,
            Satuan: r.satuan,
            "Saldo Saat Ini": r.saldo_saat_ini,
            Pcs: r.saldo_pcs ?? "-",
            "Total Masuk (Periode)": r.total_masuk,
            "Total Keluar (Periode)": r.total_keluar,
          };
          if (isSementara) {
            base["Reject Hasil Produksi (Periode)"] = r.total_reject ?? 0;
            base["Reject Bahan (Periode)"] = r.total_reject_bahan ?? 0;
            base["Sampel (Periode)"] = r.total_sampel ?? 0;
          }
          base["Status"] = STATUS_LABEL[r.status];
          return base;
        }),
        headers,
        `laporan-bahan-${fileLabel}-${startDate}-${endDate}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      const headers = isSementara
        ? [
            "Nama Bahan",
            "Satuan",
            "Saldo Saat Ini",
            "Pcs",
            "Masuk",
            "Keluar",
            "Reject",
            "Reject Bahan",
            "Sampel",
            "Status",
          ]
        : [
            "Nama Bahan",
            "Satuan",
            "Saldo Saat Ini",
            "Pcs",
            "Masuk",
            "Keluar",
            "Status",
          ];

      await exportToPDF(
        `${reportTitle} (${startDate} s/d ${endDate})`,
        headers,
        data.map((r) => {
          const row = [
            r.nama_bahan,
            r.satuan,
            r.saldo_saat_ini,
            r.saldo_pcs ?? "-",
            r.total_masuk,
            r.total_keluar,
          ];
          if (isSementara) {
            row.push(r.total_reject ?? 0);
            row.push(r.total_reject_bahan ?? 0);
            row.push(r.total_sampel ?? 0);
          }
          row.push(STATUS_LABEL[r.status]);
          return row;
        }),
        `laporan-bahan-${fileLabel}-${startDate}-${endDate}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  return (
    <>
      <div className={summaryGridClass}>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Total Saldo {isSementara ? "Stok Sementara" : "Stok Gudang"}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalSaldo.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <PackageX className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Bahan Menipis / Habis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalMenipisHabis}
          </p>
        </div>
        {isSementara && (
          <>
            <div className="clay-raised rounded-lg p-6">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <Ban className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-sm text-gray-600 mb-1">Reject Bahan</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "—" : totalRejectBahan.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="clay-raised rounded-lg p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <FlaskConical className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-sm text-gray-600 mb-1">Sampel</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "—" : totalSampel.toLocaleString("id-ID")}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="clay-raised rounded-xl mb-8">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Pergerakan Sejak
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <span className="text-gray-400 mb-2.5">—</span>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={
                loading || (exportingType !== null && exportingType !== "pdf")
              }
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "pdf" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={
                loading || (exportingType !== null && exportingType !== "excel")
              }
              className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "excel" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-400 mb-4">
            Saldo saat ini selalu real-time. Kolom "Masuk", "Keluar", dan kolom
            kategori lainnya (Reject / Reject Bahan / Sampel, bila ada)
            menunjukkan ringkasan pergerakan pada rentang tanggal yang dipilih
            di atas.
          </p>

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
          ) : data.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              Belum ada data bahan
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    {[
                      "Nama Bahan",
                      "Satuan",
                      "Saldo Saat Ini",
                      "Pcs",
                      "Masuk (Periode)",
                      "Keluar (Periode)",
                      ...(isSementara
                        ? [
                            "Reject (Periode)",
                            "Reject Bahan (Periode)",
                            "Sampel (Periode)",
                          ]
                        : []),
                      "Status",
                    ].map((h, idx) => (
                      <th
                        key={`${h}-${idx}`}
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
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {r.nama_bahan}
                        {!r.is_active && (
                          <span className="ml-2 text-xs text-gray-400">
                            (nonaktif)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{r.satuan}</td>
                      <td className="py-3 px-3 font-semibold text-blue-700">
                        {r.saldo_saat_ini.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {r.saldo_pcs != null
                          ? `${r.saldo_pcs.toLocaleString("id-ID")} pcs`
                          : "-"}
                      </td>
                      <td className="py-3 px-3 text-green-600">
                        {r.total_masuk > 0
                          ? `+${r.total_masuk.toLocaleString("id-ID")}`
                          : "0"}
                      </td>
                      <td className="py-3 px-3 text-red-600">
                        {r.total_keluar > 0
                          ? `-${r.total_keluar.toLocaleString("id-ID")}`
                          : "0"}
                      </td>
                      {isSementara && (
                        <>
                          <td className="py-3 px-3 text-red-500">
                            {(r.total_reject ?? 0) > 0
                              ? `-${(r.total_reject ?? 0).toLocaleString("id-ID")}`
                              : "0"}
                          </td>
                          <td className="py-3 px-3 text-rose-500">
                            {(r.total_reject_bahan ?? 0) > 0
                              ? `-${(r.total_reject_bahan ?? 0).toLocaleString("id-ID")}`
                              : "0"}
                          </td>
                          <td className="py-3 px-3 text-teal-600">
                            {(r.total_sampel ?? 0) > 0
                              ? `-${(r.total_sampel ?? 0).toLocaleString("id-ID")}`
                              : "0"}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[r.status]}`}
                        >
                          {r.status === "aman" ? (
                            <PackageCheck className="w-3.5 h-3.5" />
                          ) : (
                            <PackageX className="w-3.5 h-3.5" />
                          )}
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isSementara &&
        !loading &&
        (rejectReasons.length > 0 || rejectBahanReasons.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clay-raised rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                Rincian Alasan Reject Hasil Produksi
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Rekap alasan reject pada rentang tanggal yang dipilih (mis. Lid
                miring, Bocor, Kurang air).
              </p>
              {rejectReasons.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Belum ada data reject pada periode ini.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {rejectReasons.map((r) => (
                      <tr
                        key={r.reason}
                        className="border-b border-[rgba(140,172,214,0.2)] last:border-0"
                      >
                        <td className="py-2 text-gray-700">{r.reason}</td>
                        <td className="py-2 text-right font-semibold text-red-600">
                          {r.total_qty.toLocaleString("id-ID")} pcs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="clay-raised rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-500" />
                Rincian Alasan Reject Bahan
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Rekap alasan bahan yang rusak sebelum sempat dipakai produksi
                (mis. Kardus sobek, Lid cacat pabrik).
              </p>
              {rejectBahanReasons.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Belum ada data reject bahan pada periode ini.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {rejectBahanReasons.map((r) => (
                      <tr
                        key={r.reason}
                        className="border-b border-[rgba(140,172,214,0.2)] last:border-0"
                      >
                        <td className="py-2 text-gray-700">{r.reason}</td>
                        <td className="py-2 text-right font-semibold text-rose-600">
                          {r.total_qty.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
    </>
  );
}
