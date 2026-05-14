import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Phone,
  MapPin,
  Mail,
  RefreshCw,
  AlertCircle,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  getAllDistributors,
  approveDistributor,
  rejectDistributor,
  deleteDistributor,
  DistributorWithUser,
} from "../../services/distributorService";

type FilterType = "all" | "approved" | "pending";

export function DistributorManagement() {
  const [distributors, setDistributors] = useState<DistributorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchDistributors = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllDistributors();
    if (error) {
      setError("Gagal memuat data distributor. Coba refresh halaman.");
    } else {
      setDistributors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await approveDistributor(userId);
    if (error) {
      alert("Gagal menyetujui distributor: " + error.message);
    } else {
      setDistributors((prev) =>
        prev.map((d) =>
          d.users.id === userId
            ? { ...d, users: { ...d.users, is_approved: true } }
            : d,
        ),
      );
    }
    setActionLoading(null);
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await rejectDistributor(userId);
    if (error) {
      alert("Gagal menolak distributor: " + error.message);
    } else {
      setDistributors((prev) =>
        prev.map((d) =>
          d.users.id === userId
            ? { ...d, users: { ...d.users, is_approved: false } }
            : d,
        ),
      );
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    setConfirmDelete(null);
    const { error } = await deleteDistributor(userId);
    if (error) {
      alert("Gagal menghapus distributor: " + error.message);
    } else {
      setDistributors((prev) => prev.filter((d) => d.users.id !== userId));
    }
    setActionLoading(null);
  };

  const filtered = distributors.filter((d) => {
    const matchSearch =
      d.distributor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone || "").includes(searchQuery);

    const matchFilter =
      filter === "all"
        ? true
        : filter === "approved"
          ? d.users.is_approved
          : !d.users.is_approved;

    return matchSearch && matchFilter;
  });

  const totalAll = distributors.length;
  const totalApproved = distributors.filter((d) => d.users.is_approved).length;
  const totalPending = distributors.filter((d) => !d.users.is_approved).length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Distributor
          </h1>
          <p className="text-gray-600">
            Kelola akun distributor, setujui atau tolak pendaftaran baru
          </p>
        </div>
        <button
          onClick={fetchDistributors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`bg-white rounded-lg border p-6 text-left transition-all cursor-pointer ${
            filter === "all"
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Distributor</p>
          <p className="text-2xl font-bold text-gray-900">{totalAll}</p>
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`bg-white rounded-lg border p-6 text-left transition-all cursor-pointer ${
            filter === "approved"
              ? "border-green-500 ring-2 ring-green-100"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Disetujui</p>
          <p className="text-2xl font-bold text-gray-900">{totalApproved}</p>
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`bg-white rounded-lg border p-6 text-left transition-all cursor-pointer ${
            filter === "pending"
              ? "border-orange-500 ring-2 ring-orange-100"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Menunggu Persetujuan</p>
          <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          {totalPending > 0 && (
            <p className="text-xs text-orange-600 mt-1 font-medium">
              ● {totalPending} akun perlu ditinjau
            </p>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filtered.length} distributor ditemukan
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data distributor...</p>
          </div>
        )}

        {!loading && !error && (
          <div className="p-6 space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada data distributor</p>
              </div>
            ) : (
              filtered.map((dist) => (
                <div
                  key={dist.id}
                  className={`border rounded-xl p-5 transition-all ${
                    !dist.users.is_approved
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          dist.users.is_approved
                            ? "bg-blue-600 text-white"
                            : "bg-orange-400 text-white"
                        }`}
                      >
                        {dist.distributor_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {dist.distributor_name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              dist.users.is_approved
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {dist.users.is_approved ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Disetujui
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                Menunggu Persetujuan
                              </>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{dist.users.email}</span>
                          </div>
                          {dist.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{dist.phone}</span>
                            </div>
                          )}
                          {dist.address && (
                            <div className="flex items-center gap-1.5 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{dist.address}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Terdaftar: {formatDate(dist.users.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {actionLoading === dist.users.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memproses...
                        </div>
                      ) : (
                        <>
                          {!dist.users.is_approved ? (
                            <button
                              onClick={() => handleApprove(dist.users.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-4 h-4" />
                              Setujui
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReject(dist.users.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm rounded-lg transition-colors cursor-pointer"
                            >
                              <UserX className="w-4 h-4" />
                              Nonaktifkan
                            </button>
                          )}

                          <button
                            onClick={() => setConfirmDelete(dist.users.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Distributor?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Aksi ini tidak dapat dibatalkan. Semua data terkait distributor
              ini akan ikut terhapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
