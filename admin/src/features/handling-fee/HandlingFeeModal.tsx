import { useState, useEffect, useMemo } from "react";
import {
  X,
  RefreshCw,
  AlertCircle,
  HardHat,
  UserPlus,
  Trash2,
} from "lucide-react";
import { getActiveKaryawan, Karyawan } from "../../services/karyawanService";
import { createHandlingFee } from "../../services/handlingFeeService";

interface HandlingFeeModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface SelectedWorker {
  key: string;
  type: "karyawan" | "manual";
  karyawan_id?: string;
  nama: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const DEFAULT_RATE = 300;

export function HandlingFeeModal({
  onClose,
  onSaveSuccess,
}: HandlingFeeModalProps) {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loadingKaryawan, setLoadingKaryawan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tanggal, setTanggal] = useState(today());
  const [jumlahDus, setJumlahDus] = useState(0);
  const [ratePerDus, setRatePerDus] = useState(DEFAULT_RATE);
  const [keterangan, setKeterangan] = useState("");

  const [selectedWorkers, setSelectedWorkers] = useState<SelectedWorker[]>([]);
  const [manualNameInput, setManualNameInput] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingKaryawan(true);
      const { data } = await getActiveKaryawan("handling");
      setKaryawanList(data || []);
      setLoadingKaryawan(false);
    };
    load();
  }, []);

  const totalFee = jumlahDus * ratePerDus;
  const feePerOrang = useMemo(() => {
    if (selectedWorkers.length === 0) return 0;
    return Math.round((totalFee / selectedWorkers.length) * 100) / 100;
  }, [totalFee, selectedWorkers.length]);

  const handleNumberChange =
    (setter: (v: number) => void) => (value: string) => {
      const v = value.replace(/\D/g, "");
      setter(v === "" ? 0 : parseInt(v, 10));
      setFormError(null);
    };

  const toggleKaryawan = (k: Karyawan) => {
    const key = `k:${k.id}`;
    setSelectedWorkers((prev) => {
      const exists = prev.some((w) => w.key === key);
      if (exists) return prev.filter((w) => w.key !== key);
      return [
        ...prev,
        { key, type: "karyawan", karyawan_id: k.id, nama: k.nama },
      ];
    });
    setFormError(null);
  };

  const handleAddManualWorker = () => {
    const nama = manualNameInput.trim();
    if (!nama) return;

    const key = `m:${nama.toLowerCase()}`;
    const alreadyAdded = selectedWorkers.some((w) => w.key === key);
    if (alreadyAdded) {
      setFormError(`"${nama}" sudah ada di daftar.`);
      return;
    }

    setSelectedWorkers((prev) => [...prev, { key, type: "manual", nama }]);
    setManualNameInput("");
    setFormError(null);
  };

  const handleRemoveWorker = (key: string) => {
    setSelectedWorkers((prev) => prev.filter((w) => w.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jumlahDus <= 0) {
      setFormError("Jumlah dus harus lebih dari 0.");
      return;
    }
    if (selectedWorkers.length === 0) {
      setFormError(
        "Pilih minimal 1 karyawan atau tambahkan minimal 1 nama pekerja manual.",
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } = await createHandlingFee({
      tanggal,
      jumlah_dus: jumlahDus,
      rate_per_dus: ratePerDus,
      keterangan: keterangan || null,
      workers: selectedWorkers.map((w) =>
        w.type === "karyawan"
          ? { karyawan_id: w.karyawan_id }
          : { nama_manual: w.nama },
      ),
    });

    if (error) {
      setFormError("Gagal menyimpan handling fee: " + (error as any).message);
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
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Tambah Handling Fee
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
                Jumlah Dus <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={jumlahDus === 0 ? "" : jumlahDus}
                onChange={(e) =>
                  handleNumberChange(setJumlahDus)(e.target.value)
                }
                placeholder="0"
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rate per Dus (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={ratePerDus === 0 ? "" : ratePerDus}
              onChange={(e) =>
                handleNumberChange(setRatePerDus)(e.target.value)
              }
              placeholder="300"
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
            <p className="text-xs text-gray-400 mt-1">
              Default Rp 300/dus, bisa disesuaikan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Karyawan yang Mengerjakan
            </label>
            {loadingKaryawan ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat daftar karyawan...
              </div>
            ) : karyawanList.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Belum ada karyawan aktif dengan peran handling.
              </p>
            ) : (
              <div className="border border-[rgba(140,172,214,0.35)] rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                {karyawanList.map((k) => (
                  <label
                    key={k.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[rgba(215,233,255,0.5)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWorkers.some(
                        (w) => w.key === `k:${k.id}`,
                      )}
                      onChange={() => toggleKaryawan(k)}
                      className="w-4 h-4 rounded border-[rgba(140,172,214,0.5)] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{k.nama}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tambah Pekerja Lain (bukan dari Manajemen Karyawan)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualNameInput}
                onChange={(e) => {
                  setManualNameInput(e.target.value);
                  setFormError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddManualWorker();
                  }
                }}
                placeholder="Contoh: Pak Slamet (bantuan harian)"
                className="flex-1 px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
              <button
                type="button"
                onClick={handleAddManualWorker}
                disabled={!manualNameInput.trim()}
                className="px-4 py-2.5 clay-inset border-0 rounded-lg text-orange-600 hover:bg-orange-50 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Tambah
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Untuk orang yang bantu handling tapi belum terdaftar sebagai
              karyawan (mis. pekerja lepas/harian).
            </p>
          </div>

          {selectedWorkers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Daftar yang Akan Mendapat Fee ({selectedWorkers.length} orang)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedWorkers.map((w) => (
                  <span
                    key={w.key}
                    className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium ${
                      w.type === "manual"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {w.nama}
                    {w.type === "manual" && (
                      <span className="text-[10px] text-purple-500 font-normal">
                        (manual)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveWorker(w.key)}
                      className="p-0.5 hover:bg-black/10 rounded-full cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Fee akan dibagi rata ke semua orang di daftar ini.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keterangan
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Handling batch produksi pagi"
              rows={2}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
            />
          </div>

          <div className="clay-inset-amber border-0 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-800">Total Fee</span>
              <span className="font-semibold text-orange-900">
                Rp {totalFee.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-800">
                Fee per Orang ({selectedWorkers.length || 0} orang)
              </span>
              <span className="font-semibold text-orange-900">
                Rp {feePerOrang.toLocaleString("id-ID")}
              </span>
            </div>
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
              disabled={saving}
              className="px-5 py-2.5 clay-amber clay-pressable text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Handling Fee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
