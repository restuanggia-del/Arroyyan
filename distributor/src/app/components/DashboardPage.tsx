import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { getDashboardStats, SalesUser } from "../services/SalesAppService";

interface DashboardPageProps {
  user: SalesUser;
  onNavigate: (tab: string) => void;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function DashboardPage({
  user,
  onNavigate,
}: DashboardPageProps) {
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof getDashboardStats>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardStats(user.salesId);
      setStats(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, [user.salesId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-blue-900 to-cyan-600 rounded-2xl p-5 text-white">
        <p className="text-sm text-white/80">Selamat datang,</p>
        <p className="text-lg font-bold">{user.namaSales}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-gray-300 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <ShoppingBag className="w-4.5 h-4.5 text-green-600" />
              </div>
              <p className="text-xs text-gray-500">Penjualan Hari Ini</p>
              <p className="text-base font-bold text-gray-900">
                {formatRp(stats.totalSalesToday)}
              </p>
              <p className="text-[11px] text-gray-400">
                {stats.totalTransactionsToday} transaksi
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="w-9 h-9 bg-cyan-100 rounded-xl flex items-center justify-center mb-2">
                <TrendingUp className="w-4.5 h-4.5 text-cyan-600" />
              </div>
              <p className="text-xs text-gray-500">Komisi Hari Ini</p>
              <p
                className={`text-base font-bold ${stats.komisiToday >= 0 ? "text-cyan-700" : "text-red-600"}`}
              >
                {formatRp(stats.komisiToday)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <Package className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500">Total Stok Anda</p>
              <p className="text-base font-bold text-gray-900">
                {stats.totalStock} unit
              </p>
            </div>

            <button
              onClick={() => onNavigate("setoran")}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left cursor-pointer hover:border-orange-200 transition-colors"
            >
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                <Wallet className="w-4.5 h-4.5 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500">Belum Disetor</p>
              <p className="text-base font-bold text-orange-700">
                {formatRp(stats.belumDisetorToday)}
              </p>
            </button>
          </div>

          {stats.lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">
                  {stats.lowStockCount} produk stok menipis
                </p>
              </div>
              <div className="space-y-1.5">
                {stats.lowStockProducts.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs text-amber-700"
                  >
                    <span>{p.name}</span>
                    <span className="font-semibold">
                      {p.stock} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate("transaction")}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 hover:border-cyan-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Mulai Transaksi Baru
                </p>
                <p className="text-xs text-gray-500">
                  Catat penjualan ke customer
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </>
      ) : null}
    </div>
  );
}
