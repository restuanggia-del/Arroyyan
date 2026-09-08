import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  Material,
  createMaterial,
  updateMaterial,
  addMaterialStock,
  reduceMaterialStock,
  MATERIAL_MINIMUM_STOCK,
} from "../../../services/materialService";

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

type MinStokActiveField = "satuan" | "pcs";

interface FormState {
  nama_bahan: string;
  satuan: string;
  is_active: boolean;
  isi_per_satuan: string;
  jumlah: string;
  minimum_stock_satuan: string;
  minimum_stock_pcs: string;
  minimum_stock_active: MinStokActiveField;
}

const defaultForm: FormState = {
  nama_bahan: "",
  satuan: "kg",
  is_active: true,
  isi_per_satuan: "",
  jumlah: "",
  minimum_stock_satuan: String(MATERIAL_MINIMUM_STOCK),
  minimum_stock_pcs: "",
  minimum_stock_active: "satuan",
};

export function MaterialModal({
  material,
  onClose,
  onSaveSuccess,
}: MaterialModalProps) {
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      const minStok = material.minimum_stock ?? MATERIAL_MINIMUM_STOCK;
      setFormData({
        nama_bahan: material.nama_bahan,
        satuan: material.satuan,
        is_active: material.is_active,
        isi_per_satuan:
          material.isi_per_satuan != null
            ? String(material.isi_per_satuan)
            : "",
        jumlah: String(material.stock_quantity),
        minimum_stock_satuan: String(minStok),
        minimum_stock_pcs: material.isi_per_satuan
          ? String(minStok * material.isi_per_satuan)
          : "",
        minimum_stock_active: "satuan",
      });
    } else {
      setFormData(defaultForm);
    }
  }, [material]);

  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleMinStokSatuanChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      minimum_stock_satuan: cleaned,
      minimum_stock_active: "satuan",
    }));
    setFormError(null);
  };

  const handleMinStokPcsChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      minimum_stock_pcs: cleaned,
      minimum_stock_active: "pcs",
    }));
    setFormError(null);
  };

  const isiPerSatuanNum = parseInt(formData.isi_per_satuan, 10) || 0;
  const jumlahNum = parseInt(formData.jumlah, 10) || 0;
  const pcsPreview = jumlahNum * isiPerSatuanNum;
  const jumlahAsalNum = material ? Number(material.stock_quantity) : 0;
  const selisih = jumlahNum - jumlahAsalNum;

  const minStokSatuanNum = parseInt(formData.minimum_stock_satuan, 10) || 0;
  const minStokPcsNum = parseInt(formData.minimum_stock_pcs, 10) || 0;

  // Nilai final minimal stok yang akan disimpan, selalu dalam satuan bahan
  // (sama seperti stock_quantity), mengikuti field mana yang terakhir diisi.
  const minimumStockFinal =
    formData.minimum_stock_active === "pcs" && isiPerSatuanNum > 0
      ? Math.ceil(minStokPcsNum / isiPerSatuanNum)
      : minStokSatuanNum;
  const minimumStockFinalPcs =
    isiPerSatuanNum > 0 ? minimumStockFinal * isiPerSatuanNum : null;

  // Nilai yang ditampilkan di field yang sedang tidak aktif, dihitung otomatis
  // dari field yang aktif supaya keduanya selalu sinkron.
  const minStokSatuanDisplay =
    formData.minimum_stock_active === "satuan"
      ? formData.minimum_stock_satuan
      : isiPerSatuanNum > 0
        ? String(Math.ceil(minStokPcsNum / isiPerSatuanNum))
        : formData.minimum_stock_satuan;
  const minStokPcsDisplay =
    formData.minimum_stock_active === "pcs"
      ? formData.minimum_stock_pcs
      : isiPerSatuanNum > 0
        ? String(minStokSatuanNum * isiPerSatuanNum)
        : formData.minimum_stock_pcs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const isiPerSatuanTrimmed = formData.isi_per_satuan.trim();
    const jumlahTrimmed = formData.jumlah.trim();
    const payload = {
      nama_bahan: formData.nama_bahan.trim(),
      satuan: formData.satuan.trim(),
      is_active: formData.is_active,
      isi_per_satuan: isiPerSatuanTrimmed
        ? parseInt(isiPerSatuanTrimmed, 10)
        : null,
      minimum_stock: minimumStockFinal,
    };
    const jumlah = jumlahTrimmed ? parseInt(jumlahTrimmed, 10) : 0;

    if (!payload.nama_bahan) {
      setFormError("Nama bahan wajib diisi.");
      setSaving(false);
      return;
    }
    if (!payload.satuan) {
      setFormError("Satuan wajib diisi.");
      setSaving(false);
      return;
    }
    if (payload.isi_per_satuan !== null && payload.isi_per_satuan < 1) {
      setFormError(
        "Isi per Satuan harus angka lebih dari 0, atau kosongkan saja.",
      );
      setSaving(false);
      return;
    }
    if (jumlah < 0) {
      setFormError("Jumlah tidak boleh negatif.");
      setSaving(false);
      return;
    }

    if (material) {
      const { error } = await updateMaterial(material.id, payload);
      if (error) {
        setFormError("Gagal menyimpan: " + error.message);
        setSaving(false);
        return;
      }

      const diff = jumlah - Number(material.stock_quantity);
      if (diff !== 0) {
        const note = `Koreksi manual dari Edit Bahan (${material.stock_quantity} → ${jumlah} ${payload.satuan})`;
        const { error: stokError } =
          diff > 0
            ? await addMaterialStock(material.id, diff, note, "masuk")
            : await reduceMaterialStock(material.id, -diff, note);
        if (stokError) {
          setFormError(
            `Data bahan tersimpan, tapi gagal menyesuaikan jumlah stok: ${stokError.message}.`,
          );
          setSaving(false);
          return;
        }
      }
    } else {
      const { data, error } = await createMaterial(payload);
      if (error || !data) {
        setFormError("Gagal menyimpan: " + (error?.message ?? "unknown error"));
        setSaving(false);
        return;
      }

      if (jumlah > 0) {
        const { error: stokError } = await addMaterialStock(
          data.id,
          jumlah,
          "Stok awal saat bahan ditambahkan",
          "stok_awal",
        );
        if (stokError) {
          setFormError(
            `Bahan tersimpan, tapi gagal mencatat stok awal: ${stokError.message}. Silakan tambahkan lewat tombol "Stok Awal".`,
          );
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {material ? "Edit Bahan" : "Tambah Bahan Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 clay-inset-red border-0 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Bahan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama_bahan}
              onChange={(e) => handleChange("nama_bahan", e.target.value)}
              placeholder="Contoh: Preform Botol 600ml, Tutup Cup, Sedotan"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Satuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.satuan}
                onChange={(e) => handleChange("satuan", e.target.value)}
                placeholder="kg / pcs / roll"
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.is_active ? "aktif" : "nonaktif"}
                onChange={(e) =>
                  handleChange("is_active", e.target.value === "aktif")
                }
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Isi per Satuan (pcs)
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.isi_per_satuan}
              onChange={(e) =>
                handleChange(
                  "isi_per_satuan",
                  e.target.value.replace(/[^0-9]/g, ""),
                )
              }
              placeholder="Contoh: 88 (kalau satuan '1ball' = 88 pcs)"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
            <p className="text-xs text-gray-400 mt-1">
              Isi kalau satuan bahan ini bukan pcs (misal 1 ball, 1 dus, 1
              ikat). Dipakai untuk menampilkan kolom "Pcs" di tabel & laporan,
              dan supaya form "Bahan Rusak/Reject" & "Sisa Bahan" bisa diinput
              langsung dalam pcs. Kosongkan kalau satuan bahan sudah pcs.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Minimal Stok
              <span className="text-gray-400 font-normal ml-1">
                (untuk peringatan stok menipis)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Dalam satuan ({formData.satuan || "satuan"})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minStokSatuanDisplay}
                  onChange={(e) => handleMinStokSatuanChange(e.target.value)}
                  placeholder="Contoh: 100"
                  className={`w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 ${
                    formData.minimum_stock_active === "satuan"
                      ? "ring-2 ring-[#0249E1]/30"
                      : ""
                  }`}
                />
                {isiPerSatuanNum > 0 && minStokSatuanNum > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ={" "}
                    {(minStokSatuanNum * isiPerSatuanNum).toLocaleString(
                      "id-ID",
                    )}{" "}
                    pcs
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Atau dalam pcs
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isiPerSatuanNum <= 0}
                  value={minStokPcsDisplay}
                  onChange={(e) => handleMinStokPcsChange(e.target.value)}
                  placeholder={isiPerSatuanNum > 0 ? "Contoh: 2500" : "-"}
                  className={`w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.minimum_stock_active === "pcs"
                      ? "ring-2 ring-[#0249E1]/30"
                      : ""
                  }`}
                />
                {isiPerSatuanNum > 0 && minStokPcsNum > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ={" "}
                    {Math.ceil(minStokPcsNum / isiPerSatuanNum).toLocaleString(
                      "id-ID",
                    )}{" "}
                    {formData.satuan || "satuan"} (dibulatkan ke atas)
                  </p>
                )}
                {isiPerSatuanNum <= 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Isi "Isi per Satuan" dulu untuk input dalam pcs.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Isi salah satu saja — field yang terakhir kamu ubah yang dipakai
              sistem, satunya lagi ikut terhitung otomatis. Kalau Stok Gudang
              sudah di bawah angka ini, bahan ditandai "Menipis" dan masuk
              peringatan stok kritis.
              {minimumStockFinal > 0 && (
                <>
                  {" "}
                  Nilai yang dipakai:{" "}
                  <span className="font-semibold text-gray-700">
                    {minimumStockFinal.toLocaleString("id-ID")}{" "}
                    {formData.satuan || "satuan"}
                  </span>
                  {minimumStockFinalPcs != null && (
                    <> (~{minimumStockFinalPcs.toLocaleString("id-ID")} pcs)</>
                  )}
                  .
                </>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah{" "}
              <span className="text-gray-400 font-normal">
                ({formData.satuan || "satuan"})
              </span>
              {!material && (
                <span className="text-gray-400 font-normal ml-1">
                  (opsional, stok awal di Gudang)
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.jumlah}
              onChange={(e) =>
                handleChange("jumlah", e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
            {isiPerSatuanNum > 0 && jumlahNum > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {jumlahNum.toLocaleString("id-ID")} {formData.satuan} ×{" "}
                {isiPerSatuanNum.toLocaleString("id-ID")} pcs ={" "}
                <span className="font-semibold">
                  {pcsPreview.toLocaleString("id-ID")} pcs
                </span>
              </p>
            )}
            {!material ? (
              <p className="text-xs text-gray-400 mt-1">
                Kosongkan (0) kalau belum ada stok awal — bisa ditambahkan
                belakangan lewat tombol "Stok Awal".
              </p>
            ) : (
              selisih !== 0 && (
                <p
                  className={`text-xs mt-1 ${selisih > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  Ini adalah Stok Gudang. Akan tercatat sebagai penyesuaian{" "}
                  {selisih > 0 ? "tambah" : "kurang"}{" "}
                  <span className="font-semibold">
                    {Math.abs(selisih).toLocaleString("id-ID")}{" "}
                    {formData.satuan}
                  </span>{" "}
                  ({jumlahAsalNum.toLocaleString("id-ID")} →{" "}
                  {jumlahNum.toLocaleString("id-ID")}) di riwayat pergerakan.
                  Stok Sementara tidak terpengaruh — ubah lewat tombol transaksi
                  Stok Sementara.
                </p>
              )
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              disabled={saving}
              className="px-5 py-2.5 clay-blue clay-pressable text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {material ? "Simpan Perubahan" : "Tambah Bahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
