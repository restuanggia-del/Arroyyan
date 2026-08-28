import { useState, useEffect } from "react";
import { X, RefreshCw, History } from "lucide-react";
import {
  KasbonTransaction,
  KasbonPayment,
  getKasbonPaymentHistory,
} from "../../../services";

interface KasbonHistoryModalProps {
  transaction: KasbonTransaction;
  onClose: () => void;
}

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function KasbonHistoryModal({
  transaction,
  onClose,
}: KasbonHistoryModalProps) {
  const [payments, setPayments] = useState<KasbonPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getKasbonPaymentHistory(transaction.id);
        setPayments(data);
      } catch (err: any) {
        setError(err.message ?? "Gagal memuat riwayat pembayaran.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [transaction.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="clay-raised-lg rounded-t-3xl w-full max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)] flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#111111]">Riwayat Pembayaran</h2>
            <p className="text-xs text-[#111111]/45">
              {transaction.customers?.customer_name ?? "—"} · Total{" "}
              {transaction.total_dus} unit / {formatRp(transaction.total_price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {error && (
            <p className="text-sm text-[#EE3D5A] text-center py-2">{error}</p>
          )}
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#111111]/35">Memuat riwayat...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-9 h-9 text-[#111111]/25 mx-auto mb-2" />
              <p className="text-sm text-[#111111]/35">
                Belum ada pembayaran tercatat untuk titipan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p) => (
                <div key={p.id} className="clay-raised rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#111111]">
                      {formatDate(p.tanggal_bayar)}
                    </p>
                    <p className="text-sm font-bold text-[#0249E1]">
                      {formatRp(p.jumlah_transfer + p.jumlah_cash)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-[#111111]/45 mb-2">
                    <p>Dus dibayar: {p.dus_dibayar} unit</p>
                    <p>Transfer: {formatRp(p.jumlah_transfer)}</p>
                    <p>Cash: {formatRp(p.jumlah_cash)}</p>
                    <p>Ke Owner: {formatRp(p.jumlah_ke_owner)}</p>
                  </div>
                  {p.keterangan && (
                    <p className="text-xs text-[#111111]/40 mb-2">
                      "{p.keterangan}"
                    </p>
                  )}
                  <div className="border-t border-[rgba(140,172,214,0.25)] pt-2 flex items-center justify-between text-xs">
                    <span className="text-[#111111]/40">Sisa setelah ini:</span>
                    <span className="font-medium text-[#111111]/70">
                      {p.sisa_dus} unit · {formatRp(p.sisa_rp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
