import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  HardHat,
  Boxes,
  Users,
} from "lucide-react";
import { HandlingFeeModal } from "./HandlingFeeModal";
import {
  HandlingFeeRecord,
  getHandlingFeeRecords,
  deleteHandlingFee,
} from "../../services/handlingFeeService";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function HandlingFeeManagement() {
  const [records, setRecords] = useState<HandlingFeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HandlingFeeRecord | null>(
    null,
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getHandlingFeeRecords();
    if (error) setError("Gagal memuat data handling fee.");
    setRecords(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchAll();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);

    const { error } = await deleteHandlingFee(target.id);
    if (error) {
      alert("Gagal menghapus data: " + (error as any).message);
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== target.id));
    }
    setActionLoading(null);
  };

  const totalFee = records.reduce((s, r) => s + Number(r.total_fee), 0);
  const totalDus = records.reduce((s, r) => s + Number(r.jumlah_dus), 0);
  const totalKegiatan = records.length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Handling Fee
          </h1>
          <p className="text-gray-600">
            Catat fee handling per batch dus, bisa dikerjakan lebih dari 1
            karyawan sekaligus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 clay-amber clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Handling Fee
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <HardHat className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Fee Handling</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalFee)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dus Dihandle</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalDus.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Jumlah Kegiatan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalKegiatan.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-lg overflow-hidden">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Riwayat Handling Fee
          </h2>
        </div>
        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]">
                  {[
                    "Tanggal",
                    "Jumlah Dus",
                    "Rate/Dus",
                    "Total Fee",
                    "Karyawan",
                    "Keterangan",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-gray-500 text-sm"
                    >
                      Belum ada data handling fee
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(r.tanggal)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {r.jumlah_dus.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatRp(Number(r.rate_per_dus))}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-orange-600">
                        {formatRp(Number(r.total_fee))}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {r.handling_fee_workers.map((w) => (
                            <span
                              key={w.id}
                              title={`Rp ${Number(w.fee_per_orang).toLocaleString("id-ID")}`}
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
                            >
                              {w.karyawan?.nama ?? "—"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                        {r.keterangan || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {actionLoading === r.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(r)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <HandlingFeeModal
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Data Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {formatDate(confirmDelete.tanggal)} — {confirmDelete.jumlah_dus}{" "}
                dus
              </span>
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              Data yang sudah dihapus tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 clay-red clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer"
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
