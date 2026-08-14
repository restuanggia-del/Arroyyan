import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { FeeRekapanModal } from "./FeeRekapanModal";
import {
  FeeRekapan,
  getFeeRekapan,
  deleteFeeRekapan,
} from "../../services/feeRekapanService";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const currentPeriode = () => new Date().toISOString().slice(0, 7);

export function FeeRekapanManagement() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [entries, setEntries] = useState<FeeRekapan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FeeRekapan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeeRekapan | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getFeeRekapan(p);
    if (error) setError("Gagal memuat data fee rekapan.");
    setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(periode);
  }, [periode, fetchAll]);

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    fetchAll(periode);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);

    const { error } = await deleteFeeRekapan(target.id);
    if (error) {
      alert("Gagal menghapus data: " + (error as any).message);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== target.id));
    }
    setActionLoading(null);
  };

  const total = entries.reduce((s, e) => s + Number(e.jumlah), 0);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Fee Rekapan</h1>
          <p className="text-gray-600">
            Input manual fee rekapan penjualan per karyawan per bulan (nilai
            variatif, tidak tetap)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 clay-purple clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Fee Rekapan
        </button>
      </div>

      <div className="clay-raised rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Periode
            </label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-800">
              Total periode ini:{" "}
              <span className="font-semibold">{formatRp(total)}</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="clay-raised rounded-lg overflow-hidden">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Fee Rekapan — Periode {periode}
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
                  {["Karyawan", "Jumlah", "Keterangan", "Aksi"].map((h) => (
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
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-gray-500 text-sm"
                    >
                      Belum ada fee rekapan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {entry.karyawan?.nama ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-indigo-600">
                        {formatRp(Number(entry.jumlah))}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.keterangan || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {actionLoading === entry.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingEntry(entry);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(entry)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
        <FeeRekapanModal
          entry={editingEntry}
          defaultPeriode={periode}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
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
              Hapus Fee Rekapan Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {confirmDelete.karyawan?.nama ?? ""}
              </span>{" "}
              — {formatRp(Number(confirmDelete.jumlah))}
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
