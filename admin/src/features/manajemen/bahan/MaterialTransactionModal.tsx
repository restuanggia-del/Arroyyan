import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightCircle,
  ArrowLeftCircle,
  Factory,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import {
  getActiveMaterials,
  Material,
  addMaterialStock,
  reduceMaterialStock,
  moveToSementara,
  returnToGudang,
  consumeSementara,
  MOVEMENT_TYPE_LABEL,
} from "../../../services/materialService";

export type MaterialTxType =
  | "masuk"
  | "stok_awal"
  | "keluar"
  | "ke_sementara"
  | "kembali_gudang"
  | "produksi";

interface MaterialTransactionModalProps {
  type: MaterialTxType;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const TX_CONFIG: Record<
  MaterialTxType,
  {
    icon: React.ReactNode;
    color: "green" | "cyan" | "red" | "blue" | "amber" | "purple";
    sourceField: "stock_quantity" | "stock_sementara" | null;
    notePlaceholder: string;
    effectText: string;
  }
> = {
  masuk: {
    icon: <TrendingUp className="w-5 h-5" />,
    color: "green",
    sourceField: null,
    notePlaceholder: "Contoh: Pembelian dari supplier",
    effectText: "✓ Stok Gudang akan bertambah",
  },
  stok_awal: {
    icon: <ClipboardList className="w-5 h-5" />,
    color: "cyan",
    sourceField: null,
    notePlaceholder: "Contoh: Input awal stok gudang / hasil opname",
    effectText:
      "✓ Stok Gudang akan bertambah (tercatat terpisah dari Stok Masuk biasa)",
  },
  keluar: {
    icon: <TrendingDown className="w-5 h-5" />,
    color: "red",
    sourceField: "stock_quantity",
    notePlaceholder: "Contoh: Bahan rusak / hilang",
    effectText: "⚠ Stok Gudang akan berkurang",
  },
  ke_sementara: {
    icon: <ArrowRightCircle className="w-5 h-5" />,
    color: "blue",
    sourceField: "stock_quantity",
    notePlaceholder: "Contoh: Disiapkan untuk produksi batch pagi",
    effectText: "→ Stok Gudang berkurang, Stok Sementara bertambah",
  },
  kembali_gudang: {
    icon: <ArrowLeftCircle className="w-5 h-5" />,
    color: "amber",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Batal produksi, bahan dikembalikan",
    effectText: "← Stok Sementara berkurang, Stok Gudang bertambah",
  },
  produksi: {
    icon: <Factory className="w-5 h-5" />,
    color: "purple",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Terpakai produksi batch #1",
    effectText: "⚠ Stok Sementara akan berkurang (terpakai produksi)",
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; btn: string }> =
  {
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      btn: "bg-green-600 hover:bg-green-700",
    },
    cyan: {
      bg: "bg-cyan-100",
      text: "text-cyan-600",
      btn: "bg-cyan-600 hover:bg-cyan-700",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
      btn: "bg-red-600 hover:bg-red-700",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-600",
      btn: "bg-amber-600 hover:bg-amber-700",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      btn: "bg-purple-600 hover:bg-purple-700",
    },
  };

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

  const config = TX_CONFIG[type];
  const colors = COLOR_CLASSES[config.color];
  const selectedMaterial = materials.find((m) => m.id === materialId);
  const availableStock = config.sourceField
    ? selectedMaterial?.[config.sourceField]
    : undefined;

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

    let error;
    if (type === "masuk" || type === "stok_awal") {
      ({ error } = await addMaterialStock(materialId, quantity, note, type));
    } else {
      const fn = {
        keluar: reduceMaterialStock,
        ke_sementara: moveToSementara,
        kembali_gudang: returnToGudang,
        produksi: consumeSementara,
      }[type];
      ({ error } = await fn(materialId, quantity, note));
    }

    if (error) {
      setFormError("Gagal menyimpan transaksi: " + (error as any).message);
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
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}
            >
              {config.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {MOVEMENT_TYPE_LABEL[type]}
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
                    {m.nama_bahan} ({m.satuan}) — Gudang: {m.stock_quantity} |
                    Sementara: {m.stock_sementara}
                  </option>
                ))}
              </select>
            )}
            {selectedMaterial && config.sourceField && (
              <p className="text-xs text-gray-400 mt-1">
                Tersedia: <span className="font-medium">{availableStock}</span>{" "}
                {selectedMaterial.satuan}
              </p>
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
              placeholder={config.notePlaceholder}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div
            className={`rounded-xl p-4 ${colors.bg} bg-opacity-50 border border-current ${colors.text}`}
          >
            <p className={`text-sm font-medium ${colors.text}`}>
              {config.effectText}
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
              className={`px-5 py-2.5 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2 ${colors.btn}`}
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
