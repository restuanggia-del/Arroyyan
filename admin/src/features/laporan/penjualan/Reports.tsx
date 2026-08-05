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

type ReportType = "sales" | "distribution" | "topProducts" | "stock";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

const exportToExcel = async (data: any[], fileName: string) => {
  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch {
    alert("Gagal export Excel.\nJalankan: npm install xlsx");
  }
};

const exportToPDF = async (
  title: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ARROYYAN99 — " + title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 28);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`${fileName}.pdf`);
  } catch {
    alert("Gagal export PDF.\nJalankan: npm install jspdf jspdf-autotable");
  }
};

function ProductCell({ items }: { items: string }) {
  const parts = items
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const first = parts[0] ?? "—";
  const rest = parts.length - 1;

  return (
    <div className="flex items-center gap-1.5 max-w-[220px]">
      <span className="truncate text-sm text-gray-800">{first}</span>
      {rest > 0 && (
        <span
          className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full cursor-default"
          title={parts.slice(1).join(", ")}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";

  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
    setExporting(true);
    if (activeReport === "sales") {
      await exportToExcel(
        salesData.map((r) => ({
          Tanggal: r.date,
          "No.": r.id,
          Pelanggan: r.customer,
          Karyawan: r.karyawan,
          Produk: r.items,
          Total: r.total,
          Pembayaran: r.payment,
        })),
        `laporan-penjualan-${startDate}-${endDate}`,
      );
    } else if (activeReport === "distribution") {
      await exportToExcel(
        distData.map((r) => ({
          Tanggal: r.date,
          "No.": r.id,
          Karyawan: r.karyawan,
          Produk: r.items,
          "Total Qty": r.totalQty,
          Status: r.status,
        })),
        `laporan-distribusi-${startDate}-${endDate}`,
      );
    } else if (activeReport === "topProducts") {
      await exportToExcel(
        topData.map((r, i) => ({
          Peringkat: i + 1,
          Produk: r.product_name,
          Kategori: r.category,
          "Total Terjual": r.totalSold,
          Pendapatan: r.revenue,
        })),
        "laporan-produk-terlaris",
      );
    } else {
      await exportToExcel(
        stockData.map((r) => ({
          Produk: r.product_name,
          Kategori: r.category,
          "Stok Pusat": r.stockPusat,
          "Stok Karyawan": r.stockKaryawan,
          Total: r.total,
          Minimum: r.minimum,
          Status: r.status,
        })),
        `laporan-stok-${today}`,
      );
    }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    if (activeReport === "sales") {
      await exportToPDF(
        `Laporan Penjualan (${startDate} s/d ${endDate})`,
        [
          "Tanggal",
          "No.",
          "Pelanggan",
          "Karyawan",
          "Produk",
          "Total",
          "Bayar",
        ],
        salesData.map((r) => [
          r.date,
          r.id,
          r.customer,
          r.karyawan,
          r.items,
          formatRp(r.total),
          r.payment,
        ]),
        `laporan-penjualan-${startDate}-${endDate}`,
      );
    } else if (activeReport === "distribution") {
      await exportToPDF(
        `Laporan Distribusi (${startDate} s/d ${endDate})`,
        ["Tanggal", "No.", "Karyawan", "Produk", "Qty", "Status"],
        distData.map((r) => [
          r.date,
          r.id,
          r.karyawan,
          r.items,
          r.totalQty,
          r.status,
        ]),
        `laporan-distribusi-${startDate}-${endDate}`,
      );
    } else if (activeReport === "topProducts") {
      await exportToPDF(
        "Laporan Produk Terlaris",
        ["No", "Produk", "Kategori", "Terjual", "Pendapatan"],
        topData.map((r, i) => [
          i + 1,
          r.product_name,
          r.category,
          r.totalSold,
          formatRp(r.revenue),
        ]),
        "laporan-produk-terlaris",
      );
    } else {
      await exportToPDF(
        `Laporan Stok (${today})`,
        [
          "Produk",
          "Kategori",
          "Pusat",
          "Karyawan",
          "Total",
          "Min",
          "Status",
        ],
        stockData.map((r) => [
          r.product_name,
          r.category,
          r.stockPusat,
          r.stockKaryawan,
          r.total,
          r.minimum,
          r.status,
        ]),
        `laporan-stok-${today}`,
      );
    }
    setExporting(false);
  };

  const renderSales = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Laporan Penjualan
          </h3>
          <p className="text-sm text-gray-500">
            Periode: {startDate} s/d {endDate}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-gray-500">Total Penjualan</p>
          <p className="text-xl font-bold text-blue-600">
            {formatRp(salesData.reduce((s, r) => s + r.total, 0))}
          </p>
        </div>
      </div>
      {salesData.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada data penjualan pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {[
                  "Tanggal",
                  "No. Transaksi",
                  "Pelanggan",
                  "Karyawan",
                  "Produk",
                  "Total",
                  "Bayar",
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
              {salesData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-3 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-3 font-mono font-medium">#{row.id}</td>
                  <td className="py-3 px-3">{row.customer}</td>
                  <td className="py-3 px-3 text-gray-500">{row.karyawan}</td>
                  <td
                    className="py-3 px-3 max-w-[200px] truncate"
                    title={row.items}
                  >
                    {row.items}
                  </td>
                  <td className="py-3 px-3 font-semibold text-left whitespace-nowrap">
                    {formatRp(row.total)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.payment === "Cash"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDistribution = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Distribusi
        </h3>
        <p className="text-sm text-gray-500">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>
      {distData.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada data distribusi pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {[
                  "Tanggal",
                  "No. Distribusi",
                  "Karyawan",
                  "Produk",
                  "Total Qty",
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
              {distData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-3 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-3 font-mono font-medium">#{row.id}</td>
                  <td className="py-3 px-3">{row.karyawan}</td>
                  <td className="py-3 px-3">
                    <ProductCell items={row.items} />
                  </td>
                  <td className="py-3 px-3 text-left font-semibold">
                    {row.totalQty} unit
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === "Diterima"
                          ? "bg-green-100 text-green-700"
                          : row.status === "Dikirim"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTopProducts = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Produk Terlaris
        </h3>
        <p className="text-sm text-gray-500">
          Berdasarkan total transaksi keseluruhan
        </p>
      </div>
      {topData.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Belum ada data transaksi
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {["#", "Produk", "Kategori", "Total Terjual", "Pendapatan"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {topData.map((row, i) => (
                <tr
                  key={row.product_id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-3">
                    <span
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : i === 1
                            ? "bg-gray-200 text-gray-700"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">{row.product_name}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.category === "cup"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {row.category === "cup" ? "Cup" : "Botol"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {row.totalSold} unit
                  </td>
                  <td className="py-3 px-3 font-semibold text-green-600">
                    {formatRp(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderStock = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Laporan Stok</h3>
        <p className="text-sm text-gray-500">Snapshot stok saat ini</p>
      </div>
      {stockData.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Belum ada data stok
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {[
                  "Produk",
                  "Kategori",
                  "Stok Pusat",
                  "Stok Karyawan",
                  "Total",
                  "Min. Stok",
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
              {stockData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-3 font-medium">{row.product_name}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.category === "cup"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {row.category === "cup" ? "Cup" : "Botol"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-left">{row.stockPusat}</td>
                  <td className="py-3 px-3 text-left">
                    {row.stockKaryawan}
                  </td>
                  <td className="py-3 px-3 text-left font-semibold">
                    {row.total}
                  </td>
                  <td className="py-3 px-3 text-left text-gray-500">
                    {row.minimum}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === "Aman"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      id: "sales" as ReportType,
      label: "Laporan Penjualan",
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan</h1>
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
                : "border-gray-200 hover:border-gray-300 bg-white"
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

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-end justify-between flex-wrap gap-4">
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting || loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exporting ? (
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
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
              {activeReport === "sales" && renderSales()}
              {activeReport === "distribution" && renderDistribution()}
              {activeReport === "topProducts" && renderTopProducts()}
              {activeReport === "stock" && renderStock()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
