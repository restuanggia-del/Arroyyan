import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, MinusCircle } from "lucide-react";
import { getActiveKaryawan, Karyawan } from "../../services/karyawanService";
import { getActiveSales, Sales } from "../../services/salesService";
import {
  createPotongan,
  PotonganKategori,
  PotonganOwnerType,
  KATEGORI_POTONGAN_LABEL,
  OWNER_TYPE_LABEL,
} from "../../services/potonganSetoranService";

interface PotonganModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PotonganModal({ onClose, onSaveSuccess }: PotonganModalProps) {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tanggal, setTanggal] = useState(today());
  const [kategori, setKategori] = useState<PotonganKategori>("bbm");
  const [ownerType, setOwnerType] = useState<PotonganOwnerType>("karyawan");
  const [ownerId, setOwnerId] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingOptions(true);
      const [karyawanRes, salesRes] = await Promise.all([
        getActiveKaryawan(),
        getActiveSales(),
      ]);
      setKaryawanList(karyawanRes.data || []);
      setSalesList(salesRes.data || []);
      setLoadingOptions(false);
    };
    load();
  }, []);

  const options = ownerType === "karyawan" ? karyawanList : salesList;

  const handleOwnerTypeChange = (value: PotonganOwnerType) => {
    setOwnerType(value);
    setOwnerId("");
    setFormError(null);
  };

  const handleJumlahChange = (value: string) => {
    const v = value.replace(/\D/g, "");
    setJumlah(v === "" ? 0 : parseInt(v, 10));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
      setFormError(
        `Pilih ${ownerType === "karyawan" ? "karyawan" : "sales"} terlebih dahulu.`,
      );
      return;
    }
    if (jumlah <= 0) {
      setFormError("Jumlah potongan harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } = await createPotongan({
      tanggal,
      kategori,
      owner_type: ownerType,
      owner_id: ownerId,
      jumlah,
      keterangan: keterangan || null,
    });

    if (error) {
      setFormError("Gagal menyimpan potongan: " + (error as any).message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <MinusCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Tambah Potongan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jenis Pemilik Potongan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(OWNER_TYPE_LABEL) as PotonganOwnerType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleOwnerTypeChange(type)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      ownerType === type
                        ? "clay-red text-white border-transparent"
                        : "clay-inset border-0 text-gray-700"
                    }`}
                  >
                    {OWNER_TYPE_LABEL[type]}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={kategori}
                onChange={(e) =>
                  setKategori(e.target.value as PotonganKategori)
                }
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
              >
                {Object.entries(KATEGORI_POTONGAN_LABEL).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ownerType === "karyawan" ? "Karyawan" : "Sales"}{" "}
              <span className="text-red-500">*</span>
            </label>
            {loadingOptions ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat daftar {ownerType === "karyawan" ? "karyawan" : "sales"}
                ...
              </div>
            ) : options.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Belum ada {ownerType === "karyawan" ? "karyawan" : "sales"}{" "}
                aktif. Tambahkan terlebih dahulu di Manajemen{" "}
                {ownerType === "karyawan" ? "Karyawan" : "Sales"}.
              </p>
            ) : (
              <select
                required
                value={ownerId}
                onChange={(e) => {
                  setOwnerId(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
              >
                <option value="">
                  -- Pilih {ownerType === "karyawan" ? "Karyawan" : "Sales"} --
                </option>
                {ownerType === "karyawan"
                  ? karyawanList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))
                  : salesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_sales}
                      </option>
                    ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jumlah (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={jumlah === 0 ? "" : jumlah}
              onChange={(e) => handleJumlahChange(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keterangan
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Bensin motor untuk antar dus ke toko A"
              rows={3}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
            />
          </div>

          <div className="clay-inset-red border-0 rounded-xl p-4">
            <p className="text-sm font-medium text-red-800">
              ⚠ Potongan ini akan mengurangi Sisa Dana Penjualan{" "}
              {ownerType === "karyawan" ? "karyawan" : "sales"} terkait
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
              disabled={saving || loadingOptions || options.length === 0}
              className="px-5 py-2.5 clay-red clay-pressable text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Potongan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
