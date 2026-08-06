import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Boxes,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { MaterialModal } from "./MaterialModal";
import { MaterialTransactionModal } from "./MaterialTransactionModal";
import {
  Material,
  MaterialMovement,
  getMaterials,
  getMaterialMovements,
  toggleMaterialStatus,
  deleteMaterial,
  MATERIAL_MINIMUM_STOCK,
} from "../../../services/materialService";

export function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "movement">(
    "overview",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"masuk" | "awal" | "keluar">("masuk");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [matRes, movRes] = await Promise.all([
      getMaterials(),
      getMaterialMovements(50),
    ]);

    if (matRes.error) {
      setError("Gagal memuat data bahan.");
    } else {
      setMaterials(matRes.data || []);
    }

    if (!movRes.error) {
      setMovements(movRes.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchAll();
  };

  const handleAddTransaction = (type: "masuk" | "awal" | "keluar") => {
    setTxType(type);
    setIsTxModalOpen(true);
  };

  const handleTxSuccess = () => {
    setIsTxModalOpen(false);
    fetchAll();
  };

  const handleToggleStatus = async (material: Material) => {
    setActionLoading(material.id);
    const { error } = await toggleMaterialStatus(
      material.id,
      !material.is_active,
    );
    if (error) {
      alert("Gagal mengubah status: " + error.message);
    } else {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === material.id ? { ...m, is_active: !material.is_active } : m,
        ),
      );
    }
    setActionLoading(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    setConfirmDelete(null);
    const { error } = await deleteMaterial(
      confirmDelete.id,
      confirmDelete.name,
    );
    if (error) {
      alert("Gagal menghapus bahan: " + error.message);
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== confirmDelete.id));
    }
    setActionLoading(null);
  };

  const lowStockItems = materials.filter(
    (m) => m.is_active && m.stock_quantity < MATERIAL_MINIMUM_STOCK,
  );
  const totalMaterials = materials.length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Bahan
          </h1>
          <p className="text-gray-600">
            Kelola bahan baku produksi (preform, tutup, sedotan, dll)
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

      {!loading && lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">
              Peringatan Stok Bahan Menipis
            </h3>
            <p className="text-sm text-orange-700">
              {lowStockItems.length} bahan memiliki stok di bawah{" "}
              {MATERIAL_MINIMUM_STOCK} unit.
            </p>
            <ul className="mt-1 text-xs text-orange-600 list-disc list-inside">
              {lowStockItems.map((m) => (
                <li key={m.id}>
                  {m.nama_bahan} — stok: {m.stock_quantity} {m.satuan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Jenis Bahan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${totalMaterials} Bahan`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Bahan Stok Kritis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${lowStockItems.length} Bahan`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Daftar Bahan
            </button>
            <button
              onClick={() => setActiveTab("movement")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "movement"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddMaterial}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Bahan
            </button>
            <button
              onClick={() => handleAddTransaction("awal")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Stok Awal
            </button>
            <button
              onClick={() => handleAddTransaction("masuk")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Stok Masuk
            </button>
            <button
              onClick={() => handleAddTransaction("keluar")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              Stok Keluar
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data bahan...</p>
            </div>
          ) : activeTab === "overview" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      "Nama Bahan",
                      "Satuan",
                      "Stok",
                      "Status",
                      "Kondisi",
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
                  {materials.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Belum ada data bahan
                      </td>
                    </tr>
                  ) : (
                    materials.map((m) => {
                      const isLow = m.stock_quantity < MATERIAL_MINIMUM_STOCK;
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {m.nama_bahan}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {m.satuan}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            {m.stock_quantity}
                          </td>
                          <td className="py-3 px-4">
                            {actionLoading === m.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(m)}
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                  m.is_active
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {m.is_active ? "Aktif" : "Nonaktif"}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                <AlertTriangle className="w-3 h-3" />
                                Menipis
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditMaterial(m)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDelete({
                                    id: m.id,
                                    name: m.nama_bahan,
                                  })
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-sm">
                  Belum ada riwayat pergerakan bahan
                </p>
              ) : (
                movements.map((mov) => {
                  const isIn =
                    mov.movement_type === "masuk" ||
                    mov.movement_type === "awal";
                  return (
                    <div
                      key={mov.id}
                      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isIn ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {isIn ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-0.5">
                              {mov.materials?.nama_bahan ?? "—"}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                              <span>Bahan Baku</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>
                                {mov.movement_type === "awal"
                                  ? "Stok Awal"
                                  : isIn
                                    ? "Stok Masuk"
                                    : "Stok Keluar"}
                              </span>
                            </div>
                            {mov.note && (
                              <p className="text-xs text-gray-500 mt-1">
                                {mov.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p
                            className={`text-lg font-bold ${
                              isIn ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIn ? "+" : "-"}
                            {mov.quantity} {mov.materials?.satuan ?? ""}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(mov.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <MaterialModal
          material={editingMaterial}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {isTxModalOpen && (
        <MaterialTransactionModal
          type={txType}
          onClose={() => setIsTxModalOpen(false)}
          onSaveSuccess={handleTxSuccess}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Bahan?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">{confirmDelete.name}</span>
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              Bahan yang sudah dihapus tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium cursor-pointer"
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
