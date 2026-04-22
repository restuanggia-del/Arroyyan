import { useState } from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface StockTransactionModalProps {
  type: "masuk" | "keluar";
  onClose: () => void;
  onSave: () => void;
}

export function StockTransactionModal({
  type,
  onClose,
  onSave,
}: StockTransactionModalProps) {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: 0,
    category: type === "masuk" ? "produksi" : "distributor",
    from: "",
    to: "",
    notes: "",
  });

  const products = [
    { id: "1", name: "Arroyyan99 Cup Kecil" },
    { id: "2", name: "Arroyyan99 Cup Sedang" },
    { id: "3", name: "Arroyyan99 Botol Kecil" },
    { id: "4", name: "Arroyyan99 Botol Sedang" },
  ];

  const categoriesMasuk = [
    { value: "produksi", label: "Produksi" },
    { value: "restok", label: "Restok dari Supplier" },
  ];

  const categoriesKeluar = [
    { value: "distributor", label: "Kirim ke Distributor" },
    { value: "penjualan", label: "Penjualan" },
  ];

  const categories = type === "masuk" ? categoriesMasuk : categoriesKeluar;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                type === "masuk" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {type === "masuk" ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {type === "masuk"
                ? "Transaksi Stok Masuk"
                : "Transaksi Stok Keluar"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Produk <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleChange("productId", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Transaksi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseInt(e.target.value) || 0)
                }
                placeholder="Masukkan jumlah"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.from}
                  onChange={(e) => handleChange("from", e.target.value)}
                  placeholder={
                    type === "masuk" ? "Contoh: Produksi" : "Contoh: Stok Pusat"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ke <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.to}
                  onChange={(e) => handleChange("to", e.target.value)}
                  placeholder={
                    type === "masuk"
                      ? "Contoh: Stok Pusat"
                      : "Contoh: Distributor Jakarta"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Tambahkan catatan transaksi (opsional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div
              className={`rounded-lg p-4 ${
                type === "masuk"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {type === "masuk"
                  ? "Stok akan bertambah"
                  : "Stok akan berkurang"}
              </p>
              <p className="text-xs text-gray-600">
                {type === "masuk"
                  ? "Stok akan otomatis bertambah setelah transaksi disimpan"
                  : "Pastikan stok mencukupi sebelum melakukan transaksi keluar"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors cursor-pointer ${
                type === "masuk"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
