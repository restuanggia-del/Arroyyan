import { useState, useEffect, useMemo } from "react";
import { X, RefreshCw, AlertCircle, HardHat } from "lucide-react";
import { getActiveKaryawan, Karyawan } from "../../services/karyawanService";
import { createHandlingFee } from "../../services/handlingFeeService";

interface HandlingFeeModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
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
  const [selectedKaryawanIds, setSelectedKaryawanIds] = useState<string[]>([]);

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
    if (selectedKaryawanIds.length === 0) return 0;
    return Math.round((totalFee / selectedKaryawanIds.length) * 100) / 100;
  }, [totalFee, selectedKaryawanIds.length]);

  const handleNumberChange =
    (setter: (v: number) => void) => (value: string) => {
      const v = value.replace(/\D/g, "");
      setter(v === "" ? 0 : parseInt(v, 10));
      setFormError(null);
    };

  const toggleKaryawan = (id: string) => {
    setSelectedKaryawanIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jumlahDus <= 0) {
      setFormError("Jumlah dus harus lebih dari 0.");
      return;
    }
    if (selectedKaryawanIds.length === 0) {
      setFormError("Pilih minimal 1 karyawan yang mengerjakan handling.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } = await createHandlingFee({
      tanggal,
      jumlah_dus: jumlahDus,
      rate_per_dus: ratePerDus,
      keterangan: keterangan || null,
      karyawan_ids: selectedKaryawanIds,
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
              Karyawan yang Mengerjakan <span className="text-red-500">*</span>
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
                      checked={selectedKaryawanIds.includes(k.id)}
                      onChange={() => toggleKaryawan(k.id)}
                      className="w-4 h-4 rounded border-[rgba(140,172,214,0.5)] text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{k.nama}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Fee akan dibagi rata ke semua karyawan yang dicentang.
            </p>
          </div>

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
                Fee per Orang ({selectedKaryawanIds.length || 0} karyawan)
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
              disabled={saving || loadingKaryawan || karyawanList.length === 0}
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
