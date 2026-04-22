import { useState } from "react";
import {
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { StockTransactionModal } from "./StockTransactionModal";

interface StockItem {
  id: string;
  productName: string;
  kategori: "Cup" | "Botol";
  stokPusat: number;
  stokDistributor: number;
  minimumStok: number;
}

interface StockMovement {
  id: string;
  date: string;
  productName: string;
  type: "masuk" | "keluar";
  category: "produksi" | "restok" | "distributor" | "penjualan";
  quantity: number;
  from: string;
  to: string;
  notes: string;
}

const stockData: StockItem[] = [
  {
    id: "1",
    productName: "Arroyyan99 Cup Kecil",
    kategori: "Cup",
    stokPusat: 500,
    stokDistributor: 250,
    minimumStok: 200,
  },
  {
    id: "2",
    productName: "Arroyyan99 Cup Sedang",
    kategori: "Cup",
    stokPusat: 50,
    stokDistributor: 100,
    minimumStok: 100,
  },
  {
    id: "3",
    productName: "Arroyyan99 Botol Kecil",
    kategori: "Botol",
    stokPusat: 30,
    stokDistributor: 80,
    minimumStok: 80,
  },
  {
    id: "4",
    productName: "Arroyyan99 Botol Sedang",
    kategori: "Botol",
    stokPusat: 300,
    stokDistributor: 150,
    minimumStok: 150,
  },
];

const movementHistory: StockMovement[] = [
  {
    id: "1",
    date: "2026-04-21 10:30",
    productName: "Arroyyan99 Cup Kecil",
    type: "masuk",
    category: "produksi",
    quantity: 500,
    from: "Produksi",
    to: "Stok Pusat",
    notes: "Produksi batch #2024",
  },
  {
    id: "2",
    date: "2026-04-21 09:15",
    productName: "Arroyyan99 Cup Sedang",
    type: "keluar",
    category: "distributor",
    quantity: 200,
    from: "Stok Pusat",
    to: "Distributor Jakarta",
    notes: "Pengiriman ke Distributor Jakarta",
  },
  {
    id: "3",
    date: "2026-04-20 14:20",
    productName: "Arroyyan99 Botol Kecil",
    type: "keluar",
    category: "penjualan",
    quantity: 50,
    from: "Stok Distributor",
    to: "Toko Maju Jaya",
    notes: "Penjualan langsung",
  },
  {
    id: "4",
    date: "2026-04-20 11:00",
    productName: "Arroyyan99 Botol Sedang",
    type: "masuk",
    category: "restok",
    quantity: 300,
    from: "Supplier",
    to: "Stok Pusat",
    notes: "Restok dari supplier",
  },
];

export function StockManagement() {
  const [activeTab, setActiveTab] = useState<"overview" | "movement">(
    "overview",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"masuk" | "keluar">(
    "masuk",
  );

  const handleAddTransaction = (type: "masuk" | "keluar") => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const lowStockItems = stockData.filter(
    (item) => item.stokPusat < item.minimumStok,
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Manajemen Stok
        </h1>
        <p className="text-gray-600">Kelola stok pusat dan distributor</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">
              Peringatan Stok Minimum
            </h3>
            <p className="text-sm text-orange-700">
              {lowStockItems.length} produk memiliki stok di bawah minimum.
              Segera lakukan restok!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Pusat</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stockData.reduce((sum, item) => sum + item.stokPusat, 0)} Unit
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Distributor</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stockData.reduce((sum, item) => sum + item.stokDistributor, 0)}{" "}
            Unit
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Produk Stok Kritis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {lowStockItems.length} Produk
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Ringkasan Stok
              </button>
              <button
                onClick={() => setActiveTab("movement")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "movement"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Riwayat Pergerakan
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAddTransaction("masuk")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                Stok Masuk
              </button>
              <button
                onClick={() => handleAddTransaction("keluar")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                Stok Keluar
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Produk
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Kategori
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Stok Pusat
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Stok Distributor
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Total Stok
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Min. Stok
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item) => {
                    const totalStok = item.stokPusat + item.stokDistributor;
                    const isLowStock = item.stokPusat < item.minimumStok;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              item.kategori === "Cup"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">
                            {item.stokPusat}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">
                            {item.stokDistributor}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {totalStok}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {item.minimumStok}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3" />
                              Stok Rendah
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="space-y-4">
                {movementHistory.map((movement) => (
                  <div
                    key={movement.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            movement.type === "masuk"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {movement.type === "masuk" ? (
                            <TrendingUp
                              className={`w-5 h-5 ${
                                movement.type === "masuk"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {movement.productName}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{movement.from}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{movement.to}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            movement.type === "masuk"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {movement.type === "masuk" ? "+" : "-"}
                          {movement.quantity}
                        </p>
                        <p className="text-xs text-gray-500">{movement.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          movement.category === "produksi"
                            ? "bg-blue-100 text-blue-700"
                            : movement.category === "restok"
                              ? "bg-purple-100 text-purple-700"
                              : movement.category === "distributor"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {movement.category.charAt(0).toUpperCase() +
                          movement.category.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {movement.notes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <StockTransactionModal
          type={transactionType}
          onClose={() => setIsModalOpen(false)}
          onSave={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
