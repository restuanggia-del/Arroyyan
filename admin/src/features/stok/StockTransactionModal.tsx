import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getActiveProducts, Product } from "../../services/productService";
import {
  addCentralStock,
  reduceCentralStock,
} from "../../services/stockService";

interface StockTransactionModalProps {
  type: "masuk" | "awal" | "keluar";
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface FormState {
  productId: string;
  quantity: number;
  movementType: string;
  note: string;
}

export function StockTransactionModal({
  type,
  onClose,
  onSaveSuccess,
}: StockTransactionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    productId: "",
    quantity: 1,
    movementType:
      type === "masuk"
        ? "stock_in"
        : type === "awal"
          ? "stok_awal"
          : "sale_out",
    note: "",
  });

  const isInitialBalance = type === "awal";

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      const { data } = await getActiveProducts();
      setProducts(data || []);
      setLoadingProducts(false);
    };
    load();
  }, []);

  const categoriesMasuk = [
    { value: "stock_in", label: "Produksi / Restok" },
    { value: "stok_awal", label: "Saldo Awal / Opname" },
  ];

  const categoriesKeluar = [{ value: "sale_out", label: "Penjualan Langsung" }];

  const categories = type === "masuk" ? categoriesMasuk : categoriesKeluar;

  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId) {
      setFormError("Pilih produk terlebih dahulu.");
      return;
    }
    if (formData.quantity < 1) {
      setFormError("Jumlah harus minimal 1.");
      return;
    }

    setSaving(true);
    setFormError(null);

    let error;
    if (type === "masuk" || type === "awal") {
      ({ error } = await addCentralStock(
        formData.productId,
        formData.quantity,
        (type === "awal" ? "stok_awal" : formData.movementType) as
          | "stock_in"
          | "stok_awal",
        formData.note,
      ));
    } else {
      ({ error } = await reduceCentralStock(
        formData.productId,
        formData.quantity,
        "sale_out",
        formData.note,
      ));
    }

    if (error) {
      setFormError(
        (error as any).message === "Stok tidak mencukupi"
          ? "Stok pusat tidak mencukupi untuk jumlah yang diminta."
          : "Gagal menyimpan transaksi: " + (error as any).message,
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  const isGreen = type !== "keluar";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isGreen ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isGreen ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {type === "awal"
                ? "Stok Awal"
                : isGreen
                  ? "Stok Masuk"
                  : "Stok Keluar"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Pilih Produk <span className="text-red-500">*</span>
            </label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat daftar produk...
              </div>
            ) : (
              <select
                required
                value={formData.productId}
                onChange={(e) => handleChange("productId", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name}
                    {p.size ? ` (${p.size})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isInitialBalance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jenis Transaksi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.movementType}
                onChange={(e) => handleChange("movementType", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              required
              min="1"
              value={formData.quantity === 1 ? "" : formData.quantity}
              onChange={(e) =>
                handleChange(
                  "quantity",
                  e.target.value === "" ? 1 : parseInt(e.target.value, 10),
                )
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder={
                type === "awal"
                  ? "Contoh: Opname awal bulan"
                  : isGreen
                    ? "Contoh: Produksi batch #1"
                    : "Contoh: Penjualan ke Toko ABC"
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div
            className={`rounded-xl p-4 ${
              isGreen
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-1 ${isGreen ? "text-green-800" : "text-red-800"}`}
            >
              {type === "awal"
                ? "✓ Saldo awal akan ditambahkan ke stok pusat"
                : isGreen
                  ? "✓ Stok pusat akan bertambah"
                  : "⚠ Stok pusat akan berkurang"}
            </p>
            <p
              className={`text-xs ${isGreen ? "text-green-700" : "text-red-700"}`}
            >
              {type === "awal"
                ? "Digunakan untuk melanjutkan saldo stok atau menginput opname awal periode berikutnya."
                : isGreen
                  ? "Stok pusat otomatis bertambah dan dicatat di riwayat pergerakan."
                  : "Pastikan stok pusat mencukupi sebelum menyimpan."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
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
              disabled={saving || loadingProducts}
              className={`px-5 py-2.5 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2 ${
                isGreen
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
