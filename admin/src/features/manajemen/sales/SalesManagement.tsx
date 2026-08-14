import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Search,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  Trash2,
  Pencil,
  Plus,
  X,
  Power,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import {
  getAllSales,
  createSales,
  updateSales,
  deleteSales,
  createSalesAccount,
  resetSalesPassword,
  Sales,
} from "../../../services/salesService";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type FilterType = "all" | "active" | "inactive";

interface FormState {
  id: string | null;
  nama_sales: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  id: null,
  nama_sales: "",
  phone: "",
  address: "",
  is_active: true,
};

export function SalesManagement() {
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Sales | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [accountModalSales, setAccountModalSales] = useState<Sales | null>(
    null,
  );
  const [accountModalMode, setAccountModalMode] = useState<"create" | "reset">(
    "create",
  );

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllSales();
    if (error) setError("Gagal memuat data sales. Coba refresh halaman.");
    else setSalesList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSales();

    const channel = supabaseAdmin
      .channel("sales-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        () => fetchSales(),
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [fetchSales]);

  const openCreateForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (s: Sales) => {
    setForm({
      id: s.id,
      nama_sales: s.nama_sales,
      phone: s.phone ?? "",
      address: s.address ?? "",
      is_active: s.is_active,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nama_sales.trim()) {
      setFormError("Nama sales wajib diisi.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      nama_sales: form.nama_sales.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      is_active: form.is_active,
    };

    const result = form.id
      ? await updateSales(form.id, payload)
      : await createSales(payload);

    if (result.error) {
      setFormError(
        (result.error as any).message ?? "Gagal menyimpan data sales.",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    fetchSales();
  };

  const handleDelete = async (s: Sales) => {
    setActionLoading(s.id);
    setConfirmDelete(null);
    const { error } = await deleteSales(s.id, s.nama_sales);
    if (error) alert("Gagal menghapus sales: " + (error as any).message);
    else setSalesList((prev) => prev.filter((d) => d.id !== s.id));
    setActionLoading(null);
  };

  const toggleActive = async (s: Sales) => {
    setActionLoading(s.id);
    const { error } = await updateSales(
      s.id,
      { is_active: !s.is_active },
      { oldName: s.nama_sales },
    );
    if (error) alert("Gagal mengubah status sales: " + (error as any).message);
    else fetchSales();
    setActionLoading(null);
  };

  const filtered = salesList.filter((s) => {
    const matchSearch =
      s.nama_sales.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || "").includes(searchQuery);
    const matchFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? s.is_active
          : !s.is_active;
    return matchSearch && matchFilter;
  });

  const totalAll = salesList.length;
  const totalActive = salesList.filter((s) => s.is_active).length;
  const totalInactive = salesList.filter((s) => !s.is_active).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Sales
          </h1>
          <p className="text-gray-600">
            Kelola mitra sales — penjual/promosi AMDK yang mendapat komisi dari
            selisih harga jual
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSales}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 clay-blue clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Sales
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            key: "all",
            label: "Total Sales",
            value: totalAll,
            color: "blue",
            Icon: Briefcase,
          },
          {
            key: "active",
            label: "Aktif",
            value: totalActive,
            color: "green",
            Icon: Power,
          },
          {
            key: "inactive",
            label: "Nonaktif",
            value: totalInactive,
            color: "gray",
            Icon: Power,
          },
        ].map(({ key, label, value, color, Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`clay-raised clay-pressable rounded-lg p-6 text-left transition-all cursor-pointer ${
              filter === key
                ? `border-${color}-500 ring-2 ring-${color}-100`
                : "clay-raised-sm border-0"
            }`}
          >
            <div
              className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}
            >
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </button>
        ))}
      </div>

      <div className="clay-raised rounded-lg">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filtered.length} sales ditemukan
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data sales...</p>
          </div>
        ) : (
          !error && (
            <div className="p-6 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada data sales</p>
                </div>
              ) : (
                filtered.map((s) => (
                  <div
                    key={s.id}
                    className={`border rounded-xl p-5 transition-all ${
                      !s.is_active
                        ? "border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]"
                        : "border-[rgba(140,172,214,0.35)] bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                            s.is_active
                              ? "clay-blue text-white"
                              : "bg-gray-300 text-white"
                          }`}
                        >
                          {s.nama_sales.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {s.nama_sales}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                s.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {s.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                            {s.user_id ? (
                              <button
                                onClick={() => {
                                  setAccountModalMode("reset");
                                  setAccountModalSales(s);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 cursor-pointer"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                Akun aktif — Reset Password
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setAccountModalMode("create");
                                  setAccountModalSales(s);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                Buat Akun Login
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600">
                            {s.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{s.phone}</span>
                              </div>
                            )}
                            {s.address && (
                              <div className="flex items-center gap-1.5 sm:col-span-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{s.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {actionLoading === s.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                            Memproses...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleActive(s)}
                              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                                s.is_active
                                  ? "bg-orange-100 hover:bg-orange-200 text-orange-700"
                                  : "bg-green-100 hover:bg-green-200 text-green-700"
                              }`}
                            >
                              <Power className="w-4 h-4" />
                              {s.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              onClick={() => openEditForm(s)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(s)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}
      </div>

      {/* Modal tambah / edit sales */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit Sales" : "Tambah Sales"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Sales <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama_sales}
                  onChange={(e) =>
                    setForm({ ...form, nama_sales: e.target.value })
                  }
                  className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                  placeholder="Nama lengkap sales"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    No. HP
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat / Wilayah
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-[rgba(215,233,255,0.4)] border border-[rgba(140,172,214,0.35)] rounded-lg p-3">
                Akun login untuk aplikasi mobile Sales dibuat terpisah lewat
                menu approval akun, lalu dihubungkan otomatis ke data sales ini
                berdasarkan email yang didaftarkan.
              </p>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="rounded border-[rgba(140,172,214,0.5)]"
                />
                Aktif
              </label>
            </div>

            <div className="border-t border-[rgba(140,172,214,0.35)] px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 clay-blue clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : form.id
                    ? "Simpan Perubahan"
                    : "Tambah Sales"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Sales?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              "{confirmDelete.nama_sales}" akan dihapus. Aksi ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 clay-red clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {accountModalSales && (
        <AccountModal
          sales={accountModalSales}
          mode={accountModalMode}
          onClose={() => setAccountModalSales(null)}
          onSuccess={() => {
            setAccountModalSales(null);
            fetchSales();
          }}
        />
      )}
    </div>
  );
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function AccountModal({
  sales,
  mode,
  onClose,
  onSuccess,
}: {
  sales: Sales;
  mode: "create" | "reset";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState(sales.users?.email ?? "");
  const [password, setPassword] = useState(generatePassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async () => {
    setError(null);
    if (mode === "create" && !email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setSaving(true);

    if (mode === "create") {
      const { error: createError } = await createSalesAccount(
        sales.id,
        sales.nama_sales,
        email.trim(),
        password,
      );
      if (createError) {
        setError((createError as any).message ?? "Gagal membuat akun.");
        setSaving(false);
        return;
      }
    } else {
      if (!sales.users?.auth_user_id) {
        setError("Data akun tidak lengkap, tidak bisa reset password.");
        setSaving(false);
        return;
      }
      const { error: resetError } = await resetSalesPassword(
        sales.users.auth_user_id,
        password,
      );
      if (resetError) {
        setError((resetError as any).message ?? "Gagal reset password.");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            {mode === "create" ? "Buat Akun Login" : "Reset Password"} —{" "}
            {sales.nama_sales}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {done ? (
          <div className="p-6">
            <div className="p-4 clay-inset-green border-0 rounded-xl mb-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                {mode === "create"
                  ? "Akun berhasil dibuat"
                  : "Password berhasil direset"}
                . Kirimkan detail ini ke sales agar bisa login di app mobile
                Sales:
              </p>
              <div className="clay-inset-green border-0 rounded-lg p-3 font-mono text-sm space-y-1">
                <p>Email: {email}</p>
                <p>Password: {password}</p>
              </div>
              <button
                onClick={handleCopy}
                className="mt-3 flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Tersalin!" : "Salin ke clipboard"}
              </button>
            </div>
            <button
              onClick={onSuccess}
              className="w-full px-4 py-2.5 clay-blue clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer"
            >
              Selesai
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {mode === "create" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                    placeholder="sales@email.com"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-600 bg-[rgba(215,233,255,0.4)] border border-[rgba(140,172,214,0.35)] rounded-lg p-3">
                  Email login:{" "}
                  <span className="font-medium">{sales.users?.email}</span>
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password {mode === "create" ? "Awal" : "Baru"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 px-3 py-2 clay-inset border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="px-3 py-2 clay-inset border-0 rounded-lg text-xs text-gray-600 hover:bg-[rgba(215,233,255,0.5)] cursor-pointer whitespace-nowrap"
                  >
                    Acak Ulang
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Sales bisa memakai password ini untuk login pertama kali.
                  Sarankan untuk menggantinya sendiri setelahnya.
                </p>
              </div>
            </div>

            <div className="border-t border-[rgba(140,172,214,0.35)] px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 clay-blue clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : mode === "create"
                    ? "Buat Akun"
                    : "Reset Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
