import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightCircle,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Ban,
  FlaskConical,
} from "lucide-react";
import {
  getActiveMaterials,
  Material,
  addMaterialStock,
  reduceMaterialStock,
  moveToSementara,
  addSementaraStokAwal,
  recordSampel,
  recordRejectBahan,
  MOVEMENT_TYPE_LABEL,
  REJECT_BAHAN_REASON_SUGGESTIONS,
} from "../../../services/materialService";

export type MaterialTxType =
  | "masuk"
  | "stok_awal"
  | "keluar"
  | "ke_sementara"
  | "stok_awal_sementara"
  | "sampel"
  | "reject_bahan";

interface MaterialTransactionModalProps {
  type: MaterialTxType;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const TX_TITLE: Record<MaterialTxType, string> = {
  masuk: MOVEMENT_TYPE_LABEL.masuk,
  stok_awal: MOVEMENT_TYPE_LABEL.stok_awal,
  keluar: MOVEMENT_TYPE_LABEL.keluar,
  ke_sementara: MOVEMENT_TYPE_LABEL.ke_sementara,
  stok_awal_sementara: MOVEMENT_TYPE_LABEL.stok_awal_sementara,
  sampel: MOVEMENT_TYPE_LABEL.sampel_out,
  reject_bahan: MOVEMENT_TYPE_LABEL.reject_bahan,
};

const TX_CONFIG: Record<
  MaterialTxType,
  {
    icon: React.ReactNode;
    color: "green" | "cyan" | "red" | "blue" | "amber" | "teal" | "rose";
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
  sampel: {
    icon: <FlaskConical className="w-5 h-5" />,
    color: "teal",
    sourceField: "stock_sementara",
    notePlaceholder: "Contoh: Sampel QC batch pagi",
    effectText:
      "⚠ Stok Sementara akan berkurang (diambil sebagai sampel, bukan reject/pemakaian).",
  },
  reject_bahan: {
    icon: <Ban className="w-5 h-5" />,
    color: "rose",
    sourceField: "stock_sementara",
    notePlaceholder:
      "Contoh: Kardus sobek/basah saat penyimpanan di ruang produksi",
    effectText:
      "⚠ Stok Sementara akan berkurang. Dipakai untuk bahan yang rusak SEBELUM sempat dipakai produksi di luar sesi Pemakaian Produksi.",
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
    teal: {
      bg: "bg-teal-100",
      text: "text-teal-600",
      btn: "bg-teal-600 hover:bg-teal-700",
    },
    rose: {
      bg: "bg-rose-100",
      text: "text-rose-600",
      btn: "bg-rose-600 hover:bg-rose-700",
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
  const [singleReason, setSingleReason] = useState("");
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

  const isRejectBahan = type === "reject_bahan";
  const overStock =
    !!config.sourceField &&
    !!selectedMaterial &&
    config.sourceField === "stock_sementara" &&
    quantity > selectedMaterial.stock_sementara;
  const overStockGudang =
    !!config.sourceField &&
    !!selectedMaterial &&
    config.sourceField === "stock_quantity" &&
    quantity > selectedMaterial.stock_quantity;

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
    if (overStock && selectedMaterial) {
      setFormError(
        `Jumlah yang diambil (${quantity} ${selectedMaterial.satuan}) tidak boleh lebih besar dari Stok Sementara saat ini (${selectedMaterial.stock_sementara} ${selectedMaterial.satuan}).`,
      );
      return;
    }
    if (overStockGudang && selectedMaterial) {
      setFormError(
        `Jumlah yang diambil (${quantity} ${selectedMaterial.satuan}) tidak boleh lebih besar dari Stok Gudang saat ini (${selectedMaterial.stock_quantity} ${selectedMaterial.satuan}).`,
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    let error;
    if (type === "masuk" || type === "stok_awal") {
      ({ error } = await addMaterialStock(materialId, quantity, note, type));
    } else if (type === "stok_awal_sementara") {
      ({ error } = await addSementaraStokAwal(materialId, quantity, note));
    } else if (type === "sampel") {
      ({ error } = await recordSampel(materialId, quantity, note));
    } else if (type === "reject_bahan") {
      ({ error } = await recordRejectBahan(
        materialId,
        quantity,
        singleReason || "Lainnya",
        note,
      ));
    } else {
      const fn = {
        keluar: reduceMaterialStock,
        ke_sementara: moveToSementara,
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
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
              Jumlah {selectedMaterial ? `(${selectedMaterial.satuan})` : ""}{" "}
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
              className={`w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 ${
                overStock || overStockGudang ? "ring-2 ring-red-400" : ""
              }`}
            />
            {selectedMaterial &&
              (selectedMaterial.isi_per_satuan || 0) > 0 &&
              quantity > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {quantity.toLocaleString("id-ID")} {selectedMaterial.satuan} ×{" "}
                  {(selectedMaterial.isi_per_satuan || 0).toLocaleString(
                    "id-ID",
                  )}{" "}
                  pcs ={" "}
                  <span className="font-semibold text-gray-500">
                    {(
                      quantity * (selectedMaterial.isi_per_satuan || 0)
                    ).toLocaleString("id-ID")}{" "}
                    pcs
                  </span>
                </p>
              )}
            {overStock && selectedMaterial && (
              <p className="text-xs mt-1.5 text-red-600">
                Melebihi Stok Sementara saat ini (
                {selectedMaterial.stock_sementara} {selectedMaterial.satuan}).
              </p>
            )}
            {overStockGudang && selectedMaterial && (
              <p className="text-xs mt-1.5 text-red-600">
                Melebihi Stok Gudang saat ini ({selectedMaterial.stock_quantity}{" "}
                {selectedMaterial.satuan}).
              </p>
            )}
          </div>

          {isRejectBahan && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alasan / Jenis Reject Bahan
                <span className="text-gray-400 font-normal ml-1">
                  (opsional)
                </span>
              </label>
              <input
                type="text"
                list="reject-bahan-reason-suggestions"
                value={singleReason}
                onChange={(e) => setSingleReason(e.target.value)}
                placeholder="Contoh: Kardus sobek/basah"
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400/40"
              />
              <datalist id="reject-bahan-reason-suggestions">
                {REJECT_BAHAN_REASON_SUGGESTIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          )}

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
                overStock ||
                overStockGudang
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
