import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, MinusCircle } from "lucide-react";
import { getActiveKaryawan, Karyawan } from "../../services/karyawanService";
import {
  createPotongan,
  PotonganKategori,
  KATEGORI_POTONGAN_LABEL,
} from "../../services/potonganSetoranService";

interface PotonganModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PotonganModal({ onClose, onSaveSuccess }: PotonganModalProps) {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loadingKaryawan, setLoadingKaryawan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tanggal, setTanggal] = useState(today());
  const [kategori, setKategori] = useState<PotonganKategori>("bbm");
  const [karyawanId, setKaryawanId] = useState("");
  const [jumlah, setJumlah] = useState(0);
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingKaryawan(true);
      const { data } = await getActiveKaryawan();
      setKaryawanList(data || []);
      setLoadingKaryawan(false);
    };
    load();
  }, []);

  const handleJumlahChange = (value: string) => {
    const v = value.replace(/\D/g, "");
    setJumlah(v === "" ? 0 : parseInt(v, 10));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!karyawanId) {
      setFormError("Pilih karyawan terlebih dahulu.");
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
      karyawan_id: karyawanId,
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              Karyawan <span className="text-red-500">*</span>
            </label>
            {loadingKaryawan ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat daftar karyawan...
              </div>
            ) : karyawanList.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Belum ada karyawan aktif. Tambahkan karyawan terlebih dahulu.
              </p>
            ) : (
              <select
                required
                value={karyawanId}
                onChange={(e) => {
                  setKaryawanId(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Karyawan --</option>
                {karyawanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-800">
              ⚠ Potongan ini akan mengurangi Sisa Dana Penjualan karyawan
              terkait
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
              disabled={saving || loadingKaryawan || karyawanList.length === 0}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
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
