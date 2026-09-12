import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Truck,
  TrendingUp,
  Package,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getSalesReport,
  getDistributionReport,
  getTopProducts,
  getStockReport,
  SalesReportRow,
  DistributionReportRow,
  TopProduct,
  StockReportRow,
} from "../../../services/reportService";
import { SalesReportTable } from "./SalesReportTable";
import { DistributionReportTable } from "../penjualan/DistributionReportTable";
import { TopProductsTable } from "../penjualan/TopProductsTable";
import { StockReportTable } from "../penjualan/StockReportTable";
import {
  ReportType,
  exportReportToExcel,
  exportReportToPDF,
} from "../penjualan/reportsExportUtils";

export function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";

  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<SalesReportRow[]>([]);
  const [distData, setDistData] = useState<DistributionReportRow[]>([]);
  const [topData, setTopData] = useState<TopProduct[]>([]);
  const [stockData, setStockData] = useState<StockReportRow[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeReport === "sales")
        setSalesData(await getSalesReport(startDate, endDate));
      else if (activeReport === "distribution")
        setDistData(await getDistributionReport(startDate, endDate));
      else if (activeReport === "topProducts")
        setTopData(await getTopProducts(10));
      else setStockData(await getStockReport(100));
    } catch {
      setError("Gagal memuat laporan. Coba refresh.");
    }
    setLoading(false);
  }, [activeReport, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportReportToExcel(
        activeReport,
        { salesData, distData, topData, stockData },
        { startDate, endDate, today },
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportReportToPDF(
        activeReport,
        { salesData, distData, topData, stockData },
        { startDate, endDate, today },
      );
    } finally {
      setExportingType(null);
    }
  };

  const tabs = [
    {
      id: "sales" as ReportType,
      label: "Ringkasan Transaksi",
      icon: ShoppingCart,
    },
    {
      id: "distribution" as ReportType,
      label: "Laporan Distribusi",
      icon: Truck,
    },
    {
      id: "topProducts" as ReportType,
      label: "Produk Terlaris",
      icon: TrendingUp,
    },
    { id: "stock" as ReportType, label: "Laporan Stok", icon: Package },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Transaksi
        </h1>
        <p className="text-gray-600">
          Generate dan export laporan bisnis dari data nyata
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveReport(id)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
              activeReport === id
                ? "border-blue-500 bg-blue-50"
                : "clay-raised-sm border-0 bg-white"
            }`}
          >
            <Icon
              className={`w-7 h-7 mb-2 ${activeReport === id ? "text-blue-600" : "text-gray-500"}`}
            />
            <p
              className={`font-medium text-sm ${activeReport === id ? "text-blue-900" : "text-gray-700"}`}
            >
              {label}
            </p>
          </button>
        ))}
      </div>

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
          ) : (
            <>
              {activeReport === "sales" && (
                <SalesReportTable
                  data={salesData}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
              {activeReport === "distribution" && (
                <DistributionReportTable
                  data={distData}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
              {activeReport === "topProducts" && (
                <TopProductsTable data={topData} />
              )}
              {activeReport === "stock" && (
                <StockReportTable data={stockData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
