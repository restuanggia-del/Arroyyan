import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { getAllDistributions } from "../../../services/distributionService";
import { today, firstOfMonth } from "../../../lib/dateUtils";
import {
  DistRow,
  StatusFilter,
  TabId,
  TABS,
  LAPORAN_DISTRIBUSI_SALES_ROLES,
  toRow,
  itemsToText,
  buildSummaryBySales,
  buildSummaryByProduct,
} from "./distribusiSalesUtils";
import {
  exportDistribusiSalesExcel,
  exportDistribusiSalesPdf,
} from "./distribusiSalesExportUtils";
import { DistribusiSalesSummaryCards } from "./DistribusiSalesSummaryCards";
import { DistribusiSalesFilters } from "./DistribusiSalesFilters";
import { RincianDistribusiTable } from "./RincianDistribusiTable";
import { RekapPerSalesTable } from "./RekapPerSalesTable";
import { RekapPerProdukTable } from "./RekapPerProdukTable";

export { LAPORAN_DISTRIBUSI_SALES_ROLES };

interface LaporanDistribusiSalesProps {
  role?: string | null;
}

export function LaporanDistribusiSales({ role }: LaporanDistribusiSalesProps) {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [salesFilter, setSalesFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("rincian");

  const [allRows, setAllRows] = useState<DistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );

  const hasAccess =
    role === undefined ||
    (!!role && LAPORAN_DISTRIBUSI_SALES_ROLES.includes(role));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllDistributions();
    if (error) {
      setError("Gagal memuat laporan distribusi ke sales. Coba refresh.");
      setAllRows([]);
    } else {
      setAllRows((data ?? []).filter((d) => d.sales_id).map(toRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasAccess) fetchReport();
  }, [fetchReport, hasAccess]);

  const dateError =
    startDate && endDate && startDate > endDate
      ? "Tanggal mulai tidak boleh setelah tanggal akhir."
      : null;

  const salesOptions = useMemo(() => {
    const map = new Map<string, string>();
    allRows.forEach((r) => map.set(r.salesId, r.salesName));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows]);

  const rows = useMemo(() => {
    if (dateError) return [];
    const q = search.trim().toLowerCase();
    return allRows
      .filter((r) => {
        const d = r.date.slice(0, 10);
        if (d < startDate || d > endDate) return false;
        if (salesFilter !== "all" && r.salesId !== salesFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (q) {
          const hay =
            `${r.shortId} ${r.salesName} ${itemsToText(r.items)} ${r.keterangan}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    allRows,
    startDate,
    endDate,
    salesFilter,
    statusFilter,
    search,
    dateError,
  ]);

  const summaryBySales = useMemo(() => buildSummaryBySales(rows), [rows]);
  const summaryByProduct = useMemo(() => buildSummaryByProduct(rows), [rows]);

  const totalQty = rows.reduce((s, r) => s + r.totalQty, 0);
  const totalDiterima = rows.filter((r) => r.status === "received").length;
  const rangeLabel = `${startDate} s/d ${endDate}`;

  const exportData = {
    rows,
    summaryBySales,
    summaryByProduct,
    startDate,
    endDate,
  };

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportDistribusiSalesExcel(activeTab, exportData);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPdf = async () => {
    setExportingType("pdf");
    try {
      await exportDistribusiSalesPdf(activeTab, exportData);
    } finally {
      setExportingType(null);
    }
  };

  if (!hasAccess) {
    return (
      <div className="p-8">
        <div className="clay-inset-red border-0 rounded-xl p-6 flex gap-3 items-start">
          <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-red-700 mb-1">Akses Ditolak</h2>
            <p className="text-sm text-red-700">
              Laporan Distribusi ke Sales hanya dapat diakses oleh Admin dan
              Admin Gudang.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Distribusi ke Sales
        </h1>
        <p className="text-gray-600">
          Rekap barang yang didistribusikan dari stok pusat ke sales, lengkap
          dengan status pengiriman
        </p>
      </div>

      <DistribusiSalesSummaryCards
        loading={loading}
        totalDistribusi={rows.length}
        totalQty={totalQty}
        jumlahSales={summaryBySales.length}
        totalDiterima={totalDiterima}
      />

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      <div className="clay-raised rounded-xl">
        <DistribusiSalesFilters
          startDate={startDate}
          endDate={endDate}
          salesFilter={salesFilter}
          statusFilter={statusFilter}
          search={search}
          salesOptions={salesOptions}
          loading={loading}
          exportingType={exportingType}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSalesChange={setSalesFilter}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
        />

        <div className="p-6">
          {(error || dateError) && (
            <div className="mb-4 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error ?? dateError}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat laporan...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h3>
                <p className="text-sm text-gray-500">Periode: {rangeLabel}</p>
              </div>

              {activeTab === "rincian" && (
                <RincianDistribusiTable rows={rows} totalQty={totalQty} />
              )}
              {activeTab === "per-sales" && (
                <RekapPerSalesTable data={summaryBySales} />
              )}
              {activeTab === "per-produk" && (
                <RekapPerProdukTable data={summaryByProduct} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
