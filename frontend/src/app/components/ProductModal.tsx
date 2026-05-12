import { useState, useEffect } from "react";
import { X, Upload, RefreshCw } from "lucide-react";
import {
  Product,
  createProduct,
  updateProduct,
} from "../../services/productService";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface FormState {
  product_name: string;
  category: "cup" | "botol";
  size: string;
  price: number;
  unit: string;
  photo_url: string;
  is_active: boolean;
}

const defaultForm: FormState = {
  product_name: "",
  category: "cup",
  size: "",
  price: 0,
  unit: "pcs",
  photo_url: "",
  is_active: true,
};

export function ProductModal({
  product,
  onClose,
  onSaveSuccess,
}: ProductModalProps) {
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        category: product.category,
        size: product.size ?? "",
        price: product.price,
        unit: product.unit,
        photo_url: product.photo_url ?? "",
        is_active: product.is_active,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [product]);

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
      product_name: formData.product_name.trim(),
      category: formData.category,
      size: formData.size.trim() || null,
      price: formData.price,
      unit: formData.unit.trim(),
      photo_url: formData.photo_url.trim() || null,
      is_active: formData.is_active,
    };

    let error;
    if (product) {
      ({ error } = await updateProduct(product.id, payload));
    } else {
      ({ error } = await createProduct(payload));
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? "Edit Produk" : "Tambah Produk Baru"}
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
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.product_name}
              onChange={(e) => handleChange("product_name", e.target.value)}
              placeholder="Contoh: Arroyyan99 Cup Kecil"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  handleChange("category", e.target.value as "cup" | "botol")
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="cup">Cup</option>
                <option value="botol">Botol</option>
              </select>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ukuran
                <span className="text-gray-400 font-normal ml-1">
                  (opsional)
                </span>
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                placeholder="Contoh: 240ml, 600ml"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Satuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="pcs / box / karton"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Harga <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                Rp
              </span>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) =>
                  handleChange("price", parseInt(e.target.value) || 0)
                }
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto Produk
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-3">
                Tempel URL foto produk di bawah
              </p>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => handleChange("photo_url", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.photo_url && (
                <img
                  src={formData.photo_url}
                  alt="preview"
                  className="mt-3 h-20 mx-auto object-contain rounded-lg"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          </div>

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
              {product ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
