import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightCircle,
  Factory,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Ban,
  ClipboardCheck,
} from "lucide-react";
import {
  getActiveMaterials,
  Material,
  addMaterialStock,
  reduceMaterialStock,
  moveToSementara,
  consumeSementara,
  addSementaraStokAwal,
  rejectSementara,
  recordSisaBahan,
  MOVEMENT_TYPE_LABEL,
} from "../../../services/materialService";

export type MaterialTxType =
  | "masuk"
  | "stok_awal"
  | "keluar"
  | "ke_sementara"
  | "stok_awal_sementara"
  | "produksi"
  | "reject"
  | "sisa_produksi";

interface MaterialTransactionModalProps {
  type: MaterialTxType;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const TX_TITLE: Record<MaterialTxType, string> = {
  ...MOVEMENT_TYPE_LABEL,
  sisa_produksi: "Sisa Bahan (Setelah Produksi)",
};

const TX_CONFIG: Record<
  MaterialTxType,
  {
    icon: React.ReactNode;
    color: "green" | "cyan" | "red" | "blue" | "amber" | "purple" | "lime";
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
    effectText:
      "→ Stok Gudang berkurang, Stok Sementara bertambah. Catatan: bahan yang sudah masuk Stok Sementara tidak bisa dikembalikan ke Gudang (menjaga kebersihan & sterilitas bahan) — anggap langsung habis terpakai untuk produksi.",
  },
  stok_awal_sementara: {
    icon: <ClipboardList className="w-5 h-5" />,
    color: "amber",
    sourceField: null,
    notePlaceholder: "Contoh: Saldo awal bahan yang sudah ada di area produksi",
    effectText:
      "✓ Stok Sementara akan bertambah (tercatat terpisah dari Pindah ke Sementara biasa)",
  },
  produksi: {
    icon: <Factory className="w-5 h-5" />,
    color: "purple",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Terpakai produksi batch #1",
    effectText: "⚠ Stok Sementara akan berkurang (terpakai produksi)",
  },
  reject: {
    icon: <Ban className="w-5 h-5" />,
    color: "red",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Bahan sobek/pecah/cacat saat proses produksi",
    effectText: "⚠ Stok Sementara akan berkurang (rusak/reject)",
  },
  sisa_produksi: {
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: "lime",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Sisa kardus setelah produksi batch pagi",
    effectText:
      "Input JUMLAH YANG TERSISA (bukan yang dipakai). Sistem otomatis menghitung selisihnya sebagai Pemakaian Produksi, lalu Stok Sementara di-update jadi angka sisa ini.",
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; btn: string }> =
  {
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      btn: "clay-green clay-pressable",
    },
    cyan: {
      bg: "bg-cyan-100",
      text: "text-cyan-600",
      btn: "bg-cyan-600 hover:bg-cyan-700",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
      btn: "clay-red clay-pressable",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      btn: "clay-blue clay-pressable",
    },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-600",
      btn: "clay-amber clay-pressable",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      btn: "clay-purple clay-pressable",
    },
    lime: {
      bg: "bg-lime-100",
      text: "text-lime-700",
      btn: "clay-lime clay-pressable",
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
  const [quantity, setQuantity] = useState(0);
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
    if (type === "sisa_produksi") {
      if (quantity < 0) {
        setFormError("Jumlah sisa tidak boleh negatif.");
        return;
      }
      if (selectedMaterial && quantity > selectedMaterial.stock_sementara) {
        setFormError(
          `Sisa yang diinput (${quantity}) tidak boleh lebih besar dari Stok Sementara saat ini (${selectedMaterial.stock_sementara}).`,
        );
        return;
      }
    } else if (quantity < 1) {
      setFormError("Jumlah harus minimal 1.");
      return;
    }

    setSaving(true);
    setFormError(null);

    let error;
    if (type === "masuk" || type === "stok_awal") {
      ({ error } = await addMaterialStock(materialId, quantity, note, type));
    } else if (type === "stok_awal_sementara") {
      ({ error } = await addSementaraStokAwal(materialId, quantity, note));
    } else {
      const fn = {
        keluar: reduceMaterialStock,
        ke_sementara: moveToSementara,
        produksi: consumeSementara,
        reject: rejectSementara,
        sisa_produksi: recordSisaBahan,
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
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}
            >
              {config.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {TX_TITLE[type]}
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
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
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
              {type === "sisa_produksi" ? "Jumlah yang Tersisa" : "Jumlah"}{" "}
              {selectedMaterial ? `(${selectedMaterial.satuan})` : ""}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={quantity === 0 ? "" : quantity}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setQuantity(v === "" ? 0 : parseInt(v, 10));
                setFormError(null);
              }}
              placeholder="0"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
            {type === "sisa_produksi" && selectedMaterial && (
              <p
                className={`text-xs mt-1.5 ${
                  quantity > selectedMaterial.stock_sementara
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                Pemakaian Produksi yang akan otomatis tercatat:{" "}
                <span className="font-semibold">
                  {Math.max(
                    selectedMaterial.stock_sementara - quantity,
                    0,
                  ).toLocaleString("id-ID")}{" "}
                  {selectedMaterial.satuan}
                </span>{" "}
                ({selectedMaterial.stock_sementara.toLocaleString("id-ID")} −{" "}
                {quantity.toLocaleString("id-ID")})
              </p>
            )}
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
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
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
              className="px-5 py-2.5 text-gray-700 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                loadingMaterials ||
                materials.length === 0 ||
                (type === "sisa_produksi" &&
                  !!selectedMaterial &&
                  quantity > selectedMaterial.stock_sementara)
              }
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
