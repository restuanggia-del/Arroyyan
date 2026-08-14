import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Phone,
  MapPin,
  History,
  X,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { getCustomers, getTransactionHistory, SalesCustomer } from "../../../services";
import CustomerFormModal, { CustomerFormValue } from "./CustomerFormModal";

type TxRow = Awaited<ReturnType<typeof getTransactionHistory>>[number];

interface CustomerPageProps {
  /** Needed to look up a customer's own purchase history (scoped to this sales rep). */
  salesId: string;
  /**
   * "manage" (default): full page — search, add, edit, view purchase history.
   * "picker": renders as a bottom-sheet overlay for choosing a customer inside
   *           a transaction. Selecting a row (or adding a new one) calls
   *           onSelect and then onClose.
   */
  mode?: "manage" | "picker";
  onSelect?: (customer: { id: string; name: string; phone: string }) => void;
  onClose?: () => void;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function CustomerPage({
  salesId,
  mode = "manage",
  onSelect,
  onClose,
}: CustomerPageProps) {
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<SalesCustomer | null>(null);

  const [historyCustomer, setHistoryCustomer] = useState<SalesCustomer | null>(null);
  const [historyData, setHistoryData] = useState<TxRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data pelanggan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const handleViewHistory = async (customer: SalesCustomer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const all = await getTransactionHistory(salesId);
      setHistoryData(
        all.filter((t) => t.customer.toLowerCase() === customer.name.toLowerCase()),
      );
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat riwayat pembelian.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaved = (saved: CustomerFormValue) => {
    setShowForm(false);
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      const next = exists
        ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
        : [...prev, { ...saved, isSubscribed: false }];
      return [...next].sort((a, b) => a.name.localeCompare(b.name));
    });

    // In picker mode, adding a brand-new customer immediately selects it too.
    if (mode === "picker" && !editingCustomer) {
      onSelect?.({ id: saved.id, name: saved.name, phone: saved.phone });
      onClose?.();
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const listContent = (
    <>
      {mode === "manage" && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#111111]">Pelanggan</h2>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 clay-blue clay-pressable text-white px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/35" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor HP..."
          className="w-full pl-9 pr-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
        />
      </div>

      {mode === "picker" && (
        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(true);
          }}
          className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-[#0249E1]/30 text-[#0249E1] py-2.5 rounded-xl text-sm font-medium cursor-pointer mb-3"
        >
          <Plus className="w-4 h-4" /> Tambah Toko/Pelanggan Baru
        </button>
      )}

      {error && (
        <div className="mb-3 p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/35">Memuat pelanggan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
          <p className="text-sm text-[#111111]/35">
            {search ? "Pelanggan tidak ditemukan." : "Belum ada data pelanggan."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) =>
            mode === "picker" ? (
              <button
                key={c.id}
                onClick={() => {
                  onSelect?.({ id: c.id, name: c.name, phone: c.phone });
                  onClose?.();
                }}
                className="w-full text-left clay-raised rounded-xl p-3.5 flex items-center justify-between cursor-pointer active:border-[#0249E1]"
              >
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-[#111111]/40 mt-0.5">{c.phone}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#111111]/25 flex-shrink-0" />
              </button>
            ) : (
              <div
                key={c.id}
                className="clay-raised rounded-xl p-3.5"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111111] truncate">
                      {c.name}
                    </p>
                    {c.phone && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-[#111111]/45">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-[#111111]/45">
                        <MapPin className="w-3 h-3" /> {c.address}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setShowForm(true);
                    }}
                    className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer flex-shrink-0"
                  >
                    <Pencil className="w-4 h-4 text-[#111111]/40" />
                  </button>
                </div>
                <button
                  onClick={() => handleViewHistory(c)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#0249E1] cursor-pointer mt-1"
                >
                  <History className="w-3.5 h-3.5" /> Lihat Riwayat Pembelian
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {mode === "picker" ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="clay-raised-lg rounded-t-3xl w-full max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
              <h2 className="font-bold text-[#111111]">Pilih Pelanggan</h2>
              <button
                onClick={onClose}
                className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">{listContent}</div>
          </div>
        </div>
      ) : (
        <div className="p-4 pb-24">{listContent}</div>
      )}

      {showForm && (
        <CustomerFormModal
          customer={
            editingCustomer
              ? {
                  id: editingCustomer.id,
                  name: editingCustomer.name,
                  phone: editingCustomer.phone,
                  address: editingCustomer.address,
                }
              : null
          }
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {historyCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="clay-raised-lg rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
              <div>
                <h2 className="font-bold text-[#111111]">Riwayat Pembelian</h2>
                <p className="text-xs text-[#111111]/45">{historyCustomer.name}</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2.5">
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-[#111111]/25 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-[#111111]/35">Memuat riwayat...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-8 h-8 text-[#111111]/25 mx-auto mb-2" />
                  <p className="text-sm text-[#111111]/35">
                    Belum ada transaksi dari pelanggan ini.
                  </p>
                </div>
              ) : (
                historyData.map((t) => (
                  <div
                    key={t.fullId}
                    className="clay-raised rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#111111]/35">
                        #{t.id} · {formatDate(t.createdAt)}
                      </span>
                      <span className="text-sm font-bold text-[#111111]">
                        {formatRp(t.total)}
                      </span>
                    </div>
                    <p className="text-xs text-[#111111]/40">
                      {t.items.length} item · {t.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
