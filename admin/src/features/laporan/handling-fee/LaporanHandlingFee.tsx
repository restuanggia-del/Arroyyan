import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HardHat,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Boxes,
  Users,
} from "lucide-react";
import {
  getHandlingFeeDetailByDateRange,
  HandlingFeeDetailRow,
} from "../../../services/handlingFeeService";
import { today, firstOfMonth, formatDate } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";
import {
  exportHandlingFeeToExcel,
  exportHandlingFeeToPDF,
} from "../handling-fee/laporanHandlingFeeExportUtils";
import {
  KaryawanFeeSummaryTable,
  KaryawanSummary,
} from "../handling-fee/KaryawanFeeSummaryTable";

export function LaporanHandlingFee() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HandlingFeeDetailRow[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startDate > endDate) {
      setError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      setLoading(false);
      return;
    }

    const { data, error } = await getHandlingFeeDetailByDateRange(
      startDate,
      endDate,
    );
    if (error) setError("Gagal memuat laporan handling fee. Coba refresh.");
    setData(data || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summaryByKaryawan = useMemo<KaryawanSummary[]>(() => {
    const map = new Map<string, KaryawanSummary>();
    for (const row of data) {
      const existing = map.get(row.worker_key);
      if (existing) {
        existing.jumlah_kegiatan += 1;
        existing.total_fee += row.fee_per_orang;
      } else {
        map.set(row.worker_key, {
          worker_key: row.worker_key,
          nama: row.nama,
          is_manual: row.is_manual,
          jumlah_kegiatan: 1,
          total_fee: row.fee_per_orang,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_fee - a.total_fee);
  }, [data]);

  const totalFee = data.reduce((s, r) => s + r.fee_per_orang, 0);
  const totalDusUnik = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const row of data) {
      const key = `${row.tanggal}-${row.jumlah_dus}-${row.rate_per_dus}-${row.keterangan}`;
      if (!seen.has(key)) {
        seen.add(key);
        sum += row.jumlah_dus;
      }
    }
    return sum;
  }, [data]);

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportHandlingFeeToExcel(data, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportHandlingFeeToPDF(data, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Handling Fee
        </h1>
        <p className="text-gray-600">
          Rekap fee handling per karyawan dalam rentang tanggal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <HardHat className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Fee Handling</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalFee)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dus Dihandle</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalDusUnik.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Orang Terlibat</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : summaryByKaryawan.length}
          </p>
        </div>
      </div>

      <KaryawanFeeSummaryTable loading={loading} summary={summaryByKaryawan} />

      <div className="clay-raised rounded-xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tanggal Mulai
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
              <label className="block text-xs text-gray-500 mb-1">
                Tanggal Akhir
              </label>
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
              Belum ada data handling fee pada rentang tanggal ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    {[
                      "Tanggal",
                      "Nama Pekerja",
                      "Jumlah Dus",
                      "Rate/Dus",
                      "Fee Diterima",
                      "Keterangan",
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
                  {data.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {formatDate(r.tanggal)}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {r.nama}
                        {r.is_manual && (
                          <span className="ml-2 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 align-middle">
                            manual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {r.jumlah_dus.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3">{formatRp(r.rate_per_dus)}</td>
                      <td className="py-3 px-3 font-semibold text-orange-600">
                        {formatRp(r.fee_per_orang)}
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">
                        {r.keterangan || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
