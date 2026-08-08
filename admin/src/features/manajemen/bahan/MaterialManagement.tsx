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
  ArrowRightCircle,
  ArrowLeftCircle,
  Factory,
  ArrowRight,
  ClipboardList,
  Warehouse,
  PackageOpen,
} from "lucide-react";
import { MaterialModal } from "./MaterialModal";
import {
  MaterialTransactionModal,
  MaterialTxType,
} from "./MaterialTransactionModal";
import {
  Material,
  MaterialMovement,
  getMaterials,
  getMaterialMovements,
  toggleMaterialStatus,
  deleteMaterial,
  MATERIAL_MINIMUM_STOCK,
  MOVEMENT_TYPE_LABEL,
} from "../../../services/materialService";

const formatDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MOVEMENT_VISUAL: Record<
  MaterialMovement["movement_type"],
  { icon: React.ReactNode; bg: string; text: string; sign: "+" | "-" | "" }
> = {
  masuk: {
    icon: <TrendingUp className="w-5 h-5" />,
    bg: "bg-green-100",
    text: "text-green-600",
    sign: "+",
  },
  stok_awal: {
    icon: <ClipboardList className="w-5 h-5" />,
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    sign: "+",
  },
  keluar: {
    icon: <TrendingDown className="w-5 h-5" />,
    bg: "bg-red-100",
    text: "text-red-600",
    sign: "-",
  },
  ke_sementara: {
    icon: <ArrowRightCircle className="w-5 h-5" />,
    bg: "bg-blue-100",
    text: "text-blue-600",
    sign: "",
  },
  kembali_gudang: {
    icon: <ArrowLeftCircle className="w-5 h-5" />,
    bg: "bg-amber-100",
    text: "text-amber-600",
    sign: "",
  },
  produksi: {
    icon: <Factory className="w-5 h-5" />,
    bg: "bg-purple-100",
    text: "text-purple-600",
    sign: "-",
  },
};

// Pergerakan yang mempengaruhi Stok Gudang
const GUDANG_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "masuk",
  "stok_awal",
  "keluar",
  "ke_sementara",
  "kembali_gudang",
];

// Pergerakan yang mempengaruhi Stok Sementara
const SEMENTARA_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "ke_sementara",
  "kembali_gudang",
  "produksi",
];

function MovementList({
  movements,
  emptyText,
}: {
  movements: MaterialMovement[];
  emptyText: string;
}) {
  if (movements.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">{emptyText}</p>
    );
  }
  return (
    <div className="space-y-3">
      {movements.map((mov) => {
        const visual = MOVEMENT_VISUAL[mov.movement_type];
        return (
          <div
            key={mov.id}
            className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${visual.bg} ${visual.text}`}
                >
                  {visual.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-0.5">
                    {mov.materials?.nama_bahan ?? "—"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                    <span>Bahan Baku</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{MOVEMENT_TYPE_LABEL[mov.movement_type]}</span>
                  </div>
                  {mov.note && (
                    <p className="text-xs text-gray-500 mt-1">{mov.note}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`text-lg font-bold ${visual.text}`}>
                  {visual.sign}
                  {mov.quantity} {mov.materials?.satuan ?? ""}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(mov.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TabProps {
  materials: Material[];
  movements: MaterialMovement[];
  loading: boolean;
  error: string | null;
  actionLoading: string | null;
  onAddMaterial: () => void;
  onEditMaterial: (m: Material) => void;
  onDeleteMaterial: (m: Material) => void;
  onToggleStatus: (m: Material) => void;
  onAddTransaction: (type: MaterialTxType) => void;
}

function StokGudangTab({
  materials,
  movements,
  loading,
  error,
  actionLoading,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onToggleStatus,
  onAddTransaction,
}: TabProps) {
  const [subTab, setSubTab] = useState<"daftar" | "riwayat">("daftar");

  const lowStockItems = materials.filter(
    (m) => m.is_active && m.stock_quantity < MATERIAL_MINIMUM_STOCK,
  );
  const totalStokGudang = materials.reduce(
    (s, m) => s + Number(m.stock_quantity),
    0,
  );
  const gudangMovements = movements.filter((m) =>
    GUDANG_MOVEMENT_TYPES.includes(m.movement_type),
  );

  return (
    <div>
      {!loading && lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">
              Peringatan Stok Gudang Menipis
            </h3>
            <p className="text-sm text-orange-700">
              {lowStockItems.length} bahan memiliki stok gudang di bawah{" "}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Jenis Bahan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${materials.length} Bahan`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
            <Warehouse className="w-6 h-6 text-cyan-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Gudang</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStokGudang.toLocaleString("id-ID")}
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
              onClick={() => setSubTab("daftar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "daftar"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Daftar Bahan
            </button>
            <button
              onClick={() => setSubTab("riwayat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "riwayat"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onAddMaterial}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Bahan
            </button>
            <button
              onClick={() => onAddTransaction("stok_awal")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Stok Awal
            </button>
            <button
              onClick={() => onAddTransaction("masuk")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Stok Masuk
            </button>
            <button
              onClick={() => onAddTransaction("ke_sementara")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ArrowRightCircle className="w-4 h-4" />
              Pindah ke Sementara
            </button>
            <button
              onClick={() => onAddTransaction("keluar")}
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
          ) : subTab === "daftar" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {[
                      "Nama Bahan",
                      "Satuan",
                      "Stok Gudang",
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
                                onClick={() => onToggleStatus(m)}
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
                                onClick={() => onEditMaterial(m)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteMaterial(m)}
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
            <MovementList
              movements={gudangMovements}
              emptyText="Belum ada riwayat pergerakan stok gudang"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StokSementaraTab({
  materials,
  movements,
  loading,
  onAddTransaction,
}: TabProps) {
  const [subTab, setSubTab] = useState<"daftar" | "riwayat">("daftar");

  const materialsWithSementara = materials.filter(
    (m) => Number(m.stock_sementara) > 0,
  );
  const totalStokSementara = materials.reduce(
    (s, m) => s + Number(m.stock_sementara),
    0,
  );
  const sementaraMovements = movements.filter((m) =>
    SEMENTARA_MOVEMENT_TYPES.includes(m.movement_type),
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Factory className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Sementara</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStokSementara.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <PackageOpen className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Bahan di Area Sementara
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${materialsWithSementara.length} Bahan`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab("daftar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "daftar"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Daftar Bahan
            </button>
            <button
              onClick={() => setSubTab("riwayat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "riwayat"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onAddTransaction("kembali_gudang")}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ArrowLeftCircle className="w-4 h-4" />
              Kembali ke Gudang
            </button>
            <button
              onClick={() => onAddTransaction("produksi")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Factory className="w-4 h-4" />
              Pemakaian Produksi
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data bahan...</p>
            </div>
          ) : subTab === "daftar" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Nama Bahan", "Satuan", "Stok Sementara"].map((h) => (
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
                        colSpan={3}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Belum ada data bahan
                      </td>
                    </tr>
                  ) : (
                    materials.map((m) => (
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
                        <td className="py-3 px-4 text-sm font-semibold text-purple-700">
                          {m.stock_sementara}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <MovementList
              movements={sementaraMovements}
              emptyText="Belum ada riwayat pergerakan stok sementara"
            />
          )}
        </div>
      </div>
    </div>
  );
}

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
      alert("Gagal menghapus bahan: " + error.message);
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
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
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
