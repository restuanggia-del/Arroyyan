import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Send,
  RotateCcw,
  X,
  Hourglass,
} from "lucide-react";
import { DistributionModal } from "./DistributionModal";
import {
  getAllDistributions,
  updateDistributionStatus,
  Distribution,
} from "../../services/distributionService";
import {
  getAllReturns,
  reviewReturn,
  ReturnRow,
} from "../../services/returnService";

type FilterStatus = "all" | "pending" | "sent" | "received" | "return";

interface DistributionManagementProps {
  currentUserId: string;
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  sent: "Dikirim",
  received: "Diterima",
};
const statusBadge: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  sent: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
};

const returnStatusLabel: Record<string, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
};
const returnStatusBadge: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function DistributionManagement({
  currentUserId,
}: DistributionManagementProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [distRes, returnRes] = await Promise.all([
      getAllDistributions(),
      getAllReturns(),
    ]);
    if (distRes.error) setError("Gagal memuat data distribusi.");
    else setDistributions(distRes.data ?? []);
    if (returnRes.data) setReturns(returnRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUpdateStatus = async (
    id: string,
    status: "pending" | "sent" | "received",
  ) => {
    setUpdatingId(id);
    const { error } = await updateDistributionStatus(id, status);
    if (error) alert("Gagal mengubah status: " + (error as any).message);
    else
      setDistributions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d)),
      );
    setUpdatingId(null);
  };

  const handleReviewReturn = async (
    returnId: string,
    decision: "approved" | "rejected",
  ) => {
    setReviewingId(returnId);
    setRejectDialog(null);
    const { error } = await reviewReturn(returnId, decision, currentUserId);
    if (error) alert("Gagal memproses return: " + (error as any).message);
    else
      setReturns((prev) =>
        prev.map((r) => (r.id === returnId ? { ...r, status: decision } : r)),
      );
    setReviewingId(null);
  };

  const distByStatus = (s: "pending" | "sent" | "received") =>
    distributions.filter((d) => d.status === s);

  const showPending = filterStatus === "all" || filterStatus === "pending";
  const showSent = filterStatus === "all" || filterStatus === "sent";
  const showReceived = filterStatus === "all" || filterStatus === "received";
  const showReturn = filterStatus === "all" || filterStatus === "return";

  const countByStatus = (s: string) =>
    distributions.filter((d) => d.status === s).length;
  const countByReturnStatus = (s: string) =>
    returns.filter((r) => r.status === s).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusIcon = (status: string) => {
    if (status === "received") return <CheckCircle className="w-4 h-4" />;
    if (status === "sent") return <Truck className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const renderDistCard = (dist: Distribution) => (
    <div
      key={dist.id}
      className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900">
                {dist.karyawan?.nama ?? "—"}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[dist.status]}`}
              >
                {getStatusIcon(dist.status)}
                {statusLabel[dist.status]}
              </span>
            </div>

            {dist.karyawan?.address && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{dist.karyawan.address}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(dist.distribution_details ?? []).map((detail) => (
                <div
                  key={detail.id}
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-gray-600">
                    {detail.products?.product_name ?? "—"}
                  </span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {detail.quantity} unit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-3 justify-end">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(dist.distribution_date)}</span>
          </div>

          {updatingId === dist.id ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 justify-end">
              <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
            </div>
          ) : (
            <div className="flex gap-2 justify-end flex-wrap">
              {dist.status === "pending" && (
                <button
                  onClick={() => handleUpdateStatus(dist.id, "sent")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Tandai Dikirim
                </button>
              )}
              {dist.status === "sent" && (
                <button
                  onClick={() => handleUpdateStatus(dist.id, "received")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi Diterima
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReturnCard = (ret: ReturnRow) => (
    <div
      key={ret.id}
      className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900">
                {ret.karyawan?.nama ?? "—"}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${returnStatusBadge[ret.status]}`}
              >
                {ret.status === "pending" && <Hourglass className="w-3 h-3" />}
                {ret.status === "approved" && (
                  <CheckCircle className="w-3 h-3" />
                )}
                {ret.status === "rejected" && <X className="w-3 h-3" />}
                {returnStatusLabel[ret.status]}
              </span>
            </div>

            {ret.reason && (
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-gray-600">Alasan:</span>{" "}
                {ret.reason}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(ret.return_details ?? []).map((detail) => (
                <div
                  key={detail.id}
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-gray-600">
                    {detail.products?.product_name ?? "—"}
                  </span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {detail.quantity} unit
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-3 justify-end">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(ret.created_at)}</span>
          </div>

          {reviewingId === ret.id ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 justify-end">
              <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
            </div>
          ) : ret.status === "pending" ? (
            <div className="flex gap-2 justify-end flex-wrap">
              <button
                onClick={() => setRejectDialog(ret.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Tolak
              </button>
              <button
                onClick={() => handleReviewReturn(ret.id, "approved")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Setujui
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Distribusi ke Karyawan
          </h1>
          <p className="text-gray-600">
            Kelola pengiriman barang dari pabrik ke karyawan
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        {[
          {
            key: "all" as FilterStatus,
            label: "Total",
            value: distributions.length,
            icon: <Package className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            key: "pending" as FilterStatus,
            label: "Pending",
            value: countByStatus("pending"),
            icon: <Clock className="w-6 h-6 text-orange-600" />,
            bg: "bg-orange-100",
          },
          {
            key: "sent" as FilterStatus,
            label: "Dikirim",
            value: countByStatus("sent"),
            icon: <Truck className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            key: "received" as FilterStatus,
            label: "Diterima",
            value: countByStatus("received"),
            icon: <CheckCircle className="w-6 h-6 text-green-600" />,
            bg: "bg-green-100",
          },
          {
            key: "return" as FilterStatus,
            label: "Return",
            value: returns.length,
            icon: <RotateCcw className="w-6 h-6 text-red-600" />,
            bg: "bg-red-100",
          },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => setFilterStatus(card.key)}
            className={`bg-white rounded-xl border p-6 text-left transition-all cursor-pointer ${
              filterStatus === card.key
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center mb-4`}
            >
              {card.icon}
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "—" : card.value}
            </p>
            {card.label === "Return" && countByReturnStatus("pending") > 0 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                ● {countByReturnStatus("pending")} perlu ditinjau
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Dikirim</option>
              <option value="received">Diterima</option>
              <option value="return">Return</option>
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Distribusi Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {showPending && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Pending
                  <span className="text-sm text-gray-400 font-normal">
                    ({distByStatus("pending").length})
                  </span>
                </h3>
              </div>
              <div className="p-6">
                {distByStatus("pending").length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Tidak ada distribusi pending
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {distByStatus("pending").map(renderDistCard)}
                  </div>
                )}
              </div>
            </div>
          )}

          {showSent && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Dikirim
                  <span className="text-sm text-gray-400 font-normal">
                    ({distByStatus("sent").length})
                  </span>
                </h3>
              </div>
              <div className="p-6">
                {distByStatus("sent").length === 0 ? (
                  <div className="py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Tidak ada distribusi yang sedang dikirim
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {distByStatus("sent").map(renderDistCard)}
                  </div>
                )}
              </div>
            </div>
          )}

          {showReceived && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Diterima
                  <span className="text-sm text-gray-400 font-normal">
                    ({distByStatus("received").length})
                  </span>
                </h3>
              </div>
              <div className="p-6">
                {distByStatus("received").length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Belum ada distribusi yang diterima
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {distByStatus("received").map(renderDistCard)}
                  </div>
                )}
              </div>
            </div>
          )}

          {showReturn && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  Return
                  <span className="text-sm text-gray-400 font-normal">
                    ({returns.length})
                  </span>
                  {countByReturnStatus("pending") > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {countByReturnStatus("pending")} perlu ditinjau
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-6">
                {returns.length === 0 ? (
                  <div className="py-12 text-center">
                    <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada pengajuan return</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returns.map(renderReturnCard)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <DistributionModal
          currentUserId={currentUserId}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => {
            setIsModalOpen(false);
            fetchAll();
          }}
        />
      )}

      {rejectDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Tolak Pengajuan Return?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Stok karyawan tidak akan berubah. Pastikan keputusan ini sudah
              tepat.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectDialog(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleReviewReturn(rejectDialog, "rejected")}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
