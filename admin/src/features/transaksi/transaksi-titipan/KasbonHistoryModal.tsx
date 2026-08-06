import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  KasbonTransaction,
  KasbonPayment,
  getKasbonPaymentHistory,
} from "../../../services/kasbonService";

interface KasbonHistoryModalProps {
  transaction: KasbonTransaction;
  onClose: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function KasbonHistoryModal({
  transaction,
  onClose,
}: KasbonHistoryModalProps) {
  const [payments, setPayments] = useState<KasbonPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await getKasbonPaymentHistory(transaction.id);
      setPayments(data || []);
      setLoading(false);
    };
    load();
  }, [transaction.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Riwayat Pembayaran
            </h2>
            <p className="text-sm text-gray-500">
              {transaction.customers?.customer_name ?? "—"} · Total titipan{" "}
              {transaction.total_dus} unit / {formatRp(transaction.total_price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat riwayat...</p>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">
              Belum ada pembayaran tercatat untuk titipan ini.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(p.tanggal_bayar)}
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {formatRp(p.jumlah_transfer + p.jumlah_cash)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                    <p>Dus dibayar: {p.dus_dibayar} unit</p>
                    <p>Transfer: {formatRp(p.jumlah_transfer)}</p>
                    <p>Cash: {formatRp(p.jumlah_cash)}</p>
                    <p>Ke Owner: {formatRp(p.jumlah_ke_owner)}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Sisa setelah ini:</span>
                    <span className="font-medium text-gray-700">
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
