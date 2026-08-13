import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import {
  getSalesDepositHistory,
  createSalesDeposit,
} from "../services/SalesAppService";

interface SetoranPageProps {
  salesId: string;
}

type DepositRow = Awaited<ReturnType<typeof getSalesDepositHistory>>[number];

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function SetoranPage({ salesId }: SetoranPageProps) {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSalesDepositHistory(salesId);
      setDeposits(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat riwayat setoran.");
    } finally {
      setLoading(false);
    }
  }, [salesId]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[#111111]">Setoran ke Admin</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#0249E1] text-white px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Setor
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/35">Memuat...</p>
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
          <p className="text-sm text-[#111111]/35">
            Belum ada riwayat setoran.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deposits.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-black/5 rounded-xl p-3.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#111111]/35">
                  {formatDate(d.tanggal)}
                </span>
                <span className="text-sm font-bold text-[#111111]">
                  {formatRp(Number(d.jumlah_cash) + Number(d.jumlah_transfer))}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-[#111111]/45">
                <span>Cash: {formatRp(Number(d.jumlah_cash))}</span>
                <span>Transfer: {formatRp(Number(d.jumlah_transfer))}</span>
              </div>
              {d.keterangan && (
                <p className="text-xs text-[#111111]/35 mt-1.5">
                  {d.keterangan}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SetoranFormModal
          salesId={salesId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function SetoranFormModal({
  salesId,
  onClose,
  onSuccess,
}: {
  salesId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [cash, setCash] = useState("");
  const [transfer, setTransfer] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const total = (Number(cash) || 0) + (Number(transfer) || 0);

  const handleSubmit = async () => {
    if (total <= 0) {
      setError("Masukkan jumlah cash dan/atau transfer yang disetor.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createSalesDeposit(
        salesId,
        Number(cash) || 0,
        Number(transfer) || 0,
        keterangan,
      );
      setDone(true);
      setTimeout(onSuccess, 900);
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan setoran.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="font-bold text-[#111111]">Setor ke Admin</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F4F7FE] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        {done ? (
          <div className="py-12 text-center px-5">
            <CheckCircle2 className="w-12 h-12 text-[#0249E1] mx-auto mb-3" />
            <p className="font-semibold text-[#111111]">Setoran tercatat</p>
            <p className="text-sm text-[#111111]/45">{formatRp(total)}</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Jumlah Cash
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#111111]/35">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Jumlah Transfer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#111111]/35">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  value={transfer}
                  onChange={(e) => setTransfer(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Keterangan (opsional)
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>

            <div className="flex justify-between text-sm font-semibold text-[#111111] px-1">
              <span>Total Setoran</span>
              <span>{formatRp(total)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#0249E1] text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan Setoran"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
