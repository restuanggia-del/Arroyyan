import { useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { KasbonTransaction, addKasbonPayment } from "../../../services";

interface KasbonPaymentModalProps {
  transaction: KasbonTransaction;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const today = () => new Date().toISOString().slice(0, 10);

export default function KasbonPaymentModal({
  transaction,
  onClose,
  onSaveSuccess,
}: KasbonPaymentModalProps) {
  const [tanggalBayar, setTanggalBayar] = useState(today());
  const [dusDibayar, setDusDibayar] = useState(0);
  const [jumlahTransfer, setJumlahTransfer] = useState(0);
  const [jumlahCash, setJumlahCash] = useState(0);
  const [jumlahKeOwner, setJumlahKeOwner] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const totalDibayarRp = jumlahTransfer + jumlahCash;
  const sisaDusBaru = transaction.sisa_dus - dusDibayar;
  const sisaRpBaru = transaction.sisa_rp - totalDibayarRp;

  const numInput = (setter: (v: number) => void) => (value: string) => {
    const v = value.replace(/\D/g, "");
    setter(v === "" ? 0 : parseInt(v, 10));
  };

  const handleSubmit = async () => {
    setFormError("");

    if (dusDibayar === 0 && totalDibayarRp === 0) {
      setFormError("Isi minimal jumlah dus atau nominal yang dibayar.");
      return;
    }

    setSaving(true);
    try {
      await addKasbonPayment(transaction.id, {
        tanggal_bayar: tanggalBayar,
        dus_dibayar: dusDibayar,
        jumlah_transfer: jumlahTransfer,
        jumlah_cash: jumlahCash,
        jumlah_ke_owner: jumlahKeOwner,
        keterangan: keterangan || null,
      });
      onSaveSuccess();
    } catch (err: any) {
      setFormError(err.message ?? "Gagal menyimpan pembayaran.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="clay-raised-lg rounded-t-3xl w-full max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)] flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#111111]">Catat Pembayaran Titipan</h2>
            <p className="text-xs text-[#111111]/45">
              {transaction.customers?.customer_name ?? "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {formError && (
            <div className="p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          <div className="clay-inset-sm rounded-xl p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#111111]/45">Sisa Dus Saat Ini</p>
              <p className="text-base font-bold text-[#111111]">
                {transaction.sisa_dus} unit
              </p>
            </div>
            <div>
              <p className="text-xs text-[#111111]/45">Sisa Tagihan Saat Ini</p>
              <p className="text-base font-bold text-[#111111]">
                {formatRp(transaction.sisa_rp)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Tanggal Bayar
            </label>
            <input
              type="date"
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Dus Dibayar / Dikembalikan
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dusDibayar === 0 ? "" : dusDibayar}
              onChange={(e) => numInput(setDusDibayar)(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Jumlah Transfer
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlahTransfer === 0 ? "" : jumlahTransfer}
                onChange={(e) => numInput(setJumlahTransfer)(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Jumlah Cash
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlahCash === 0 ? "" : jumlahCash}
                onChange={(e) => numInput(setJumlahCash)(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Disetorkan ke Owner{" "}
              <span className="font-normal text-[#111111]/30">(opsional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={jumlahKeOwner === 0 ? "" : jumlahKeOwner}
              onChange={(e) => numInput(setJumlahKeOwner)(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
            <p className="text-xs text-[#111111]/35 mt-1">
              Bagian dari hasil pembayaran ini yang langsung disetor ke owner.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
              Catatan{" "}
              <span className="font-normal text-[#111111]/30">(opsional)</span>
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: tf ke rek BRI (nama penerima)"
              className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
            />
          </div>

          <div className="rounded-xl p-4 grid grid-cols-2 gap-3 bg-[#0249E1]/5 border border-[#0249E1]/20">
            <div>
              <p className="text-xs text-[#0249E1]">Sisa Dus Setelah Ini</p>
              <p
                className={`text-base font-bold ${
                  sisaDusBaru < 0 ? "text-[#EE3D5A]" : "text-[#111111]"
                }`}
              >
                {sisaDusBaru} unit
              </p>
            </div>
            <div>
              <p className="text-xs text-[#0249E1]">Sisa Tagihan Setelah Ini</p>
              <p
                className={`text-base font-bold ${
                  sisaRpBaru < 0 ? "text-[#EE3D5A]" : "text-[#111111]"
                }`}
              >
                {formatRp(sisaRpBaru)}
              </p>
            </div>
            {(sisaDusBaru < 0 || sisaRpBaru < 0) && (
              <p className="col-span-2 text-xs text-[#EE3D5A]">
                ⚠ Nilai melebihi sisa tagihan — pastikan input sudah benar.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-[rgba(140,172,214,0.35)] px-5 py-4 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full clay-blue clay-pressable text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
