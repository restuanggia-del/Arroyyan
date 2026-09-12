import { useState, useEffect, useCallback } from "react";
import {
  Warehouse,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  PackageX,
  Boxes,
} from "lucide-react";
import {
  getLaporanStokProduk,
  ProductStockReportRow,
} from "../../../services/laporanStokService";

import { today, firstOfMonth } from "../../../lib/dateUtils";
import {
  exportStokToExcel,
  exportStokToPDF,
  STATUS_LABEL,
  STATUS_CLASS,
  CATEGORY_LABEL,
} from "./laporanStokExportUtils";

export function LaporanStok() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductStockReportRow[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startDate > endDate) {
      setError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      setLoading(false);
      return;
    }

    const { data, error } = await getLaporanStokProduk(startDate, endDate);
    if (error) {
      setError("Gagal memuat laporan stok produk. Coba refresh.");
    }
    setData(data || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalStok = data.reduce((s, r) => s + r.total_stok, 0);
  const totalMenipisHabis = data.filter(
    (r) => r.status === "menipis" || r.status === "habis",
  ).length;
  const totalProduk = data.length;

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportStokToExcel(data, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportStokToPDF(data, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Stok</h1>
        <p className="text-gray-600">
          Pantau jumlah stok produk yang ada di Manajemen Stok (pusat &amp;
          lapangan)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Produk</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalProduk}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Warehouse className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Saat Ini</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStok.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <PackageX className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Produk Menipis / Habis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalMenipisHabis}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-xl">
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
            Stok pusat &amp; lapangan selalu real-time (diambil dari Manajemen
            Stok). Kolom "Masuk" &amp; "Keluar" menunjukkan ringkasan pergerakan
            stok pada rentang tanggal yang dipilih di atas.
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
              Belum ada data produk
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    {[
                      "Nama Produk",
                      "Kategori",
                      "Satuan",
                      "Stok Pusat",
                      "Stok Lapangan",
                      "Total Stok",
                      "Minimum",
                      "Masuk (Periode)",
                      "Keluar (Periode)",
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
                  {data.map((r) => (
                    <tr
                      key={r.product_id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {r.product_name}
                        {!r.is_active && (
                          <span className="ml-2 text-xs text-gray-400">
                            (nonaktif)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{r.unit}</td>
                      <td className="py-3 px-3 text-gray-700">
                        {r.stok_pusat.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {r.stok_lapangan.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-700">
                        {r.total_stok.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {r.minimum_stock.toLocaleString("id-ID")}
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
    </div>
  );
}
