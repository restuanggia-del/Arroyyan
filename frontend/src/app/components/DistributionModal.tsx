import { useState } from "react";
import { X, Truck, Package, AlertCircle } from "lucide-react";

interface Distribution {
  id: string;
  date: string;
  distributorName: string;
  distributorAddress: string;
  productName: string;
  quantity: number;
  status: "pending" | "dalam_perjalanan" | "selesai";
  notes: string;
}

interface DistributionModalProps {
  onClose: () => void;
  onSave: (distribution: Distribution) => void;
}

const distributors = [
  {
    id: "1",
    name: "Distributor Jakarta Pusat",
    address: "Jl. Sudirman No. 123, Jakarta Pusat",
  },
  { id: "2", name: "Distributor Bandung", address: "Jl. Dago No. 45, Bandung" },
  {
    id: "3",
    name: "Distributor Surabaya",
    address: "Jl. Pemuda No. 78, Surabaya",
  },
  {
    id: "4",
    name: "Distributor Semarang",
    address: "Jl. Pandanaran No. 90, Semarang",
  },
  {
    id: "5",
    name: "Distributor Yogyakarta",
    address: "Jl. Malioboro No. 56, Yogyakarta",
  },
];

const products = [
  { id: "1", name: "Arroyyan99 Cup Kecil", stokPabrik: 500 },
  { id: "2", name: "Arroyyan99 Cup Sedang", stokPabrik: 300 },
  { id: "3", name: "Arroyyan99 Botol Kecil", stokPabrik: 400 },
  { id: "4", name: "Arroyyan99 Botol Sedang", stokPabrik: 350 },
];

export function DistributionModal({ onClose, onSave }: DistributionModalProps) {
  const [formData, setFormData] = useState({
    distributorId: "",
    productId: "",
    quantity: 0,
    status: "pending" as "pending" | "dalam_perjalanan" | "selesai",
    notes: "",
  });

  const [showStockWarning, setShowStockWarning] = useState(false);

  const selectedDistributor = distributors.find(
    (d) => d.id === formData.distributorId,
  );
  const selectedProduct = products.find((p) => p.id === formData.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProduct && formData.quantity > selectedProduct.stokPabrik) {
      setShowStockWarning(true);
      return;
    }

    if (!selectedDistributor || !selectedProduct) return;

    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newDistribution: Distribution = {
      id: Date.now().toString(),
      date: dateString,
      distributorName: selectedDistributor.name,
      distributorAddress: selectedDistributor.address,
      productName: selectedProduct.name,
      quantity: formData.quantity,
      status: formData.status,
      notes: formData.notes,
    };

    onSave(newDistribution);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowStockWarning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Buat Distribusi Baru
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">
                    Update Stok Otomatis
                  </h3>
                  <p className="text-sm text-blue-700">
                    Setelah distribusi dibuat, stok pabrik akan otomatis
                    berkurang dan stok distributor akan bertambah sesuai jumlah
                    yang dikirim.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Distributor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.distributorId}
                onChange={(e) => handleChange("distributorId", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Distributor --</option>
                {distributors.map((distributor) => (
                  <option key={distributor.id} value={distributor.id}>
                    {distributor.name} - {distributor.address}
                  </option>
                ))}
              </select>
            </div>

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
                    {product.name} (Stok Pabrik: {product.stokPabrik} unit)
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Stok Pabrik Tersedia:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {selectedProduct.stokPabrik} unit
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Kirim <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedProduct?.stokPabrik || undefined}
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseInt(e.target.value) || 0)
                }
                placeholder="Masukkan jumlah"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedProduct && formData.quantity > 0 && (
                <div className="mt-2 text-sm">
                  <p className="text-gray-600">
                    Stok setelah distribusi:{" "}
                    <span className="font-semibold">
                      {selectedProduct.stokPabrik - formData.quantity} unit
                    </span>
                  </p>
                </div>
              )}
            </div>

            {showStockWarning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-1">
                    Stok Tidak Mencukupi
                  </h3>
                  <p className="text-sm text-red-700">
                    Jumlah yang akan dikirim melebihi stok yang tersedia di
                    pabrik. Silakan kurangi jumlah atau lakukan restok terlebih
                    dahulu.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 ">
                Status Pengiriman{" "}
                <span className="text-red-500 cursor-pointer">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="pending">Pending - Belum Dikirim</option>
                <option value="dalam_perjalanan">Dalam Perjalanan</option>
                <option value="selesai">Selesai - Sudah Diterima</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Tambahkan catatan pengiriman (opsional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Buat Distribusi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
