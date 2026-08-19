import { useState, useEffect, useCallback } from "react";
import {
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Briefcase,
} from "lucide-react";
import { StockTransactionModal } from "./StockTransactionModal";
import {
  getAllStockSummary,
  getStockMovements,
  StockItem,
  StockMovement,
  MINIMUM_STOCK,
} from "../../../services/stockService";

interface ProductStockSummary {
  product_id: string;
  product_name: string;
  category: "cup" | "botol";
  stokPusat: number;
  stokKaryawan: number;
  stokSales: number;
  minimumStok: number;
}

function buildSummary(items: StockItem[]): ProductStockSummary[] {
  const map: Record<string, ProductStockSummary> = {};

  for (const item of items) {
    const pid = item.product_id;
    if (!map[pid]) {
      map[pid] = {
        product_id: pid,
        product_name: item.products?.product_name ?? "—",
        category: (item.products?.category ?? "cup") as "cup" | "botol",
        stokPusat: 0,
        stokKaryawan: 0,
        stokSales: 0,
        minimumStok: MINIMUM_STOCK,
      };
    }
    if (item.karyawan_id === null && item.sales_id === null) {
      map[pid].stokPusat += item.stock_quantity;
    } else if (item.karyawan_id !== null) {
      map[pid].stokKaryawan += item.stock_quantity;
    } else if (item.sales_id !== null) {
      map[pid].stokSales += item.stock_quantity;
    }
  }

  return Object.values(map);
}

const movementLabel: Record<string, string> = {
  stock_in: "Produksi / Restok",
  stok_awal: "Stok Awal (Opname)",
  distribution_out: "Kirim ke Karyawan/Sales",
  distribution_in: "Diterima Karyawan/Sales",
  sale_out: "Penjualan",
  sodaqoh_out: "Sodaqoh",
  pribadi_out: "Pemakaian Pribadi",
  bonus_out: "Bonus / Hadiah Barang",
  return_out: "Retur ke Pabrik",
};

const movementColor: Record<string, string> = {
  stock_in: "bg-green-100 text-green-700",
  stok_awal: "bg-cyan-100 text-cyan-700",
  distribution_out: "bg-orange-100 text-orange-700",
  distribution_in: "bg-blue-100 text-blue-700",
  sale_out: "bg-[rgba(215,233,255,0.55)] text-gray-700",
  sodaqoh_out: "bg-purple-100 text-purple-700",
  pribadi_out: "bg-gray-100 text-gray-700",
  bonus_out: "bg-pink-100 text-pink-700",
  return_out: "bg-red-100 text-red-700",
};

export function StockManagement() {
  const [stockSummary, setStockSummary] = useState<ProductStockSummary[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "movement">(
    "overview",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "awal" | "masuk" | "keluar"
  >("masuk");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [stockRes, movRes] = await Promise.all([
      getAllStockSummary(),
      getStockMovements(50),
    ]);

    if (stockRes.error) {
      setError("Gagal memuat data stok.");
    } else {
      setStockSummary(buildSummary(stockRes.data || []));
    }

    if (!movRes.error) {
      setMovements(movRes.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddTransaction = (type: "awal" | "masuk" | "keluar") => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchAll();
  };

  const lowStockItems = stockSummary.filter(
    (item) => item.stokPusat < item.minimumStok,
  );

  const totalPusat = stockSummary.reduce((s, i) => s + i.stokPusat, 0);
  const totalDist = stockSummary.reduce((s, i) => s + i.stokKaryawan, 0);
  const totalSales = stockSummary.reduce((s, i) => s + i.stokSales, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Stok
          </h1>
          <p className="text-gray-600">
            Kelola stok pusat, karyawan, dan sales
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {!loading && lowStockItems.length > 0 && (
        <div className="clay-inset-amber border-0 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">
              Peringatan Stok Minimum
            </h3>
            <p className="text-sm text-orange-700">
              {lowStockItems.length} produk memiliki stok pusat di bawah{" "}
              {MINIMUM_STOCK} unit. Segera lakukan restok!
            </p>
            <ul className="mt-1 text-xs text-orange-600 list-disc list-inside">
              {lowStockItems.map((i) => (
                <li key={i.product_id}>
                  {i.product_name} — stok pusat: {i.stokPusat} unit
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Warehouse className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Pusat</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalPusat} Unit`}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Karyawan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalDist} Unit`}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Sales</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalSales} Unit`}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Produk Stok Kritis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${lowStockItems.length} Produk`}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-lg">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Ringkasan Stok
            </button>
            <button
              onClick={() => setActiveTab("movement")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "movement"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddTransaction("awal")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Stok Awal
            </button>
            <button
              onClick={() => handleAddTransaction("masuk")}
              className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Stok Masuk
            </button>
            <button
              onClick={() => handleAddTransaction("keluar")}
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              Stok Keluar
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data stok...</p>
            </div>
          ) : activeTab === "overview" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(140,172,214,0.35)]">
                    {[
                      "Produk",
                      "Kategori",
                      "Stok Pusat",
                      "Stok Karyawan",
                      "Stok Sales",
                      "Total",
                      "Min. Stok",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockSummary.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Belum ada data stok
                      </td>
                    </tr>
                  ) : (
                    stockSummary.map((item) => {
                      const isLow = item.stokPusat < item.minimumStok;
                      const total =
                        item.stokPusat + item.stokKaryawan + item.stokSales;
                      return (
                        <tr
                          key={item.product_id}
                          className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {item.product_name}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                item.category === "cup"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {item.category === "cup" ? "Cup" : "Botol"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.stokPusat}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.stokKaryawan}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {item.stokSales}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            {total}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {item.minimumStok}
                          </td>
                          <td className="py-3 px-4">
                            {isLow ? (
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-sm">
                  Belum ada riwayat pergerakan stok
                </p>
              ) : (
                movements.map((mov) => {
                  const isIn =
                    mov.movement_type === "stock_in" ||
                    mov.movement_type === "stok_awal" ||
                    mov.movement_type === "distribution_in";
                  return (
                    <div
                      key={mov.id}
                      className="clay-raised-sm clay-pressable border-0 rounded-xl p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isIn ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {isIn ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-0.5">
                              {mov.products?.product_name ?? "—"}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                              <span>
                                {mov.karyawan?.nama ??
                                  mov.sales?.nama_sales ??
                                  "Stok Pusat"}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{isIn ? "Stok Masuk" : "Stok Keluar"}</span>
                            </div>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                movementColor[mov.movement_type] ??
                                "bg-[rgba(215,233,255,0.55)] text-gray-600"
                              }`}
                            >
                              {movementLabel[mov.movement_type] ??
                                mov.movement_type}
                            </span>
                            {mov.note && (
                              <p className="text-xs text-gray-500 mt-1">
                                {mov.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p
                            className={`text-lg font-bold ${
                              isIn ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIn ? "+" : "-"}
                            {mov.quantity}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(mov.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <StockTransactionModal
          type={transactionType}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
