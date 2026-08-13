import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
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
const formatRpShort = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  if (abs >= 1_000) return (n / 1_000).toFixed(0) + "rb";
  return n.toString();
};

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

  const stockHealthPct =
    stats && stats.totalStock > 0
      ? Math.max(
          6,
          Math.min(
            100,
            Math.round(
              ((stats.totalStock - stats.lowStockCount * 20) /
                stats.totalStock) *
                100,
            ),
          ),
        )
      : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-[#0249E1] to-[#80B0EC] rounded-[28px] p-5 text-white relative overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full bg-[#DAFB71]/20 blur-2xl -top-8 -right-8" />
        <p className="text-sm text-white/80 font-medium relative">
          Selamat datang,
        </p>
        <p className="text-xl font-extrabold relative">{user.namaSales}</p>
      </div>

      {error && (
        <div className="p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#EE3D5A] flex-shrink-0" />
          <p className="text-sm text-[#EE3D5A] font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#0249E1]/30 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/40 font-medium">
            Memuat data...
          </p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl p-4 shadow-sm shadow-black/[0.03]">
              <div className="w-10 h-10 bg-[#DAFB71] rounded-2xl flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-[#111111]" />
              </div>
              <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide">
                Penjualan Hari Ini
              </p>
              <p className="text-lg font-extrabold text-[#111111] mt-0.5">
                {formatRp(stats.totalSalesToday)}
              </p>
              <p className="text-[11px] text-[#111111]/40 font-medium">
                {stats.totalTransactionsToday} transaksi
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm shadow-black/[0.03]">
              <div className="w-10 h-10 bg-[#0249E1] rounded-2xl flex items-center justify-center mb-3">
                {stats.komisiToday >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-white" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-white" />
                )}
              </div>
              <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide">
                Komisi Hari Ini
              </p>
              <p
                className={`text-lg font-extrabold mt-0.5 ${
                  stats.komisiToday >= 0 ? "text-[#0249E1]" : "text-[#EE3D5A]"
                }`}
              >
                {formatRp(stats.komisiToday)}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm shadow-black/[0.03]">
              <div className="w-10 h-10 bg-[#80B0EC] rounded-2xl flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-white" />
              </div>
              <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide">
                Total Stok Anda
              </p>
              <p className="text-lg font-extrabold text-[#111111] mt-0.5">
                {stats.totalStock} unit
              </p>
            </div>

            <button
              onClick={() => onNavigate("setoran")}
              className="bg-white rounded-3xl p-4 shadow-sm shadow-black/[0.03] text-left cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 bg-[#EE3D5A] rounded-2xl flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide">
                Belum Disetor
              </p>
              <p className="text-lg font-extrabold text-[#EE3D5A] mt-0.5">
                {formatRp(stats.belumDisetorToday)}
              </p>
            </button>
          </div>

          {stats.hasStock && (
            <div className="bg-white rounded-3xl p-5 shadow-sm shadow-black/[0.03] flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke="#F4F7FE"
                    strokeWidth="7"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke={stockHealthPct > 50 ? "#DAFB71" : "#EE3D5A"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${(stockHealthPct / 100) * 169.6} 169.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold text-[#111111]">
                    {stockHealthPct}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#111111]">
                  Kesehatan Stok
                </p>
                <p className="text-xs text-[#111111]/45 font-medium">
                  {stats.lowStockCount > 0
                    ? `${stats.lowStockCount} produk perlu direstok`
                    : "Semua produk stoknya aman"}
                </p>
              </div>
            </div>
          )}

          {stats.lowStockCount > 0 && (
            <div className="bg-[#EE3D5A]/[0.06] border border-[#EE3D5A]/15 rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4.5 h-4.5 text-[#EE3D5A]" />
                <p className="text-sm font-bold text-[#111111]">
                  {stats.lowStockCount} produk stok menipis
                </p>
              </div>
              <div className="space-y-2">
                {stats.lowStockProducts.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[#111111]/60 font-medium">
                      {p.name}
                    </span>
                    <span className="font-bold text-[#EE3D5A]">
                      {p.stock} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate("transaction")}
            className="w-full flex items-center justify-between bg-[#111111] rounded-3xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#DAFB71] rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#111111]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">
                  Mulai Transaksi Baru
                </p>
                <p className="text-xs text-white/50 font-medium">
                  Catat penjualan ke customer
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/50" />
          </button>
        </>
      ) : null}
    </div>
  );
}
