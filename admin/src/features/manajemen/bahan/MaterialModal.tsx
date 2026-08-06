import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  Material,
  createMaterial,
  updateMaterial,
} from "../../../services/materialService";

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface FormState {
  nama_bahan: string;
  satuan: string;
  is_active: boolean;
}

const defaultForm: FormState = {
  nama_bahan: "",
  satuan: "kg",
  is_active: true,
};

export function MaterialModal({
  material,
  onClose,
  onSaveSuccess,
}: MaterialModalProps) {
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      setFormData({
        nama_bahan: material.nama_bahan,
        satuan: material.satuan,
        is_active: material.is_active,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [material]);

  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      nama_bahan: formData.nama_bahan.trim(),
      satuan: formData.satuan.trim(),
      is_active: formData.is_active,
    };

    if (!payload.nama_bahan) {
      setFormError("Nama bahan wajib diisi.");
      setSaving(false);
      return;
    }
    if (!payload.satuan) {
      setFormError("Satuan wajib diisi.");
      setSaving(false);
      return;
    }

    let error;
    if (material) {
      ({ error } = await updateMaterial(material.id, payload));
    } else {
      ({ error } = await createMaterial(payload));
    }

    if (error) {
      setFormError("Gagal menyimpan: " + error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {material ? "Edit Bahan" : "Tambah Bahan Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Bahan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama_bahan}
              onChange={(e) => handleChange("nama_bahan", e.target.value)}
              placeholder="Contoh: Preform Botol 600ml, Tutup Cup, Sedotan"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Satuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.satuan}
                onChange={(e) => handleChange("satuan", e.target.value)}
                placeholder="kg / pcs / roll"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.is_active ? "aktif" : "nonaktif"}
                onChange={(e) =>
                  handleChange("is_active", e.target.value === "aktif")
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {!material && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
              Stok awal bahan baru dimulai dari 0. Gunakan tombol "Stok Awal"
              setelah bahan tersimpan jika saldo awal perlu dilanjutkan atau
              diinput terlebih dahulu.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {material ? "Simpan Perubahan" : "Tambah Bahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
