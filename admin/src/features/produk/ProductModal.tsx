import { useState, useEffect } from "react";
import { X, Upload, RefreshCw, Plus, Trash2, Tag } from "lucide-react";
import {
  Product,
  createProduct,
  updateProduct,
} from "../../services/productService";
import {
  ProductPrice,
  getProductPrices,
  createProductPrice,
  deleteProductPrice,
} from "../../services/productPriceService";

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

  // Harga variatif (product_prices)
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [newPriceLabel, setNewPriceLabel] = useState("");
  const [newPriceValue, setNewPriceValue] = useState(0);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  const loadPrices = async (productId: string) => {
    setLoadingPrices(true);
    const { data } = await getProductPrices(productId);
    setPrices(data || []);
    setLoadingPrices(false);
  };

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
      loadPrices(product.id);
    } else {
      setFormData(defaultForm);
      setPrices([]);
    }
  }, [product]);

  const handleAddPrice = async () => {
    if (!product) return;
    setPriceError(null);
    if (newPriceValue <= 0) {
      setPriceError("Nominal harga harus lebih dari 0.");
      return;
    }
    setSavingPrice(true);
    const { data, error } = await createProductPrice({
      product_id: product.id,
      price: newPriceValue,
      label: newPriceLabel.trim() || null,
      is_active: true,
    });
    if (error) {
      setPriceError("Gagal menambah harga: " + error.message);
      setSavingPrice(false);
      return;
    }
    if (data) setPrices((prev) => [...prev, data]);
    setNewPriceLabel("");
    setNewPriceValue(0);
    setSavingPrice(false);
  };

  const handleDeletePrice = async (id: string) => {
    setPrices((prev) => prev.filter((p) => p.id !== id));
    await deleteProductPrice(id);
  };

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
                type="text"
                inputMode="numeric"
                required
                value={formData.price === 0 ? "" : formData.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  handleChange("price", value === "" ? 0 : parseInt(value, 10));
                }}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Harga di atas adalah harga dasar/default produk ini.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                Harga Variatif
                <span className="text-gray-400 font-normal ml-1">
                  (opsional)
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Opsi harga tambahan yang bisa dipilih lewat dropdown saat
              Transaksi Penjualan (mis. harga promo, harga grosir).
            </p>

            {!product ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Simpan produk ini terlebih dahulu, lalu edit kembali untuk
                menambahkan opsi harga variatif.
              </p>
            ) : (
              <>
                {priceError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {priceError}
                  </div>
                )}

                {loadingPrices ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Memuat harga...
                  </div>
                ) : prices.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {prices.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rp {p.price.toLocaleString("id-ID")}
                          </p>
                          {p.label && (
                            <p className="text-xs text-gray-500">{p.label}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePrice(p.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus harga ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">
                    Belum ada opsi harga tambahan.
                  </p>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={newPriceLabel}
                      onChange={(e) => setNewPriceLabel(e.target.value)}
                      placeholder="Contoh: Harga Grosir"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs text-gray-600 mb-1">
                      Harga
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newPriceValue === 0 ? "" : newPriceValue}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setNewPriceValue(v === "" ? 0 : parseInt(v, 10));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrice}
                    disabled={savingPrice}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    {savingPrice ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Tambah
                  </button>
                </div>
              </>
            )}
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
