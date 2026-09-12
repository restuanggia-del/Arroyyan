import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Package,
  Wallet,
} from "lucide-react";
import {
  getLaporanGlobal,
  LaporanGlobalRow,
} from "../../../services/laporanGlobalService";
import { currentPeriode } from "../../../lib/dateUtils";
import { formatRp, formatDus } from "../../../lib/formatters";
import {
  exportRekapProdukToExcel,
  exportRekapProdukToPDF,
} from "./laporanGlobalExportUtils";

export function RekapProdukTab() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<LaporanGlobalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getLaporanGlobal(p);
    if (error)
      setError("Gagal memuat laporan global: " + (error as any).message);
    setData(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const sum = (key: keyof LaporanGlobalRow) =>
    data.reduce((s, r) => s + Number(r[key] as number), 0);

  const totals = {
    stok_awal_dus: sum("stok_awal_dus"),
    total_produksi_dus: sum("total_produksi_dus"),
    total_keluar_dus: sum("total_keluar_dus"),
    sisa_stok_dus: sum("sisa_stok_dus"),
    penjualan_cash_dus: sum("penjualan_cash_dus"),
    penjualan_cash_rp: sum("penjualan_cash_rp"),
    penjualan_bon_dus: sum("penjualan_bon_dus"),
    penjualan_bon_rp: sum("penjualan_bon_rp"),
    penjualan_total_dus: sum("penjualan_total_dus"),
    penjualan_total_rp: sum("penjualan_total_rp"),
    sodaqoh_dus: sum("sodaqoh_dus"),
    sodaqoh_rp: sum("sodaqoh_rp"),
    pribadi_dus: sum("pribadi_dus"),
    pribadi_rp: sum("pribadi_rp"),
    bonus_dus: sum("bonus_dus"),
    bonus_rp: sum("bonus_rp"),
    retur_dus: sum("retur_dus"),
    retur_rp: sum("retur_rp"),
  };

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportRekapProdukToExcel(data, periode);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportRekapProdukToPDF(data, periode, totals);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div>
      <div className="clay-inset-amber border-0 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Nilai Rp pada kolom Sodaqoh, Pribadi, Bonus, dan Retur adalah{" "}
          <b>estimasi</b> (dus × harga dasar produk), karena bukan transaksi
          penjualan sehingga tidak ada nilai Rp asli. Kolom
          Sodaqoh/Pribadi/Bonus baru akan terisi kalau sudah dicatat lewat menu
          Manajemen Stok → Stok Keluar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Produksi</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.total_produksi_dus)} dus
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totals.penjualan_total_rp)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Sisa Stok (Saat Ini)</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.sisa_stok_dus)} dus
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Keluar</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.total_keluar_dus)} dus
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Periode
              </label>
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
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
              Belum ada produk aktif
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    <th
                      rowSpan={2}
                      className="text-left py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Produk
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Stok Awal
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Produksi
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Keluar
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Sisa Stok
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-1 px-2 font-semibold text-gray-700 border-b border-[rgba(140,172,214,0.35)] whitespace-nowrap"
                    >
                      Cash
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-1 px-2 font-semibold text-gray-700 border-b border-[rgba(140,172,214,0.35)] whitespace-nowrap"
                    >
                      Bon
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Sodaqoh
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Pribadi
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Bonus
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Retur
                    </th>
                  </tr>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Dus
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Rp
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Dus
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Rp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.product_id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-2 px-2 font-medium text-gray-900 whitespace-nowrap">
                        {r.product_name}
                        {r.size ? ` (${r.size})` : ""}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.stok_awal_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.total_produksi_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.total_keluar_dus)}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {formatDus(r.sisa_stok_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.penjualan_cash_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatRp(r.penjualan_cash_rp)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.penjualan_bon_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatRp(r.penjualan_bon_rp)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.sodaqoh_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.pribadi_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.bonus_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.retur_dus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[rgba(140,172,214,0.4)] bg-[rgba(215,233,255,0.4)] font-bold">
                    <td className="py-3 px-2">TOTAL</td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.stok_awal_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.total_produksi_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.total_keluar_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.sisa_stok_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.penjualan_cash_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatRp(totals.penjualan_cash_rp)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.penjualan_bon_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatRp(totals.penjualan_bon_rp)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.sodaqoh_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.pribadi_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.bonus_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.retur_dus)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
