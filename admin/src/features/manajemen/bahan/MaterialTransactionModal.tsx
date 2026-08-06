import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getActiveMaterials,
  Material,
  addMaterialStock,
  reduceMaterialStock,
} from "../../../services/materialService";

interface MaterialTransactionModalProps {
  type: "masuk" | "awal" | "keluar";
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function MaterialTransactionModal({
  type,
  onClose,
  onSaveSuccess,
}: MaterialTransactionModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingMaterials(true);
      const { data } = await getActiveMaterials();
      setMaterials(data || []);
      setLoadingMaterials(false);
    };
    load();
  }, []);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const isGreen = type !== "keluar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!materialId) {
      setFormError("Pilih bahan terlebih dahulu.");
      return;
    }
    if (quantity < 1) {
      setFormError("Jumlah harus minimal 1.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } =
      type === "keluar"
        ? await reduceMaterialStock(materialId, quantity, note)
        : await addMaterialStock(
            materialId,
            quantity,
            note,
            type === "awal" ? "awal" : "masuk",
          );

    if (error) {
      setFormError(
        (error as any).message === "Stok bahan tidak mencukupi"
          ? "Stok bahan tidak mencukupi untuk jumlah yang diminta."
          : "Gagal menyimpan transaksi: " + (error as any).message,
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

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
                ? "Saldo Awal Bahan"
                : isGreen
                  ? "Stok Bahan Masuk"
                  : "Stok Bahan Keluar"}
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
              Pilih Bahan <span className="text-red-500">*</span>
            </label>
            {loadingMaterials ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat daftar bahan...
              </div>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Belum ada bahan aktif. Tambahkan bahan terlebih dahulu.
              </p>
            ) : (
              <select
                required
                value={materialId}
                onChange={(e) => {
                  setMaterialId(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Bahan --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama_bahan} ({m.satuan}) — stok: {m.stock_quantity}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah {selectedMaterial ? `(${selectedMaterial.satuan})` : ""}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={quantity === 1 ? "" : quantity}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setQuantity(v === "" ? 1 : parseInt(v, 10));
                setFormError(null);
              }}
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === "awal"
                  ? "Contoh: Opname awal bulan"
                  : isGreen
                    ? "Contoh: Pembelian dari supplier"
                    : "Contoh: Dipakai untuk produksi batch #1"
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
              className={`text-sm font-medium ${isGreen ? "text-green-800" : "text-red-800"}`}
            >
              {type === "awal"
                ? "✓ Saldo awal bahan akan ditambahkan"
                : isGreen
                  ? "✓ Stok bahan akan bertambah"
                  : "⚠ Stok bahan akan berkurang"}
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
              disabled={saving || loadingMaterials || materials.length === 0}
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
