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
import { KasbonTransactionModal } from "./KasbonTransactionModal";
import { KasbonPaymentModal } from "./KasbonPaymentModal";
import { KasbonHistoryModal } from "./KasbonHistoryModal";
import {
  KasbonTransaction,
  getKasbonTransactions,
} from "../../services/kasbonService";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function TransaksiTitipan() {
  const [transactions, setTransactions] = useState<KasbonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"semua" | "belum_lunas" | "lunas">(
    "belum_lunas",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payingTrx, setPayingTrx] = useState<KasbonTransaction | null>(null);
  const [historyTrx, setHistoryTrx] = useState<KasbonTransaction | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getKasbonTransactions();
    if (error) {
      setError("Gagal memuat data titipan.");
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, []);

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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Transaksi Titipan (Kasbon)
          </h1>
          <p className="text-gray-600">
            Kelola barang yang dititipkan ke toko dan pelunasannya
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Titipan Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Titipan Belum Lunas</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalBelumLunas} Toko`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Sisa Tagihan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalSisaRp)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <PackageCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Sisa Dus Titipan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalSisaDus} Unit`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2">
          {[
            { id: "belum_lunas", label: "Belum Lunas" },
            { id: "lunas", label: "Lunas" },
            { id: "semua", label: "Semua" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                filter === f.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data titipan...</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-16 text-sm">
              Tidak ada data titipan{" "}
              {filter === "belum_lunas"
                ? "yang belum lunas"
                : filter === "lunas"
                  ? "yang sudah lunas"
                  : ""}
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      "Tanggal",
                      "Toko",
                      "Sales",
                      "Total Titipan",
                      "Sisa Dus",
                      "Sisa Tagihan",
                      "Status",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {t.customers?.customer_name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {t.karyawan?.nama ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {t.total_dus} unit / {formatRp(t.total_price)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {Math.max(0, t.sisa_dus)} unit
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatRp(Math.max(0, t.sisa_rp))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            t.is_lunas
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {t.is_lunas ? "Lunas" : "Belum Lunas"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {!t.is_lunas && (
                            <button
                              onClick={() => setPayingTrx(t)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              title="Catat Pembayaran"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setHistoryTrx(t)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Riwayat Pembayaran"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <KasbonTransactionModal
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
