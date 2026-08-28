import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Wallet,
  PackageCheck,
  Clock,
  History,
  DollarSign,
} from "lucide-react";
import { getKasbonTransactions, KasbonTransaction } from "../../../services";
import KasbonCreateModal from "./KasbonCreateModal";
import KasbonPaymentModal from "./KasbonPaymentModal";
import KasbonHistoryModal from "./KasbonHistoryModal";

interface TitipanPageProps {
  salesId: string;
}

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function TitipanPage({ salesId }: TitipanPageProps) {
  const [transactions, setTransactions] = useState<KasbonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"belum_lunas" | "lunas" | "semua">(
    "belum_lunas",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payingTrx, setPayingTrx] = useState<KasbonTransaction | null>(null);
  const [historyTrx, setHistoryTrx] = useState<KasbonTransaction | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getKasbonTransactions(salesId);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data titipan.");
    } finally {
      setLoading(false);
    }
  }, [salesId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchAll();
  };

  const handlePaymentSuccess = () => {
    setPayingTrx(null);
    fetchAll();
  };

  const filtered = transactions.filter((t) => {
    if (filter === "belum_lunas") return !t.is_lunas;
    if (filter === "lunas") return t.is_lunas;
    return true;
  });

  const totalBelumLunas = transactions.filter((t) => !t.is_lunas).length;
  const totalSisaRp = transactions
    .filter((t) => !t.is_lunas)
    .reduce((s, t) => s + Math.max(0, t.sisa_rp), 0);
  const totalSisaDus = transactions
    .filter((t) => !t.is_lunas)
    .reduce((s, t) => s + Math.max(0, t.sisa_dus), 0);

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[#111111]">Titipan (Kasbon)</h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 clay-blue clay-pressable text-white px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="clay-raised rounded-2xl p-3">
          <div className="w-8 h-8 bg-[#DAFB71]/25 rounded-xl flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-[#a97e05]" />
          </div>
          <p className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wide leading-tight">
            Belum Lunas
          </p>
          <p className="text-sm font-extrabold text-[#111111] mt-0.5">
            {loading ? "—" : `${totalBelumLunas} Toko`}
          </p>
        </div>
        <div className="clay-raised rounded-2xl p-3">
          <div className="w-8 h-8 bg-[#EE3D5A]/12 rounded-xl flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-[#EE3D5A]" />
          </div>
          <p className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wide leading-tight">
            Sisa Tagihan
          </p>
          <p className="text-sm font-extrabold text-[#111111] mt-0.5">
            {loading ? "—" : formatRp(totalSisaRp)}
          </p>
        </div>
        <div className="clay-raised rounded-2xl p-3">
          <div className="w-8 h-8 bg-[#0249E1]/10 rounded-xl flex items-center justify-center mb-2">
            <PackageCheck className="w-4 h-4 text-[#0249E1]" />
          </div>
          <p className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wide leading-tight">
            Sisa Dus
          </p>
          <p className="text-sm font-extrabold text-[#111111] mt-0.5">
            {loading ? "—" : `${totalSisaDus} Unit`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(
          [
            { id: "belum_lunas", label: "Belum Lunas" },
            { id: "lunas", label: "Lunas" },
            { id: "semua", label: "Semua" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              filter === f.id ? "clay-blue text-white" : "text-[#111111]/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/35">Memuat data titipan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
          <p className="text-sm text-[#111111]/35">
            Tidak ada data titipan{" "}
            {filter === "belum_lunas"
              ? "yang belum lunas"
              : filter === "lunas"
                ? "yang sudah lunas"
                : ""}
            .
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <div key={t.id} className="clay-raised rounded-xl p-3.5">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] truncate">
                    {t.customers?.customer_name ?? "—"}
                  </p>
                  <p className="text-xs text-[#111111]/40 mt-0.5">
                    {formatDate(t.created_at)}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    t.is_lunas
                      ? "bg-[#DAFB71]/40 text-[#5a7a00]"
                      : "bg-[#EE3D5A]/12 text-[#EE3D5A]"
                  }`}
                >
                  {t.is_lunas ? "LUNAS" : "BELUM LUNAS"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#111111]/45 mb-2">
                <span>
                  Total: {t.total_dus} unit / {formatRp(t.total_price)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-[#111111]/35">Sisa Dus</p>
                    <p className="text-sm font-bold text-[#111111]">
                      {Math.max(0, t.sisa_dus)} unit
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#111111]/35">
                      Sisa Tagihan
                    </p>
                    <p className="text-sm font-bold text-[#111111]">
                      {formatRp(Math.max(0, t.sisa_rp))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!t.is_lunas && (
                    <button
                      onClick={() => setPayingTrx(t)}
                      title="Catat Pembayaran"
                      className="w-8 h-8 clay-raised-sm clay-pressable rounded-lg flex items-center justify-center cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-[#0249E1]" />
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryTrx(t)}
                    title="Riwayat Pembayaran"
                    className="w-8 h-8 clay-raised-sm clay-pressable rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <History className="w-4 h-4 text-[#111111]/50" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <KasbonCreateModal
          salesId={salesId}
          onClose={() => setIsCreateOpen(false)}
          onSaveSuccess={handleCreateSuccess}
        />
      )}

      {payingTrx && (
        <KasbonPaymentModal
          transaction={payingTrx}
          onClose={() => setPayingTrx(null)}
          onSaveSuccess={handlePaymentSuccess}
        />
      )}

      {historyTrx && (
        <KasbonHistoryModal
          transaction={historyTrx}
          onClose={() => setHistoryTrx(null)}
        />
      )}
    </div>
  );
}
