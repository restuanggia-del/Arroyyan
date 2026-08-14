import { useState, useEffect, useCallback } from "react";
import {
  History,
  RefreshCw,
  AlertCircle,
  X,
  Receipt,
  Calendar,
} from "lucide-react";
import { getTransactionHistory } from "../../../services";

interface TransactionHistoryProps {
  salesId: string;
}

type TxRow = Awaited<ReturnType<typeof getTransactionHistory>>[number];

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

const paymentLabel: Record<string, string> = {
  cash: "TUNAI",
  transfer: "TRANSFER",
  kasbon: "KASBON",
};
const paymentColor: Record<string, string> = {
  cash: "bg-[#DAFB71]/25 text-[#0249E1]",
  transfer: "bg-[#80B0EC]/25 text-[#0249E1]",
  kasbon: "bg-[#EE3D5A]/12 text-[#EE3D5A]",
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function TransactionHistory({ salesId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState<"today" | "all" | "custom">("all");
  const [customDate, setCustomDate] = useState("");
  const [selected, setSelected] = useState<TxRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dateFilter =
        filterMode === "today"
          ? getTodayDate()
          : filterMode === "custom" && customDate
            ? customDate
            : undefined;
      const data = await getTransactionHistory(salesId, dateFilter);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat riwayat transaksi.");
    } finally {
      setLoading(false);
    }
  }, [salesId, filterMode, customDate]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4">
      <h2 className="font-bold text-[#111111] mb-4">Riwayat Transaksi</h2>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFilterMode("today")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
            filterMode === "today"
              ? "bg-[#0249E1] text-white"
              : "bg-[#F4F7FE] text-[#111111]/50"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setFilterMode("all")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
            filterMode === "all"
              ? "bg-[#0249E1] text-white"
              : "bg-[#F4F7FE] text-[#111111]/50"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterMode("custom")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
            filterMode === "custom"
              ? "bg-[#0249E1] text-white"
              : "bg-[#F4F7FE] text-[#111111]/50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Tanggal
        </button>
      </div>

      {filterMode === "custom" && (
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="w-full mb-3 px-3 py-2.5 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
        />
      )}

      {error && (
        <div className="mb-3 p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/35">Memuat riwayat...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
          <p className="text-sm text-[#111111]/35">Tidak ada transaksi.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((t) => (
            <button
              key={t.fullId}
              onClick={() => setSelected(t)}
              className="w-full text-left bg-white border border-black/5 rounded-xl p-3.5 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#111111]/35">
                  #{t.id} · {formatDate(t.createdAt)}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${paymentColor[t.paymentMethod]}`}
                >
                  {paymentLabel[t.paymentMethod]}
                </span>
              </div>
              <p className="text-sm text-[#111111]/60 mb-1">{t.customer}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#111111]">
                  {formatRp(t.total)}
                </p>
                {t.komisi !== 0 && (
                  <p
                    className={`text-xs font-medium ${t.komisi > 0 ? "text-[#0249E1]" : "text-[#EE3D5A]"}`}
                  >
                    {t.komisi > 0 ? "+" : ""}
                    {formatRp(t.komisi)} komisi
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <h2 className="font-bold text-[#111111] flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-[#0249E1]" />
                Detail Transaksi
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-[#F4F7FE] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#111111]/45">No. Transaksi</span>
                <span className="font-semibold text-[#111111]">#{selected.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#111111]/45">Tanggal</span>
                <span className="text-[#111111]">{formatDate(selected.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#111111]/45">Pelanggan</span>
                <span className="text-[#111111]">{selected.customer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#111111]/45">Pembayaran</span>
                <span className="font-semibold text-[#111111]">
                  {paymentLabel[selected.paymentMethod]}
                </span>
              </div>

              <div className="border-t border-black/5 pt-3">
                <p className="text-xs font-bold text-[#111111]/45 uppercase tracking-wide mb-2">
                  Item
                </p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-[#111111]">{item.name}</p>
                        <p className="text-xs text-[#111111]/40">
                          {item.quantity} x {formatRp(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-[#111111]">
                        {formatRp(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-black/5 pt-3 flex items-center justify-between">
                <span className="font-bold text-[#111111]">TOTAL</span>
                <span className="text-lg font-extrabold text-[#0249E1]">
                  {formatRp(selected.total)}
                </span>
              </div>
              {selected.komisi !== 0 && (
                <div
                  className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg ${
                    selected.komisi >= 0
                      ? "bg-[#DAFB71]/20 text-[#0249E1]"
                      : "bg-[#EE3D5A]/10 text-[#EE3D5A]"
                  }`}
                >
                  <span>Komisi</span>
                  <span>
                    {selected.komisi > 0 ? "+" : ""}
                    {formatRp(selected.komisi)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-black/5 px-5 py-4">
              <button
                onClick={() => setSelected(null)}
                className="w-full bg-[#0249E1] text-white py-3 rounded-xl font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
