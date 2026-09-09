import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  Power,
} from "lucide-react";
import {
  getAllKaryawan,
  deleteKaryawan,
  updateKaryawan,
  Karyawan,
} from "../../../services/karyawanService";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { KaryawanCard } from "../distributor-karyawan/KaryawanCard";
import { KaryawanModal } from "./KaryawanModal";
import { KaryawanDeleteModal } from "../distributor-karyawan/KaryawanDeleteModal";

type FilterType = "all" | "active" | "inactive";

export function KaryawanManagement() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [editingKaryawan, setEditingKaryawan] = useState<Karyawan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Karyawan | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchKaryawan = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllKaryawan();
    if (error) setError("Gagal memuat data karyawan. Coba refresh halaman.");
    else setKaryawanList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKaryawan();

    const channel = supabaseAdmin
      .channel("karyawan-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "karyawan" },
        () => fetchKaryawan(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "karyawan_roles" },
        () => fetchKaryawan(),
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [fetchKaryawan]);

  const openCreateModal = () => {
    setEditingKaryawan(null);
    setShowModal(true);
  };

  const openEditModal = (k: Karyawan) => {
    setEditingKaryawan(k);
    setShowModal(true);
  };

  const handleSaveSuccess = () => {
    setShowModal(false);
    fetchKaryawan();
  };

  const handleDelete = async (k: Karyawan) => {
    setActionLoading(k.id);
    setConfirmDelete(null);
    const { error } = await deleteKaryawan(k.id, k.nama);
    if (error) alert("Gagal menghapus karyawan: " + (error as any).message);
    else setKaryawanList((prev) => prev.filter((d) => d.id !== k.id));
    setActionLoading(null);
  };

  const toggleActive = async (k: Karyawan) => {
    setActionLoading(k.id);
    const { error } = await updateKaryawan(
      k.id,
      { is_active: !k.is_active },
      { oldName: k.nama },
    );
    if (error)
      alert("Gagal mengubah status karyawan: " + (error as any).message);
    else fetchKaryawan();
    setActionLoading(null);
  };

  const filtered = karyawanList.filter((k) => {
    const matchSearch =
      k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.phone || "").includes(searchQuery);
    const matchFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? k.is_active
          : !k.is_active;
    return matchSearch && matchFilter;
  });

  const totalAll = karyawanList.length;
  const totalActive = karyawanList.filter((k) => k.is_active).length;
  const totalInactive = karyawanList.filter((k) => !k.is_active).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Karyawan
          </h1>
          <p className="text-gray-600">
            Kelola data karyawan — produksi, handling, jual/antar, QC, admin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchKaryawan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 clay-blue clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            key: "all",
            label: "Total Karyawan",
            value: totalAll,
            color: "blue",
            Icon: Users,
          },
          {
            key: "active",
            label: "Aktif",
            value: totalActive,
            color: "green",
            Icon: Power,
          },
          {
            key: "inactive",
            label: "Nonaktif",
            value: totalInactive,
            color: "gray",
            Icon: Power,
          },
        ].map(({ key, label, value, color, Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`clay-raised clay-pressable rounded-lg p-6 text-left transition-all cursor-pointer ${
              filter === key
                ? `border-${color}-500 ring-2 ring-${color}-100`
                : "clay-raised-sm border-0"
            }`}
          >
            <div
              className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}
            >
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </button>
        ))}
      </div>

      <div className="clay-raised rounded-lg">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <span className="text-sm text-gray-500">
            {filtered.length} karyawan ditemukan
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data karyawan...</p>
          </div>
        ) : (
          !error && (
            <div className="p-6 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada data karyawan</p>
                </div>
              ) : (
                filtered.map((k) => (
                  <KaryawanCard
                    key={k.id}
                    karyawan={k}
                    actionLoading={actionLoading === k.id}
                    onToggleActive={() => toggleActive(k)}
                    onEdit={() => openEditModal(k)}
                    onDelete={() => setConfirmDelete(k)}
                  />
                ))
              )}
            </div>
          )
        )}
      </div>

      {showModal && (
        <KaryawanModal
          karyawan={editingKaryawan}
          onClose={() => setShowModal(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {confirmDelete && (
        <KaryawanDeleteModal
          karyawan={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
