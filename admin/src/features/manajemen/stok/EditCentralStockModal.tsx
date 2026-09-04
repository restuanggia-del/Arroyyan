import { useState } from "react";
import { X, RefreshCw, AlertCircle, Pencil } from "lucide-react";
import { setCentralStock } from "../../../services/stockService";

interface EditCentralStockModalProps {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function EditCentralStockModal({
  productId,
  productName,
  unit,
  currentStock,
  onClose,
  onSaveSuccess,
}: EditCentralStockModalProps) {
  const [newStock, setNewStock] = useState<number>(currentStock);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = newStock - currentStock;

  const handleSubmit = async () => {
    setError(null);

    if (newStock < 0) {
      setError("Jumlah stok tidak boleh negatif.");
      return;
    }
    if (delta === 0) {
      setError("Jumlah stok tidak berubah dari sebelumnya.");
      return;
    }

    setSaving(true);
    const { error } = await setCentralStock(productId, newStock, note.trim());
    setSaving(false);

    if (error) {
      setError(
        (error as { message?: string }).message ||
          "Gagal menyimpan koreksi stok.",
      );
      return;
    }
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Koreksi Stok Pusat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Produk</p>
            <p className="font-medium text-gray-900">{productName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">
              Stok Pusat saat ini:{" "}
              <span className="font-semibold text-gray-900">
                {currentStock} {unit}
              </span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah Stok Pusat yang Benar{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={newStock === 0 ? "" : newStock}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, "");
                setNewStock(digits === "" ? 0 : parseInt(digits, 10));
              }}
              placeholder="0"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>

          {delta !== 0 && (
            <div
              className={`text-sm rounded-lg p-3 ${
                delta > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {delta > 0
                ? `Stok pusat akan bertambah ${delta} ${unit}`
                : `Stok pusat akan berkurang ${Math.abs(delta)} ${unit}`}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alasan Koreksi (opsional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Contoh: Salah input saat Stok Awal, seharusnya 89 bukan 890"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Perubahan ini tetap tercatat di Riwayat Pergerakan sebagai "Koreksi
            Stok" supaya jejaknya tidak hilang.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[rgba(140,172,214,0.35)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 clay-inset border-0 rounded-lg text-sm font-medium text-gray-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 clay-blue clay-pressable text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
            Simpan Koreksi
          </button>
        </div>
      </div>
    </div>
  );
}
