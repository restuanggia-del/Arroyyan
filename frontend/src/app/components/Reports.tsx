import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Truck,
  ShoppingCart,
  FileSpreadsheet,
  File,
} from "lucide-react";

type ReportType = "sales" | "distribution" | "topProducts" | "stock";

interface SalesData {
  date: string;
  transactionId: string;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  payment: string;
}

interface DistributionData {
  date: string;
  distributionId: string;
  distributor: string;
  product: string;
  quantity: number;
  status: string;
}

interface TopProductData {
  rank: number;
  product: string;
  category: string;
  totalSold: number;
  revenue: number;
}

interface StockData {
  product: string;
  category: string;
  stockPusat: number;
  stockDistributor: number;
  minimumStock: number;
  status: string;
}

const salesData: SalesData[] = [
  {
    date: "2026-04-21",
    transactionId: "TRX001",
    customer: "Budi Santoso",
    product: "Arroyyan99 Cup Sedang",
    quantity: 10,
    total: 50000,
    payment: "Cash",
  },
  {
    date: "2026-04-21",
    transactionId: "TRX002",
    customer: "Siti Nurhaliza",
    product: "Arroyyan99 Botol Kecil",
    quantity: 5,
    total: 20000,
    payment: "Transfer",
  },
  {
    date: "2026-04-20",
    transactionId: "TRX003",
    customer: "Ahmad Rizki",
    product: "Arroyyan99 Cup Kecil",
    quantity: 15,
    total: 45000,
    payment: "Cash",
  },
  {
    date: "2026-04-20",
    transactionId: "TRX004",
    customer: "Dewi Lestari",
    product: "Arroyyan99 Botol Sedang",
    quantity: 8,
    total: 48000,
    payment: "Transfer",
  },
  {
    date: "2026-04-19",
    transactionId: "TRX005",
    customer: "Rudi Hartono",
    product: "Arroyyan99 Cup Sedang",
    quantity: 12,
    total: 60000,
    payment: "Cash",
  },
];

const distributionData: DistributionData[] = [
  {
    date: "2026-04-21",
    distributionId: "DIST001",
    distributor: "Distributor Jakarta",
    product: "Arroyyan99 Cup Sedang",
    quantity: 500,
    status: "Selesai",
  },
  {
    date: "2026-04-21",
    distributionId: "DIST002",
    distributor: "Distributor Bandung",
    product: "Arroyyan99 Botol Kecil",
    quantity: 300,
    status: "Dalam Perjalanan",
  },
  {
    date: "2026-04-20",
    distributionId: "DIST003",
    distributor: "Distributor Surabaya",
    product: "Arroyyan99 Cup Kecil",
    quantity: 400,
    status: "Selesai",
  },
  {
    date: "2026-04-20",
    distributionId: "DIST004",
    distributor: "Distributor Semarang",
    product: "Arroyyan99 Botol Sedang",
    quantity: 250,
    status: "Pending",
  },
];

const topProductsData: TopProductData[] = [
  {
    rank: 1,
    product: "Arroyyan99 Cup Sedang",
    category: "Cup",
    totalSold: 2500,
    revenue: 12500000,
  },
  {
    rank: 2,
    product: "Arroyyan99 Botol Kecil",
    category: "Botol",
    totalSold: 2100,
    revenue: 8400000,
  },
  {
    rank: 3,
    product: "Arroyyan99 Cup Kecil",
    category: "Cup",
    totalSold: 1800,
    revenue: 5400000,
  },
  {
    rank: 4,
    product: "Arroyyan99 Botol Sedang",
    category: "Botol",
    totalSold: 800,
    revenue: 4800000,
  },
];

const stockData: StockData[] = [
  {
    product: "Arroyyan99 Cup Kecil",
    category: "Cup",
    stockPusat: 500,
    stockDistributor: 250,
    minimumStock: 200,
    status: "Aman",
  },
  {
    product: "Arroyyan99 Cup Sedang",
    category: "Cup",
    stockPusat: 50,
    stockDistributor: 100,
    minimumStock: 100,
    status: "Kritis",
  },
  {
    product: "Arroyyan99 Botol Kecil",
    category: "Botol",
    stockPusat: 30,
    stockDistributor: 80,
    minimumStock: 80,
    status: "Kritis",
  },
  {
    product: "Arroyyan99 Botol Sedang",
    category: "Botol",
    stockPusat: 300,
    stockDistributor: 150,
    minimumStock: 150,
    status: "Aman",
  },
];

export function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-30");

  const handleExportPDF = () => {
    alert(
      "Export ke PDF akan segera diunduh...\n\nCatatan: Fitur ini memerlukan library seperti jsPDF untuk implementasi penuh.",
    );
  };

  const handleExportExcel = () => {
    alert(
      "Export ke Excel akan segera diunduh...\n\nCatatan: Fitur ini memerlukan library seperti xlsx untuk implementasi penuh.",
    );
  };

  const renderSalesReport = () => (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Laporan Penjualan
          </h3>
          <p className="text-sm text-gray-600">
            Periode: {startDate} s/d {endDate}
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-600">Total Penjualan</p>
          <p className="text-xl font-bold text-blue-600">
            Rp{" "}
            {salesData
              .reduce((sum, item) => sum + item.total, 0)
              .toLocaleString("id-ID")}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Tanggal
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                ID Transaksi
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Pelanggan
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Produk
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Jumlah
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Total
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Pembayaran
              </th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm">{item.date}</td>
                <td className="py-3 px-4 text-sm font-medium">
                  {item.transactionId}
                </td>
                <td className="py-3 px-4 text-sm">{item.customer}</td>
                <td className="py-3 px-4 text-sm">{item.product}</td>
                <td className="py-3 px-4 text-sm text-right">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold">
                  Rp {item.total.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.payment === "Cash"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.payment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDistributionReport = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Distribusi
        </h3>
        <p className="text-sm text-gray-600">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Tanggal
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                ID Distribusi
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Distributor
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Produk
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Jumlah
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {distributionData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm">{item.date}</td>
                <td className="py-3 px-4 text-sm font-medium">
                  {item.distributionId}
                </td>
                <td className="py-3 px-4 text-sm">{item.distributor}</td>
                <td className="py-3 px-4 text-sm">{item.product}</td>
                <td className="py-3 px-4 text-sm text-right">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.status === "Selesai"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Dalam Perjalanan"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTopProductsReport = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Laporan Produk Terlaris
        </h3>
        <p className="text-sm text-gray-600">
          Periode: {startDate} s/d {endDate}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                Peringkat
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Produk
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Kategori
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Total Terjual
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Pendapatan
              </th>
            </tr>
          </thead>
          <tbody>
            {topProductsData.map((item) => (
              <tr
                key={item.rank}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-center">
                  <span
                    className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold text-sm ${
                      item.rank === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : item.rank === 2
                          ? "bg-gray-200 text-gray-700"
                          : item.rank === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.rank}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-medium">
                  {item.product}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.category === "Cup"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold">
                  {item.totalSold} unit
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                  Rp {item.revenue.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStockReport = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Laporan Stok</h3>
        <p className="text-sm text-gray-600">Snapshot per {endDate}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Produk
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Kategori
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Stok Pusat
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Stok Distributor
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Total Stok
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Min. Stok
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm font-medium">
                  {item.product}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.category === "Cup"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  {item.stockPusat}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  {item.stockDistributor}
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold">
                  {item.stockPusat + item.stockDistributor}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  {item.minimumStock}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.status === "Aman"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan</h1>
        <p className="text-gray-600">Generate dan export laporan bisnis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveReport("sales")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeReport === "sales"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <ShoppingCart
            className={`w-8 h-8 mx-auto mb-2 ${
              activeReport === "sales" ? "text-blue-600" : "text-gray-600"
            }`}
          />
          <p
            className={`font-medium text-sm ${
              activeReport === "sales" ? "text-blue-900" : "text-gray-900"
            }`}
          >
            Laporan Penjualan
          </p>
        </button>

        <button
          onClick={() => setActiveReport("distribution")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeReport === "distribution"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Truck
            className={`w-8 h-8 mx-auto mb-2 ${
              activeReport === "distribution"
                ? "text-blue-600"
                : "text-gray-600"
            }`}
          />
          <p
            className={`font-medium text-sm ${
              activeReport === "distribution"
                ? "text-blue-900"
                : "text-gray-900"
            }`}
          >
            Laporan Distribusi
          </p>
        </button>

        <button
          onClick={() => setActiveReport("topProducts")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeReport === "topProducts"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <TrendingUp
            className={`w-8 h-8 mx-auto mb-2 ${
              activeReport === "topProducts" ? "text-blue-600" : "text-gray-600"
            }`}
          />
          <p
            className={`font-medium text-sm ${
              activeReport === "topProducts" ? "text-blue-900" : "text-gray-900"
            }`}
          >
            Produk Terlaris
          </p>
        </button>

        <button
          onClick={() => setActiveReport("stock")}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeReport === "stock"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Package
            className={`w-8 h-8 mx-auto mb-2 ${
              activeReport === "stock" ? "text-blue-600" : "text-gray-600"
            }`}
          />
          <p
            className={`font-medium text-sm ${
              activeReport === "stock" ? "text-blue-900" : "text-gray-900"
            }`}
          >
            Laporan Stok
          </p>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-500 mt-6">-</span>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
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
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <File className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeReport === "sales" && renderSalesReport()}
          {activeReport === "distribution" && renderDistributionReport()}
          {activeReport === "topProducts" && renderTopProductsReport()}
          {activeReport === "stock" && renderStockReport()}
        </div>
      </div>
    </div>
  );
}
