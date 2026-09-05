import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Factory,
  PackageOpen,
  Ban,
  ClipboardCheck,
} from "lucide-react";
import {
  MovementList,
  SEMENTARA_MOVEMENT_TYPES,
  TabProps,
  getMaterialStockStatus,
  MaterialStockStatusBadge,
  MaterialCriticalStockBanner,
} from "../bahan/materialShared";
import { MATERIAL_MINIMUM_STOCK } from "../../../services/materialService";

export function StokSementaraTab({
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

  const materialsWithSementara = materials.filter(
    (m) => Number(m.stock_sementara) > 0,
  );
  const totalStokSementara = materials.reduce(
    (s, m) => s + Number(m.stock_sementara),
    0,
  );
  const kritisSementaraItems = materials.filter(
    (m) => m.is_active && Number(m.stock_sementara) < MATERIAL_MINIMUM_STOCK,
  );
  const sementaraMovements = movements.filter((m) =>
    SEMENTARA_MOVEMENT_TYPES.includes(m.movement_type),
  );

  return (
    <div>
      {!loading && (
        <MaterialCriticalStockBanner
          title="Peringatan Stok Sementara Kritis"
          materials={materials}
          getQty={(m) => Number(m.stock_sementara)}
          satuanLabel={(m) => m.satuan}
        />
      )}

      <div className="clay-inset-amber border-0 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">
            Sisa Stok Sementara Tidak Dikembalikan ke Gudang
          </h3>
          <p className="text-sm text-amber-700">
            Bahan yang sudah dipindah ke Stok Sementara dianggap satu paket siap
            pakai untuk sekali produksi. Jika ada sisa, biarkan saja di Stok
            Sementara (tidak dikembalikan ke Stok Gudang) demi menjaga keamanan,
            kebersihan, dan sterilitas bahan. Kalau ada bahan yang memang selalu
            ditempatkan langsung di area produksi (tidak pernah lewat Gudang),
            tambahkan lewat "Tambah Bahan" di bawah lalu isi saldo awalnya lewat
            "Stok Awal". Setelah produksi selesai, hitung sisa fisiknya lalu
            catat lewat tombol "Sisa Bahan" — sistem otomatis menghitung &
            mencatat Pemakaian Produksi dari selisihnya, tidak perlu dihitung
            manual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Factory className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Stok Sementara</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStokSementara.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
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
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Bahan Stok Kritis</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${kritisSementaraItems.length} Bahan`}
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
              onClick={() => onAddTransaction("stok_awal_sementara")}
              className="clay-amber clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Stok Awal
            </button>
            <button
              onClick={() => onAddTransaction("produksi")}
              className="clay-purple clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Factory className="w-4 h-4" />
              Pemakaian Produksi
            </button>
            <button
              onClick={() => onAddTransaction("reject")}
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              Bahan Rusak / Reject
            </button>
            <button
              onClick={() => onAddTransaction("sisa_produksi")}
              className="clay-lime clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              Sisa Bahan
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
                      "Stok Sementara",
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
                      const stockStatus = getMaterialStockStatus(
                        Number(m.stock_sementara),
                      );
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
                          <td className="py-3 px-4 text-sm font-semibold text-purple-700">
                            {m.stock_sementara}
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
                            <MaterialStockStatusBadge status={stockStatus} />
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
              movements={sementaraMovements}
              emptyText="Belum ada riwayat pergerakan stok sementara"
            />
          )}
        </div>
      </div>
    </div>
  );
}
