import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { getActiveProducts, Product } from "../../../services/productService";
import {
  addCentralStock,
  reduceCentralStock,
} from "../../../services/stockService";

interface StockTransactionModalProps {
  type: "awal" | "masuk" | "keluar";
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
    quantity: 0,
    movementType:
      type === "awal"
        ? "stok_awal"
        : type === "masuk"
          ? "stock_in"
          : "sale_out",
    note: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      const { data } = await getActiveProducts();
      setProducts(data || []);
      setLoadingProducts(false);
    };
    load();
  }, []);

  const categoriesAwal = [
    { value: "stok_awal", label: "Stok Awal (Input Awal / Opname)" },
  ];

  const categoriesMasuk = [{ value: "stock_in", label: "Produksi / Restok" }];

  const categoriesKeluar = [
    { value: "sale_out", label: "Penjualan Langsung" },
    { value: "sodaqoh_out", label: "Sodaqoh" },
    { value: "pribadi_out", label: "Internal" },
    { value: "bonus_out", label: "Bonus / Hadiah Barang" },
  ];

  const categories =
    type === "awal"
      ? categoriesAwal
      : type === "masuk"
        ? categoriesMasuk
        : categoriesKeluar;

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const unitLabel = selectedProduct?.unit || "unit";

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
    if (type === "awal" || type === "masuk") {
      ({ error } = await addCentralStock(
        formData.productId,
        formData.quantity,
        formData.movementType as "stock_in" | "stok_awal",
        formData.note,
      ));
    } else {
      ({ error } = await reduceCentralStock(
        formData.productId,
        formData.quantity,
        formData.movementType as
          | "sale_out"
          | "sodaqoh_out"
          | "pribadi_out"
          | "bonus_out",
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

  const theme =
    type === "awal"
      ? {
          title: "Stok Awal",
          bg: "bg-cyan-100",
          text: "text-cyan-600",
          solidBg: "bg-cyan-600 hover:bg-cyan-700",
          softBg: "bg-cyan-50 border border-cyan-200",
          softText: "text-cyan-800",
          softTextLight: "text-cyan-700",
          icon: <ClipboardList className="w-5 h-5 text-cyan-600" />,
          notePlaceholder: "Contoh: Input awal stok gudang / hasil opname",
          infoTitle: "✓ Stok pusat akan bertambah",
          infoBody:
            "Dipakai untuk mencatat stok awal/opname, tercatat terpisah dari Stok Masuk biasa di riwayat pergerakan.",
        }
      : type === "masuk"
        ? {
            title: "Stok Masuk",
            bg: "bg-green-100",
            text: "text-green-600",
            solidBg: "clay-green clay-pressable",
            softBg: "clay-inset-green border-0",
            softText: "text-green-800",
            softTextLight: "text-green-700",
            icon: <TrendingUp className="w-5 h-5 text-green-600" />,
            notePlaceholder: "Contoh: Produksi batch #1",
            infoTitle: "✓ Stok pusat akan bertambah",
            infoBody:
              "Stok pusat otomatis bertambah dan dicatat di riwayat pergerakan. Untuk mencatat Insentif Produksi karyawan, gunakan menu Komisi & Keuangan → Insentif & Fee Penjualan.",
          }
        : {
            title: "Stok Keluar",
            bg: "bg-red-100",
            text: "text-red-600",
            solidBg: "clay-red clay-pressable",
            softBg: "clay-inset-red border-0",
            softText: "text-red-800",
            softTextLight: "text-red-700",
            icon: <TrendingDown className="w-5 h-5 text-red-600" />,
            notePlaceholder: "Contoh: Penjualan ke Toko ABC",
            infoTitle: "⚠ Stok pusat akan berkurang",
            infoBody: "Pastikan stok pusat mencukupi sebelum menyimpan.",
          };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bg}`}
            >
              {theme.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {theme.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2 text-sm text-red-700">
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
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jenis Transaksi <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.movementType}
              onChange={(e) => handleChange("movementType", e.target.value)}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah{" "}
              <span className="text-gray-400 font-normal">({unitLabel})</span>{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              inputMode="numeric"
              required
              value={formData.quantity === 0 ? "" : formData.quantity}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                handleChange(
                  "quantity",
                  digits === "" ? 0 : parseInt(digits, 10),
                );
              }}
              placeholder="0"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
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
              placeholder={theme.notePlaceholder}
              rows={3}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
            />
          </div>

          <div className={`rounded-xl p-4 ${theme.softBg}`}>
            <p className={`text-sm font-medium mb-1 ${theme.softText}`}>
              {theme.infoTitle}
            </p>
            <p className={`text-xs ${theme.softTextLight}`}>{theme.infoBody}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loadingProducts}
              className={`px-5 py-2.5 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2 ${theme.solidBg}`}
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
