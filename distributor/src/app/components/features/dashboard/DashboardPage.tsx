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
  History,
} from "lucide-react";
import { getDashboardStats, SalesUser } from "../../../services";

interface DashboardPageProps {
  user: SalesUser;
  onNavigate: (tab: string) => void;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

const getGreetingInfo = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return { text: "Selamat Pagi", emoji: "🌅" };
  if (hour >= 11 && hour < 15) return { text: "Selamat Siang", emoji: "☀️" };
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", emoji: "🌇" };
  return { text: "Selamat Malam", emoji: "🌙" };
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

  const { text: greetingText, emoji: greetingEmoji } = getGreetingInfo();

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
      <div className="bg-gradient-to-br from-[#4a86f4] to-[#0249E1] rounded-[28px] p-5 text-white relative overflow-hidden shadow-[10px_10px_24px_rgba(2,55,150,0.35),-6px_-6px_16px_rgba(150,195,255,0.25)]">
        <div className="absolute w-32 h-32 rounded-full bg-[#DAFB71]/20 blur-2xl -top-8 -right-8" />
        <div className="flex items-start justify-between relative">
          <div className="flex-1">
            <p className="text-sm text-white/80 font-medium">
              Selamat Datang 👋
            </p>
            <p className="text-xl font-extrabold">{user.namaSales}</p>
            <p className="text-sm text-white/80 font-medium mt-1">
              {greetingText}
            </p>
          </div>
          <div className="text-5xl ml-4">{greetingEmoji}</div>
        </div>
      </div>

      {error && (
        <div className="p-3 clay-inset-sm rounded-2xl flex items-center gap-2">
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
            <div className="clay-raised rounded-3xl p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71] rounded-2xl flex items-center justify-center mb-3 shadow-[3px_3px_8px_rgba(163,190,225,0.5),-2px_-2px_6px_rgba(255,255,255,0.8)]">
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

            <div className="clay-raised rounded-3xl p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4a86f4] to-[#0249E1] rounded-2xl flex items-center justify-center mb-3 shadow-[3px_3px_8px_rgba(163,190,225,0.5),-2px_-2px_6px_rgba(255,255,255,0.8)]">
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

            <div className="clay-raised rounded-3xl p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#a9c9f7] to-[#80B0EC] rounded-2xl flex items-center justify-center mb-3 shadow-[3px_3px_8px_rgba(163,190,225,0.5),-2px_-2px_6px_rgba(255,255,255,0.8)]">
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
              className="clay-raised clay-pressable rounded-3xl p-4 text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#f4657d] to-[#EE3D5A] rounded-2xl flex items-center justify-center mb-3 shadow-[3px_3px_8px_rgba(163,190,225,0.5),-2px_-2px_6px_rgba(255,255,255,0.8)]">
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
            <div className="clay-raised rounded-3xl p-5 flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke="#dfeeff"
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
            <div className="clay-inset rounded-3xl p-4">
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
            className="clay-pressable w-full flex items-center justify-between rounded-3xl p-4 cursor-pointer bg-gradient-to-br from-[#202b52] to-[#0c1330] shadow-[8px_8px_18px_rgba(4,8,26,0.4),-6px_-6px_14px_rgba(90,120,200,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71] rounded-2xl flex items-center justify-center shadow-[3px_3px_8px_rgba(0,0,0,0.3)]">
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

          <button
            onClick={() => onNavigate("history")}
            className="clay-raised clay-pressable w-full flex items-center justify-between rounded-3xl p-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 clay-inset-sm rounded-2xl flex items-center justify-center">
                <History className="w-5 h-5 text-[#0249E1]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#111111]">
                  Lihat Riwayat Transaksi
                </p>
                <p className="text-xs text-[#111111]/40 font-medium">
                  Semua transaksi yang sudah tercatat
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#111111]/30" />
          </button>
        </>
      ) : null}
    </div>
  );
}
