import { useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import {
  KasbonTransaction,
  addKasbonPayment,
} from "../../services/kasbonService";

interface KasbonPaymentModalProps {
  transaction: KasbonTransaction;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const today = () => new Date().toISOString().slice(0, 10);

export function KasbonPaymentModal({
  transaction,
  onClose,
  onSaveSuccess,
}: KasbonPaymentModalProps) {
  const [tanggalBayar, setTanggalBayar] = useState(today());
  const [dusDibayar, setDusDibayar] = useState(0);
  const [jumlahTransfer, setJumlahTransfer] = useState(0);
  const [jumlahCash, setJumlahCash] = useState(0);
  const [jumlahKeOwner, setJumlahKeOwner] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalDibayarRp = jumlahTransfer + jumlahCash;
  const sisaDusBaru = transaction.sisa_dus - dusDibayar;
  const sisaRpBaru = transaction.sisa_rp - totalDibayarRp;

  const numInput = (setter: (v: number) => void) => (value: string) => {
    const v = value.replace(/\D/g, "");
    setter(v === "" ? 0 : parseInt(v, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (dusDibayar === 0 && totalDibayarRp === 0) {
      setFormError("Isi minimal jumlah dus atau nominal yang dibayar.");
      return;
    }

    setSaving(true);
    const { error } = await addKasbonPayment(transaction.id, {
      tanggal_bayar: tanggalBayar,
      dus_dibayar: dusDibayar,
      jumlah_transfer: jumlahTransfer,
      jumlah_cash: jumlahCash,
      jumlah_ke_owner: jumlahKeOwner,
    });

    if (error) {
      setFormError("Gagal menyimpan pembayaran: " + (error as any).message);
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Catat Pembayaran Titipan
            </h2>
            <p className="text-sm text-gray-500">
              {transaction.customers?.customer_name ?? "—"}
            </p>
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

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Sisa Dus Saat Ini</p>
              <p className="text-lg font-bold text-gray-900">
                {transaction.sisa_dus} unit
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sisa Tagihan Saat Ini</p>
              <p className="text-lg font-bold text-gray-900">
                {formatRp(transaction.sisa_rp)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tanggal Bayar <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dus Dibayar / Dikembalikan
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dusDibayar === 0 ? "" : dusDibayar}
              onChange={(e) => numInput(setDusDibayar)(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah Transfer
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlahTransfer === 0 ? "" : jumlahTransfer}
                onChange={(e) => numInput(setJumlahTransfer)(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah Cash
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlahCash === 0 ? "" : jumlahCash}
                onChange={(e) => numInput(setJumlahCash)(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Disetorkan ke Owner
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={jumlahKeOwner === 0 ? "" : jumlahKeOwner}
              onChange={(e) => numInput(setJumlahKeOwner)(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Bagian dari hasil pembayaran ini yang langsung disetor ke owner
              (pencatatan saja, tidak memengaruhi sisa tagihan).
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-blue-600">Sisa Dus Setelah Ini</p>
              <p
                className={`text-lg font-bold ${sisaDusBaru < 0 ? "text-red-600" : "text-blue-900"}`}
              >
                {sisaDusBaru} unit
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Sisa Tagihan Setelah Ini</p>
              <p
                className={`text-lg font-bold ${sisaRpBaru < 0 ? "text-red-600" : "text-blue-900"}`}
              >
                {formatRp(sisaRpBaru)}
              </p>
            </div>
            {(sisaDusBaru < 0 || sisaRpBaru < 0) && (
              <p className="col-span-2 text-xs text-red-600">
                ⚠ Nilai melebihi sisa tagihan — pastikan input sudah benar (bisa
                jadi kelebihan bayar/koreksi).
              </p>
            )}
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
              disabled={saving}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
