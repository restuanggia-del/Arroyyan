import { useState } from "react";
import { X, UserPlus } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  isLoyalCustomer: boolean;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  purchases: any[];
}

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export function AddCustomerModal({ onClose, onSave }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    isLoyalCustomer: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address || undefined,
      isLoyalCustomer: formData.isLoyalCustomer,
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchase: "-",
      purchases: [],
    };

    onSave(newCustomer);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Tambah Pelanggan Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (opsional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contoh@email.com"
                className="w-full px-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat (opsional)
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Jl. Contoh No. 123, Kota"
                rows={3}
                className="w-full px-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 p-4 clay-inset-amber border-0 rounded-lg">
              <input
                type="checkbox"
                id="loyalCustomer"
                checked={formData.isLoyalCustomer}
                onChange={(e) =>
                  handleChange("isLoyalCustomer", e.target.checked)
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-[#0249E1]/40"
              />
              <label htmlFor="loyalCustomer" className="flex-1">
                <span className="font-medium text-gray-900">
                  Tandai sebagai Pelanggan Langganan
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Pelanggan langganan akan mendapat badge khusus dan prioritas
                  layanan
                </p>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Catatan:</strong> Data riwayat pembelian akan otomatis
                tercatat saat pelanggan melakukan transaksi di sistem POS.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 clay-blue clay-pressable text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Pelanggan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
