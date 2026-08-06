import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Phone,
  Star,
  Plus,
  Search,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Trash2,
  Edit2,
  Settings,
  ShoppingBag,
  TrendingUp,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Zap,
} from "lucide-react";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
} from "../../../services/customerService";
import {
  getSubscriptionThreshold,
  saveSubscriptionThreshold,
  SubscriptionThreshold,
} from "../../../services/subscriptionSettingsService";

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

function CustomerModal({
  customer,
  onClose,
  onSaveSuccess,
}: CustomerModalProps) {
  const [form, setForm] = useState({
    customer_name: customer?.customer_name ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    is_subscribed: customer?.is_subscribed ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      is_subscribed: form.is_subscribed,
    };

    const { error } = customer
      ? await updateCustomer(customer.id, payload)
      : await createCustomer(payload);

    if (error) {
      setError((error as any).message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.customer_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, customer_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              No. Telepon
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alamat
            </label>
            <textarea
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Alamat lengkap"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_subscribed}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_subscribed: e.target.checked }))
              }
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Tandai sebagai pelanggan langganan{" "}
              <span className="text-gray-400">(override manual)</span>
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {customer ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ThresholdPanelProps {
  threshold: SubscriptionThreshold;
  onSaved: (t: SubscriptionThreshold) => void;
}

function ThresholdPanel({ threshold, onSaved }: ThresholdPanelProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    min_total_price:
      threshold.min_total_price !== null
        ? String(threshold.min_total_price)
        : "",
    min_total_qty:
      threshold.min_total_qty !== null ? String(threshold.min_total_qty) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync jika threshold prop berubah (misalnya setelah load awal)
  useEffect(() => {
    setForm({
      min_total_price:
        threshold.min_total_price !== null
          ? String(threshold.min_total_price)
          : "",
      min_total_qty:
        threshold.min_total_qty !== null ? String(threshold.min_total_qty) : "",
    });
  }, [threshold]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload: SubscriptionThreshold = {
      min_total_price:
        form.min_total_price !== "" ? Number(form.min_total_price) : null,
      min_total_qty:
        form.min_total_qty !== "" ? Number(form.min_total_qty) : null,
    };

    const { error } = await saveSubscriptionThreshold(payload);
    if (error) {
      setError((error as any).message ?? "Gagal menyimpan pengaturan.");
    } else {
      onSaved(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const summaryLabel = (() => {
    const parts: string[] = [];
    if (threshold.min_total_price) {
      parts.push(
        `≥ Rp ${Number(threshold.min_total_price).toLocaleString("id-ID")}`,
      );
    }
    if (threshold.min_total_qty) {
      parts.push(`≥ ${threshold.min_total_qty} pcs`);
    }
    return parts.length > 0 ? parts.join(" atau ") : "Belum dikonfigurasi";
  })();

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              Pengaturan Auto-Upgrade ke Langganan
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{summaryLabel}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl flex gap-2.5">
            <Zap className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-800 leading-relaxed">
              <span className="font-semibold">Cara kerja:</span> Setiap kali
              transaksi baru berhasil disimpan, sistem otomatis menjumlahkan{" "}
              <em>seluruh riwayat</em> belanja pelanggan tersebut. Jika memenuhi{" "}
              <span className="font-semibold">salah satu</span> syarat di bawah,
              status pelanggan langsung diubah menjadi{" "}
              <span className="font-semibold">Langganan</span>. Admin tetap bisa
              mengubah status secara manual lewat tombol Edit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  Total Belanja (Rp)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.min_total_price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, min_total_price: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="cth: 500000"
                />
              </div>
              <p className="text-xs text-gray-400">
                Kosongkan jika tidak digunakan
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  Total Pembelian (Pcs)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={form.min_total_qty}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, min_total_qty: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-12"
                  placeholder="cth: 10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  pcs
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Kosongkan jika tidak digunakan
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Tersimpan!" : "Simpan Pengaturan"}
          </button>
        </div>
      )}
    </div>
  );
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "subscribed" | "regular"
  >("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [threshold, setThreshold] = useState<SubscriptionThreshold>({
    min_total_price: null,
    min_total_qty: null,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllCustomers();
    if (error) setError("Gagal memuat data pelanggan.");
    else setCustomers(data ?? []);
    setLoading(false);
  }, []);

  const fetchThreshold = useCallback(async () => {
    const { data } = await getSubscriptionThreshold();
    if (data) setThreshold(data);
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchThreshold();
  }, [fetchCustomers, fetchThreshold]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await deleteCustomer(confirmDelete.id);
    if (error) alert("Gagal menghapus: " + (error as any).message);
    else setCustomers((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone ?? "").includes(searchQuery);
    const matchFilter =
      filterType === "all" ||
      (filterType === "subscribed" && c.is_subscribed) ||
      (filterType === "regular" && !c.is_subscribed);
    return matchSearch && matchFilter;
  });

  const totalSubscribed = customers.filter((c) => c.is_subscribed).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Pelanggan
          </h1>
          <p className="text-gray-600">Kelola data pelanggan</p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Pelanggan</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : customers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pelanggan Langganan</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalSubscribed}
          </p>
        </div>
      </div>

      <ThresholdPanel threshold={threshold} onSaved={setThreshold} />

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "subscribed", "regular"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    filterType === f
                      ? f === "subscribed"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f === "all"
                    ? "Semua"
                    : f === "subscribed"
                      ? "Langganan"
                      : "Reguler"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Pelanggan
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Memuat data pelanggan...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      "Nama",
                      "No. Telepon",
                      "Alamat",
                      "Status",
                      "Terdaftar",
                      "Aksi",
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Tidak ada pelanggan ditemukan
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {c.customer_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {c.customer_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            {c.phone ?? "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px] truncate">
                          {c.address ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          {c.is_subscribed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <Star className="w-3 h-3" fill="currentColor" />
                              Langganan
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Reguler
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCustomer(c);
                                setShowModal(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(c)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSaveSuccess={() => {
            setShowModal(false);
            fetchCustomers();
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">
              Hapus Pelanggan?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmDelete.customer_name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Detail Pelanggan
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedCustomer.customer_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedCustomer.customer_name}
                  </h3>
                  {selectedCustomer.is_subscribed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Star className="w-3 h-3" fill="currentColor" />
                      Langganan
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">No. Telepon</span>
                  <span className="font-medium">
                    {selectedCustomer.phone ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Alamat</span>
                  <span className="font-medium text-right max-w-[220px]">
                    {selectedCustomer.address ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Terdaftar</span>
                  <span className="font-medium">
                    {formatDate(selectedCustomer.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
