import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
  Customer,
} from "../../../services/customerService";
import { Sales } from "../../../services/salesService";

interface CustomerFormModalProps {
  customer: Customer | null;
  salesOptions: Sales[];
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function CustomerFormModal({
  customer,
  salesOptions,
  onClose,
  onSaveSuccess,
}: CustomerFormModalProps) {
  const [form, setForm] = useState({
    customer_name: customer?.customer_name ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    is_subscribed: customer?.is_subscribed ?? false,
    sales_id: customer?.sales_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      is_subscribed: form.is_subscribed,
      sales_id: form.sales_id || null,
    };

    const { error } = customer
      ? await updateCustomer(customer.id, payload)
      : await createCustomer(payload);

    if (error) {
      setError((error as any).message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 clay-inset-red border-0 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.customer_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, customer_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              No. Telepon
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alamat
            </label>
            <textarea
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              rows={2}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
              placeholder="Alamat lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sales Penanggung Jawab
            </label>
            <select
              value={form.sales_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, sales_id: e.target.value }))
              }
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 bg-white"
            >
              <option value="">— Tidak ada / Admin —</option>
              {salesOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_sales}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Menandakan pelanggan ini didaftarkan / ditangani oleh sales mana.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_subscribed}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_subscribed: e.target.checked }))
              }
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Tandai sebagai pelanggan langganan{" "}
              <span className="text-gray-400">(override manual)</span>
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 clay-blue clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {customer ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
