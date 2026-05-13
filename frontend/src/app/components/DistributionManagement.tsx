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
} from "lucide-react";
import { DistributionModal } from "./DistributionModal";
import {
  getAllDistributions,
  updateDistributionStatus,
  Distribution,
} from "../../services/distributionService";

type FilterStatus = "all" | "pending" | "sent" | "received";

interface DistributionManagementProps {
  currentUserId: string; // dari App.tsx (currentUser.id)
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

export function DistributionManagement({
  currentUserId,
}: DistributionManagementProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDistributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllDistributions();
    if (error) setError("Gagal memuat data distribusi.");
    else setDistributions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

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

  const filtered = distributions.filter(
    (d) => filterStatus === "all" || d.status === filterStatus,
  );

  const countByStatus = (s: string) =>
    distributions.filter((d) => d.status === s).length;

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Distribusi ke Distributor
          </h1>
          <p className="text-gray-600">
            Kelola pengiriman barang dari pabrik ke distributor
          </p>
        </div>
        <button
          onClick={fetchDistributions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "Total",
            value: distributions.length,
            icon: <Package className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            label: "Pending",
            value: countByStatus("pending"),
            icon: <Clock className="w-6 h-6 text-orange-600" />,
            bg: "bg-orange-100",
          },
          {
            label: "Dikirim",
            value: countByStatus("sent"),
            icon: <Truck className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            label: "Diterima",
            value: countByStatus("received"),
            icon: <CheckCircle className="w-6 h-6 text-green-600" />,
            bg: "bg-green-100",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6"
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
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Riwayat Distribusi
            </h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Dikirim</option>
              <option value="received">Diterima</option>
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

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Memuat data distribusi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada data distribusi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((dist) => (
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
                        {/* Nama distributor + status */}
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {dist.distributors?.distributor_name ?? "—"}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[dist.status]}`}
                          >
                            {getStatusIcon(dist.status)}
                            {statusLabel[dist.status]}
                          </span>
                        </div>

                        {/* Alamat */}
                        {dist.distributors?.address && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{dist.distributors.address}</span>
                          </div>
                        )}

                        {/* Produk yang dikirim */}
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

                    {/* Tanggal + aksi status */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-3 justify-end">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(dist.distribution_date)}</span>
                      </div>

                      {/* Tombol ubah status */}
                      {updatingId === dist.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 justify-end">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memproses...
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end flex-wrap">
                          {dist.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(dist.id, "sent")
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Tandai Dikirim
                            </button>
                          )}
                          {dist.status === "sent" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(dist.id, "received")
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Konfirmasi Diterima
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <DistributionModal
          currentUserId={currentUserId}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => {
            setIsModalOpen(false);
            fetchDistributions();
          }}
        />
      )}
    </div>
  );
}
