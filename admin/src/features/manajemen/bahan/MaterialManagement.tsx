import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { MaterialModal } from "./MaterialModal";
import {
  MaterialTransactionModal,
  MaterialTxType,
} from "./MaterialTransactionModal";
import { StokGudangTab } from "./StokGudangTab";
import { StokSementaraTab } from "../bahan/StokSementaraTab";
import { TabProps } from "../bahan/materialShared";
import {
  Material,
  MaterialMovement,
  getMaterials,
  getMaterialMovements,
  toggleMaterialStatus,
  deleteMaterial,
} from "../../../services/materialService";

export function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"gudang" | "sementara">("gudang");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<MaterialTxType>("masuk");
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
      getMaterialMovements(100),
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

  const handleAddTransaction = (type: MaterialTxType) => {
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
      if ((error as any).code === "HAS_MOVEMENTS") {
        const nonaktifkan = window.confirm(
          error.message + "\n\nNonaktifkan bahan ini sekarang?",
        );
        if (nonaktifkan) {
          const { error: toggleErr } = await toggleMaterialStatus(
            confirmDelete.id,
            false,
          );
          if (toggleErr) {
            alert("Gagal menonaktifkan bahan: " + toggleErr.message);
          } else {
            setMaterials((prev) =>
              prev.map((m) =>
                m.id === confirmDelete.id ? { ...m, is_active: false } : m,
              ),
            );
          }
        }
      } else {
        alert("Gagal menghapus bahan: " + error.message);
      }
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== confirmDelete.id));
    }
    setActionLoading(null);
  };

  const tabProps: TabProps = {
    materials,
    movements,
    loading,
    error,
    actionLoading,
    onAddMaterial: handleAddMaterial,
    onEditMaterial: handleEditMaterial,
    onDeleteMaterial: (m) => setConfirmDelete({ id: m.id, name: m.nama_bahan }),
    onToggleStatus: handleToggleStatus,
    onAddTransaction: handleAddTransaction,
  };

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
          className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {[
          { id: "gudang", label: "Stok Gudang" },
          { id: "sementara", label: "Stok Sementara" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "gudang" | "sementara")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "gudang" ? (
        <StokGudangTab {...tabProps} />
      ) : (
        <StokSementaraTab {...tabProps} />
      )}

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
              Bahan yang sudah dihapus tidak bisa dikembalikan. Kalau bahan ini
              sudah pernah dipakai (ada riwayat stok masuk/keluar), sistem akan
              menawarkan nonaktifkan sebagai gantinya.
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
