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
  getLaporanPenjualan,
  LaporanPenjualanResult,
} from "../../../services/laporanPenjualanService";
import { currentPeriode } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";
import {
  exportLaporanSalesToExcel,
  exportLaporanSalesToPDF,
} from "../sales/laporanSalesExportUtils";
import { DetailHarianTab } from "../sales/DetailHarianTab";
import { RincianSetoranTab } from "../sales/RincianSetoranTab";
import { KomisiSetoranSalesTab } from "../sales/KomisiSetoranSalesTab";

export function LaporanSales() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [activeTab, setActiveTab] = useState<"harian" | "setoran" | "komisi">(
    "harian",
  );
  const [data, setData] = useState<LaporanPenjualanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getLaporanPenjualan(p);
    if (error)
      setError("Gagal memuat laporan penjualan: " + (error as any).message);
    setData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const totalPenjualanCard = data?.ringkasan.total_penjualan_rp ?? 0;
  const totalPotonganCard = data?.ringkasan.total_potongan_semua ?? 0;
  const sisaCard = data?.ringkasan.sisa_penjualan_rp ?? 0;

  const handleExportPDF = async () => {
    if (!data) return;
    setExportingType("pdf");
    try {
      await exportLaporanSalesToPDF(data, `laporan-penjualan-${periode}`);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data) return;
    setExportingType("excel");
    try {
      await exportLaporanSalesToExcel(data, `laporan-penjualan-${periode}`);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Laporan Penjualan
          </h1>
          <p className="text-gray-600">
            Rincian harian per produk (semua sales) beserta potongan, transfer,
            setoran, dan titipan — mengikuti format Laporan Hasil Penjualan Air
            Mineral ARROYYAN99. Totalnya sinkron dengan Laporan Global.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bulan
            </label>
            <div className="flex items-center gap-2 clay-inset border-0 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="text-sm focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={
              loading ||
              !data ||
              (exportingType !== null && exportingType !== "pdf")
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
              loading ||
              !data ||
              (exportingType !== null && exportingType !== "excel")
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

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalPenjualanCard)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Potongan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalPotonganCard)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Sisa Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(sisaCard)}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {[
          { id: "harian", label: "Detail Harian per Produk" },
          { id: "setoran", label: "Rincian Setoran & Potongan" },
          { id: "komisi", label: "Komisi & Setoran Sales" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id as "harian" | "setoran" | "komisi")
            }
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "harian" ? (
        <DetailHarianTab data={data} loading={loading} />
      ) : activeTab === "setoran" ? (
        <RincianSetoranTab data={data} loading={loading} />
      ) : (
        <KomisiSetoranSalesTab data={data} loading={loading} />
      )}
    </div>
  );
}
