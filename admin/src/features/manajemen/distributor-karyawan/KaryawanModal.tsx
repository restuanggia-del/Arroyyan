import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  createKaryawan,
  updateKaryawan,
  Karyawan,
  KaryawanRole,
} from "../../../services/karyawanService";
import { ROLE_OPTIONS } from "../distributor-karyawan/karyawanRoleOptions";

interface KaryawanModalProps {
  karyawan: Karyawan | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface FormState {
  nama: string;
  phone: string;
  address: string;
  bonus_khusus: boolean;
  is_active: boolean;
  roles: KaryawanRole[];
}

const emptyForm: FormState = {
  nama: "",
  phone: "",
  address: "",
  bonus_khusus: false,
  is_active: true,
  roles: [],
};

export function KaryawanModal({
  karyawan,
  onClose,
  onSaveSuccess,
}: KaryawanModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (karyawan) {
      setForm({
        nama: karyawan.nama,
        phone: karyawan.phone ?? "",
        address: karyawan.address ?? "",
        bonus_khusus: karyawan.bonus_khusus,
        is_active: karyawan.is_active,
        roles: (karyawan.karyawan_roles ?? []).map((r) => r.role),
      });
    } else {
      setForm(emptyForm);
    }
    setFormError(null);
  }, [karyawan]);

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

    const result = karyawan
      ? await updateKaryawan(karyawan.id, payload)
      : await createKaryawan(payload);

    if (result.error) {
      setFormError(
        (result.error as any).message ?? "Gagal menyimpan data karyawan.",
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {karyawan ? "Edit Karyawan" : "Tambah Karyawan"}
          </h3>
          <button
            onClick={onClose}
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
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
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
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alamat
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
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
                      : "border-[rgba(140,172,214,0.35)] text-gray-700 hover:border-[rgba(140,172,214,0.4)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.roles.includes(opt.value)}
                    onChange={() => toggleRole(opt.value)}
                    className="rounded border-[rgba(140,172,214,0.5)]"
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
                className="rounded border-[rgba(140,172,214,0.5)]"
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
                className="rounded border-[rgba(140,172,214,0.5)]"
              />
              Aktif
            </label>
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
              : karyawan
                ? "Simpan Perubahan"
                : "Tambah Karyawan"}
          </button>
        </div>
      </div>
    </div>
  );
}
