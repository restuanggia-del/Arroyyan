import { useEffect, useState, useCallback } from "react";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  X,
  Hourglass,
} from "lucide-react";
import {
  getDistributionsForSales,
  confirmDistributionReceived,
  getReturnsForSales,
  createReturn,
} from "../services/SalesAppService";

interface DistributionPageProps {
  salesId: string;
}

type Distribution = Awaited<
  ReturnType<typeof getDistributionsForSales>
>[number];
type ReturnRow = Awaited<ReturnType<typeof getReturnsForSales>>[number];

const statusLabel: Record<string, string> = {
  pending: "Pending",
  sent: "Dikirim",
  received: "Diterima",
};
const statusColor: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  sent: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
};
const returnStatusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};
const returnStatusColor: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DistributionPage({ salesId }: DistributionPageProps) {
  const [tab, setTab] = useState<"distribusi" | "retur">("distribusi");
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [returnModalDist, setReturnModalDist] = useState<Distribution | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [distData, returnData] = await Promise.all([
        getDistributionsForSales(salesId),
        getReturnsForSales(salesId),
      ]);
      setDistributions(distData);
      setReturns(returnData);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [salesId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (dist: Distribution) => {
    setConfirmingId(dist.id);
    setError("");
    try {
      await confirmDistributionReceived(dist.id, salesId);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Gagal konfirmasi penerimaan.");
    } finally {
      setConfirmingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("distribusi")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "distribusi"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Distribusi
        </button>
        <button
          onClick={() => setTab("retur")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "retur"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Retur {returns.length > 0 ? `(${returns.length})` : ""}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-gray-300 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      ) : tab === "distribusi" ? (
        distributions.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Belum ada distribusi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distributions.map((dist) => (
              <div
                key={dist.id}
                className="bg-white border border-gray-100 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs text-gray-400">#{dist.shortId}</span>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${statusColor[dist.status]}`}
                  >
                    {statusLabel[dist.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2.5">
                  {formatDate(dist.date)}
                </p>

                <div className="space-y-1.5 mb-3">
                  {dist.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.productName}</span>
                      <span className="font-semibold text-gray-900">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {dist.status === "sent" && (
                  <button
                    onClick={() => handleConfirm(dist)}
                    disabled={confirmingId === dist.id}
                    className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {confirmingId === dist.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {confirmingId === dist.id
                      ? "Memproses..."
                      : "Konfirmasi Diterima"}
                  </button>
                )}

                {dist.status === "received" && (
                  <button
                    onClick={() => setReturnModalDist(dist)}
                    className="w-full border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Ajukan Retur
                  </button>
                )}

                {dist.status === "pending" && (
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Menunggu dikirim admin
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : returns.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Belum ada pengajuan retur.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white border border-gray-100 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">#{ret.shortId}</span>
                <span
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${returnStatusColor[ret.status]}`}
                >
                  {ret.status === "pending" && (
                    <Hourglass className="w-3 h-3" />
                  )}
                  {ret.status === "approved" && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {ret.status === "rejected" && <X className="w-3 h-3" />}
                  {returnStatusLabel[ret.status]}
                </span>
              </div>
              {ret.reason && (
                <p className="text-xs text-gray-500 mb-2">
                  Alasan: {ret.reason}
                </p>
              )}
              <div className="space-y-1">
                {ret.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.productName}</span>
                    <span className="font-semibold text-gray-900">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {returnModalDist && (
        <ReturnModal
          salesId={salesId}
          distribution={returnModalDist}
          onClose={() => setReturnModalDist(null)}
          onSuccess={() => {
            setReturnModalDist(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ReturnModal({
  salesId,
  distribution,
  onClose,
  onSuccess,
}: {
  salesId: string;
  distribution: Distribution;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setQty = (productId: string, max: number, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(max, value)),
    }));
  };

  const handleSubmit = async () => {
    const items = distribution.items
      .filter((item) => (quantities[item.productId] ?? 0) > 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: quantities[item.productId],
      }));

    if (items.length === 0) {
      setError("Masukkan jumlah minimal 1 produk untuk diretur.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createReturn(salesId, distribution.id, items, reason);
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Gagal mengajukan retur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            Ajukan Retur — #{distribution.shortId}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {distribution.items.map((item) => (
            <div
              key={item.productId}
              className="border border-gray-100 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-400">
                  Maks: {item.quantity} {item.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setQty(
                      item.productId,
                      item.quantity,
                      (quantities[item.productId] ?? 0) - 1,
                    )
                  }
                  className="w-8 h-8 border border-gray-200 rounded-lg cursor-pointer text-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={quantities[item.productId] ?? 0}
                  onChange={(e) =>
                    setQty(
                      item.productId,
                      item.quantity,
                      Number(e.target.value) || 0,
                    )
                  }
                  className="w-16 text-center border border-gray-200 rounded-lg py-1.5 text-sm"
                />
                <button
                  onClick={() =>
                    setQty(
                      item.productId,
                      item.quantity,
                      (quantities[item.productId] ?? 0) + 1,
                    )
                  }
                  className="w-8 h-8 border border-gray-200 rounded-lg cursor-pointer text-gray-600"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Alasan Retur
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="mis. produk rusak, tidak laku, dsb."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? "Mengirim..." : "Kirim Pengajuan Retur"}
          </button>
        </div>
      </div>
    </div>
  );
}
