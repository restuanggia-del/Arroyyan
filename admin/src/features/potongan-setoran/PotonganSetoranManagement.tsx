import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  MinusCircle,
  Wallet,
  PiggyBank,
  Info,
} from "lucide-react";
import { PotonganModal } from "./PotonganModal";
import { SetoranModal } from "./SetoranModal";
import {
  Potongan,
  SetoranOwner,
  SisaDanaKaryawan,
  getPotonganList,
  getSetoranList,
  getSisaDanaPenjualan,
  deletePotongan,
  deleteSetoran,
  KATEGORI_POTONGAN_LABEL,
} from "../../services/potonganSetoranService";

interface PotonganSetoranManagementProps {
  currentUserId: string;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function PotonganSetoranManagement({
  currentUserId,
}: PotonganSetoranManagementProps) {
  const [activeTab, setActiveTab] = useState<"potongan" | "setoran">(
    "potongan",
  );

  const [potonganList, setPotonganList] = useState<Potongan[]>([]);
  const [setoranList, setSetoranList] = useState<SetoranOwner[]>([]);
  const [sisaDana, setSisaDana] = useState<SisaDanaKaryawan[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPotonganModalOpen, setIsPotonganModalOpen] = useState(false);
  const [isSetoranModalOpen, setIsSetoranModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    type: "potongan" | "setoran";
    label: string;
  } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [potonganRes, setoranRes, sisaRes] = await Promise.all([
      getPotonganList(),
      getSetoranList(),
      getSisaDanaPenjualan(),
    ]);

    if (potonganRes.error || setoranRes.error || sisaRes.error) {
      setError("Gagal memuat sebagian data potongan & setoran.");
    }

    setPotonganList(potonganRes.data || []);
    setSetoranList(setoranRes.data || []);
    setSisaDana(sisaRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveSuccess = (type: "potongan" | "setoran") => {
    if (type === "potongan") setIsPotonganModalOpen(false);
    else setIsSetoranModalOpen(false);
    fetchAll();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);

    const { error } =
      target.type === "potongan"
        ? await deletePotongan(target.id)
        : await deleteSetoran(target.id);

    if (error) {
      alert("Gagal menghapus data: " + (error as any).message);
    } else {
      if (target.type === "potongan") {
        setPotonganList((prev) => prev.filter((p) => p.id !== target.id));
      } else {
        setSetoranList((prev) => prev.filter((s) => s.id !== target.id));
      }
      const sisaRes = await getSisaDanaPenjualan();
      setSisaDana(sisaRes.data || []);
    }
    setActionLoading(null);
  };

  const totalPotongan = potonganList.reduce((s, p) => s + Number(p.jumlah), 0);
  const totalSetoran = setoranList.reduce((s, st) => s + Number(st.jumlah), 0);
  const totalSisaDana = sisaDana.reduce((s, k) => s + k.sisa_dana, 0);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Potongan & Setoran ke Owner
          </h1>
          <p className="text-gray-600">
            Catat potongan (BBM/uang makan/lain-lain) dan setoran kas dari
            karyawan ke owner
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

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <MinusCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Potongan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalPotongan)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Setoran ke Owner</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalSetoran)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <PiggyBank className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Sisa Dana Penjualan (Semua Karyawan)
          </h3>
          <p
            className={`text-2xl font-bold ${
              totalSisaDana < 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {loading ? "—" : formatRp(totalSisaDana)}
          </p>
        </div>
      </div>

      {/* Sisa Dana per Karyawan */}
      <div className="clay-raised rounded-lg mb-8">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Sisa Dana Penjualan per Karyawan
          </h2>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="hidden group-hover:block absolute right-0 top-6 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 z-10">
              Dihitung otomatis dari: uang cash yang diterima karyawan (dari
              transaksi tunai & pembayaran titipan) dikurangi potongan dan
              setoran yang sudah dicatat. Belum termasuk bagian yang sudah
              langsung diserahkan ke owner saat pembayaran titipan.
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Menghitung sisa dana...</p>
            </div>
          ) : sisaDana.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Belum ada data transaksi tunai/potongan/setoran
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(140,172,214,0.35)]">
                    {[
                      "Karyawan",
                      "Cash Masuk",
                      "Potongan",
                      "Setoran",
                      "Sisa Dana",
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
                  {sisaDana.map((k) => (
                    <tr
                      key={k.karyawan_id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {k.nama}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatRp(k.total_cash_masuk)}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600">
                        {formatRp(k.total_potongan)}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600">
                        {formatRp(k.total_setoran)}
                      </td>
                      <td
                        className={`py-3 px-4 text-sm font-bold ${
                          k.sisa_dana < 0 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {formatRp(k.sisa_dana)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat */}
      <div className="clay-raised rounded-lg">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("potongan")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "potongan"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Riwayat Potongan
            </button>
            <button
              onClick={() => setActiveTab("setoran")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "setoran"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
              }`}
            >
              Riwayat Setoran ke Owner
            </button>
          </div>
          <div className="flex gap-2">
            {activeTab === "potongan" ? (
              <button
                onClick={() => setIsPotonganModalOpen(true)}
                className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Potongan
              </button>
            ) : (
              <button
                onClick={() => setIsSetoranModalOpen(true)}
                className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Setoran
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data...</p>
            </div>
          ) : activeTab === "potongan" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(140,172,214,0.35)]">
                    {[
                      "Tanggal",
                      "Kategori",
                      "Karyawan",
                      "Jumlah",
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
                  {potonganList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Belum ada data potongan
                      </td>
                    </tr>
                  ) : (
                    potonganList.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(p.tanggal)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {KATEGORI_POTONGAN_LABEL[p.kategori]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {p.karyawan?.nama ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-red-600">
                          {formatRp(Number(p.jumlah))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                          {p.keterangan || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {actionLoading === p.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  id: p.id,
                                  type: "potongan",
                                  label: `${KATEGORI_POTONGAN_LABEL[p.kategori]} — ${p.karyawan?.nama ?? ""}`,
                                })
                              }
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(140,172,214,0.35)]">
                    {[
                      "Tanggal",
                      "Disetorkan Oleh",
                      "Diterima Oleh",
                      "Jumlah",
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
                  {setoranList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-500 text-sm"
                      >
                        Belum ada data setoran ke owner
                      </td>
                    </tr>
                  ) : (
                    setoranList.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(s.tanggal)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {s.karyawan_disetor?.nama ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {s.user_penerima?.name ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                          {formatRp(Number(s.jumlah))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                          {s.keterangan || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {actionLoading === s.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  id: s.id,
                                  type: "setoran",
                                  label: `Setoran ${s.karyawan_disetor?.nama ?? ""}`,
                                })
                              }
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
      </div>

      {isPotonganModalOpen && (
        <PotonganModal
          onClose={() => setIsPotonganModalOpen(false)}
          onSaveSuccess={() => handleSaveSuccess("potongan")}
        />
      )}

      {isSetoranModalOpen && (
        <SetoranModal
          currentUserId={currentUserId}
          onClose={() => setIsSetoranModalOpen(false)}
          onSaveSuccess={() => handleSaveSuccess("setoran")}
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
              <span className="font-medium">{confirmDelete.label}</span>
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
