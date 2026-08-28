import { useState } from "react";
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
  ClipboardList,
  Warehouse,
} from "lucide-react";
import { MATERIAL_MINIMUM_STOCK } from "../../../services/materialService";
import {
  MovementList,
  GUDANG_MOVEMENT_TYPES,
  TabProps,
} from "../bahan/materialShared";

export function StokGudangTab({
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
        <div className="clay-inset-amber border-0 rounded-xl p-4 mb-6 flex items-start gap-3">
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
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Jenis Bahan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${materials.length} Bahan`}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
            <Warehouse className="w-6 h-6 text-cyan-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Gudang</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStokGudang.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Bahan Stok Kritis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${lowStockItems.length} Bahan`}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-lg">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab("daftar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "daftar"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Daftar Bahan
            </button>
            <button
              onClick={() => setSubTab("riwayat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subTab === "riwayat"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onAddMaterial}
              className="clay-blue clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
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
              className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Stok Masuk
            </button>
            <button
              onClick={() => onAddTransaction("ke_sementara")}
              className="clay-blue clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ArrowRightCircle className="w-4 h-4" />
              Pindah ke Sementara
            </button>
            <button
              onClick={() => onAddTransaction("keluar")}
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              Stok Keluar
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
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
                  <tr className="border-b border-[rgba(140,172,214,0.35)]">
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
                          className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
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
                                    : "bg-[rgba(215,233,255,0.55)] text-gray-700 hover:bg-gray-200"
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
