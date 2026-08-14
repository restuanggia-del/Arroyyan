import { useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { createCustomer, updateCustomer } from "../../../services";

export interface CustomerFormValue {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface CustomerFormModalProps {
  /** Pass an existing customer to edit it, or omit/null to create a new one. */
  customer?: CustomerFormValue | null;
  onClose: () => void;
  onSaved: (customer: CustomerFormValue) => void;
}

export default function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEdit = !!customer;
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Nama toko/pelanggan wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && customer) {
        const updated = await updateCustomer(customer.id, {
          customer_name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
        onSaved({
          id: updated.id,
          name: updated.customer_name,
          phone: updated.phone ?? "",
          address: updated.address ?? "",
        });
      } else {
        const created = await createCustomer({
          customer_name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
        onSaved({
          id: created.id,
          name: created.customer_name,
          phone: created.phone ?? "",
          address: created.address ?? "",
        });
      }
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan data pelanggan.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
      <div className="bg-white rounded-t-3xl w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="font-bold text-[#111111]">
            {isEdit ? "Edit Pelanggan" : "Tambah Toko Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F4F7FE] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Nama Toko/Pelanggan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              No. HP
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Alamat
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-[#0249E1] text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Simpan Toko"}
          </button>
        </div>
      </div>
    </div>
  );
}
