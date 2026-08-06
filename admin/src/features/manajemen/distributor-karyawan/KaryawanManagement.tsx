import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  Trash2,
  Pencil,
  Plus,
  X,
  Star,
  Power,
} from "lucide-react";
import {
  getAllKaryawan,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
  Karyawan,
  KaryawanRole,
} from "../../../services/karyawanService";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const ROLE_OPTIONS: { value: KaryawanRole; label: string }[] = [
  { value: "produksi", label: "Produksi" },
  { value: "handling", label: "Handling" },
  { value: "jual_antar", label: "Jual/Antar" },
  { value: "admin", label: "Admin" },
];

const roleLabel = (r: KaryawanRole) =>
  ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;

type FilterType = "all" | "active" | "inactive";

interface FormState {
  id: string | null;
  nama: string;
  phone: string;
  address: string;
  bonus_khusus: boolean;
  is_active: boolean;
  roles: KaryawanRole[];
}

const emptyForm: FormState = {
  id: null,
  nama: "",
  phone: "",
  address: "",
  bonus_khusus: false,
  is_active: true,
  roles: [],
};

export function KaryawanManagement() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Karyawan | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKaryawan = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllKaryawan();
    if (error) setError("Gagal memuat data karyawan. Coba refresh halaman.");
    else setKaryawanList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKaryawan();

    const channel = supabaseAdmin
      .channel("karyawan-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "karyawan" },
        () => fetchKaryawan(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "karyawan_roles" },
        () => fetchKaryawan(),
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [fetchKaryawan]);

  const openCreateForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (k: Karyawan) => {
    setForm({
      id: k.id,
      nama: k.nama,
      phone: k.phone ?? "",
      address: k.address ?? "",
      bonus_khusus: k.bonus_khusus,
      is_active: k.is_active,
      roles: (k.karyawan_roles ?? []).map((r) => r.role),
    });
    setFormError(null);
    setShowForm(true);
  };

  const toggleRole = (role: KaryawanRole) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async () => {
    if (!form.nama.trim()) {
      setFormError("Nama karyawan wajib diisi.");
      return;
    }
    if (form.roles.length === 0) {
      setFormError("Pilih minimal 1 peran untuk karyawan ini.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      nama: form.nama.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      bonus_khusus: form.bonus_khusus,
      is_active: form.is_active,
      roles: form.roles,
    };

    const result = form.id
      ? await updateKaryawan(form.id, payload)
      : await createKaryawan(payload);

    if (result.error) {
      setFormError(
        (result.error as any).message ?? "Gagal menyimpan data karyawan.",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    fetchKaryawan();
  };

  const handleDelete = async (k: Karyawan) => {
    setActionLoading(k.id);
    setConfirmDelete(null);
    const { error } = await deleteKaryawan(k.id, k.nama);
    if (error) alert("Gagal menghapus karyawan: " + (error as any).message);
    else setKaryawanList((prev) => prev.filter((d) => d.id !== k.id));
    setActionLoading(null);
  };

  const toggleActive = async (k: Karyawan) => {
    setActionLoading(k.id);
    const { error } = await updateKaryawan(
      k.id,
      { is_active: !k.is_active },
      { oldName: k.nama },
    );
    if (error)
      alert("Gagal mengubah status karyawan: " + (error as any).message);
    else fetchKaryawan();
    setActionLoading(null);
  };

  const filtered = karyawanList.filter((k) => {
    const matchSearch =
      k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.phone || "").includes(searchQuery);
    const matchFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? k.is_active
          : !k.is_active;
    return matchSearch && matchFilter;
  });

  const totalAll = karyawanList.length;
  const totalActive = karyawanList.filter((k) => k.is_active).length;
  const totalInactive = karyawanList.filter((k) => !k.is_active).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Karyawan
          </h1>
          <p className="text-gray-600">
            Kelola data karyawan — produksi, handling, jual/antar, admin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchKaryawan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            key: "all",
            label: "Total Karyawan",
            value: totalAll,
            color: "blue",
            Icon: Users,
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
            className={`bg-white rounded-lg border p-6 text-left transition-all cursor-pointer ${
              filter === key
                ? `border-${color}-500 ring-2 ring-${color}-100`
                : "border-gray-200 hover:border-gray-300"
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

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filtered.length} karyawan ditemukan
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data karyawan...</p>
          </div>
        ) : (
          !error && (
            <div className="p-6 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada data karyawan</p>
                </div>
              ) : (
                filtered.map((k) => (
                  <div
                    key={k.id}
                    className={`border rounded-xl p-5 transition-all ${
                      !k.is_active
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200 bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                            k.is_active
                              ? "bg-blue-600 text-white"
                              : "bg-gray-300 text-white"
                          }`}
                        >
                          {k.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {k.nama}
                            </h3>
                            {k.bonus_khusus && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Star className="w-3 h-3" /> Bonus Khusus
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                k.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {k.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(k.karyawan_roles ?? []).map((r) => (
                              <span
                                key={r.role}
                                className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"
                              >
                                {roleLabel(r.role)}
                              </span>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600">
                            {k.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{k.phone}</span>
                              </div>
                            )}
                            {k.address && (
                              <div className="flex items-center gap-1.5 sm:col-span-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{k.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {actionLoading === k.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                            Memproses...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleActive(k)}
                              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                                k.is_active
                                  ? "bg-orange-100 hover:bg-orange-200 text-orange-700"
                                  : "bg-green-100 hover:bg-green-200 text-green-700"
                              }`}
                            >
                              <Power className="w-4 h-4" />
                              {k.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              onClick={() => openEditForm(k)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(k)}
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

      {/* Modal tambah / edit karyawan */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {form.id ? "Edit Karyawan" : "Tambah Karyawan"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama lengkap karyawan"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Peran <span className="text-red-500">*</span>{" "}
                  <span className="text-gray-400 font-normal">
                    (bisa lebih dari 1)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                        form.roles.includes(opt.value)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.roles.includes(opt.value)}
                        onChange={() => toggleRole(opt.value)}
                        className="rounded border-gray-300"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.bonus_khusus}
                    onChange={(e) =>
                      setForm({ ...form, bonus_khusus: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  Bonus khusus (ditandai manual oleh admin)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  Aktif
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : form.id
                    ? "Simpan Perubahan"
                    : "Tambah Karyawan"}
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
              Hapus Karyawan?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              "{confirmDelete.nama}" akan dihapus beserta seluruh data perannya.
              Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
