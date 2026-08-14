import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Factory,
  Boxes,
  Users,
  Calculator,
  Save,
  TrendingUp,
} from "lucide-react";
import { InsentifProduksiModal } from "./InsentifProduksiModal";
import {
  InsentifProduksiRecord,
  IncentivePayment,
  KaryawanAmount,
  getInsentifProduksiRecords,
  deleteInsentifProduksi,
  calculateInsentifProduksiPerKaryawan,
  calculateFeePenjualanPerKaryawan,
  getIncentivePayments,
  savePayments,
  deletePayment,
  DEFAULT_RATE_FEE_PENJUALAN,
} from "../../services/insentifService";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const currentPeriode = () => new Date().toISOString().slice(0, 7);

type PreviewRow = KaryawanAmount & {
  jumlah_dibayar: number;
  total_dus_terjual?: number;
};

function RekapPembayaran({
  jenis,
  accentClass,
  onCalculate,
  extraControls,
}: {
  jenis: "insentif_produksi" | "fee_penjualan";
  accentClass: string;
  onCalculate: (periode: string) => Promise<{
    data: (KaryawanAmount & { total_dus_terjual?: number })[] | null;
    error: any;
  }>;
  extraControls?: React.ReactNode;
}) {
  const [periode, setPeriode] = useState(currentPeriode());
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [savedList, setSavedList] = useState<IncentivePayment[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IncentivePayment | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSaved = useCallback(
    async (p: string) => {
      setLoadingSaved(true);
      const { data, error } = await getIncentivePayments(jenis, p);
      if (error) setError("Gagal memuat data pembayaran tersimpan.");
      setSavedList(data || []);
      setLoadingSaved(false);
    },
    [jenis],
  );

  useEffect(() => {
    setPreview([]);
    fetchSaved(periode);
  }, [periode, fetchSaved]);

  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);
    const { data, error } = await onCalculate(periode);
    if (error) {
      setError("Gagal menghitung: " + (error as any).message);
      setCalculating(false);
      return;
    }
    setPreview(
      (data || []).map((row) => ({
        ...row,
        jumlah_dibayar: row.jumlah_dihitung,
      })),
    );
    setCalculating(false);
  };

  const updateJumlahDibayar = (karyawanId: string, value: string) => {
    const num = value.replace(/\D/g, "");
    setPreview((prev) =>
      prev.map((r) =>
        r.karyawan_id === karyawanId
          ? { ...r, jumlah_dibayar: num === "" ? 0 : parseInt(num, 10) }
          : r,
      ),
    );
  };

  const handleSave = async () => {
    if (preview.length === 0) return;
    setSaving(true);
    setError(null);
    const { error } = await savePayments(
      jenis,
      periode,
      preview.map((r) => ({
        karyawan_id: r.karyawan_id,
        jumlah_dihitung: r.jumlah_dihitung,
        jumlah_dibayar: r.jumlah_dibayar,
      })),
    );
    if (error) {
      setError("Gagal menyimpan pembayaran: " + (error as any).message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setPreview([]);
    fetchSaved(periode);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);
    const { error } = await deletePayment(target.id);
    if (error) {
      alert("Gagal menghapus: " + (error as any).message);
    } else {
      setSavedList((prev) => prev.filter((p) => p.id !== target.id));
    }
    setActionLoading(null);
  };

  return (
    <div>
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
          {extraControls}
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2.5 clay-blue clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {calculating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Hitung
          </button>
          {preview.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 clay-green clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Pembayaran
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          "Jumlah Dibayar" bisa diedit manual sebelum disimpan (mis. dibulatkan
          atau dibayar bertahap), terpisah dari "Jumlah Dihitung" otomatis.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {preview.length > 0 && (
        <div className="clay-raised rounded-lg mb-8 overflow-hidden">
          <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Preview Hasil Hitung — Periode {periode}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Belum tersimpan.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]">
                  {["Karyawan", "Jumlah Dihitung", "Jumlah Dibayar"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr
                    key={row.karyawan_id}
                    className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {row.nama}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {formatRp(row.jumlah_dihitung)}
                      {row.total_dus_terjual !== undefined && (
                        <span className="block text-xs text-gray-400">
                          {row.total_dus_terjual.toLocaleString("id-ID")} dus
                          terjual
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          row.jumlah_dibayar === 0 ? "" : row.jumlah_dibayar
                        }
                        onChange={(e) =>
                          updateJumlahDibayar(row.karyawan_id, e.target.value)
                        }
                        placeholder="0"
                        className="w-32 px-2 py-1.5 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="clay-raised rounded-lg overflow-hidden">
        <div
          className={`border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center gap-2`}
        >
          <TrendingUp className={`w-5 h-5 ${accentClass}`} />
          <h2 className="text-lg font-semibold text-gray-900">
            Pembayaran Tersimpan — Periode {periode}
          </h2>
        </div>
        {loadingSaved ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]">
                  {[
                    "Karyawan",
                    "Jumlah Dihitung",
                    "Jumlah Dibayar",
                    "Selisih",
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
                {savedList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-500 text-sm"
                    >
                      Belum ada pembayaran tersimpan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  savedList.map((p) => {
                    const selisih =
                      Number(p.jumlah_dibayar) - Number(p.jumlah_dihitung);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {p.karyawan?.nama ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {formatRp(Number(p.jumlah_dihitung))}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {formatRp(Number(p.jumlah_dibayar))}
                        </td>
                        <td
                          className={`py-3 px-4 text-sm font-medium ${
                            selisih === 0
                              ? "text-gray-400"
                              : selisih > 0
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          {selisih === 0 ? "—" : formatRp(selisih)}
                        </td>
                        <td className="py-3 px-4">
                          {actionLoading === p.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              Hapus Data Pembayaran Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {confirmDelete.karyawan?.nama ?? ""}
              </span>{" "}
              — periode {confirmDelete.periode}
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

function InsentifProduksiTab() {
  const [records, setRecords] = useState<InsentifProduksiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<InsentifProduksiRecord | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getInsentifProduksiRecords();
    if (error) setError("Gagal memuat data insentif produksi.");
    setRecords(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);
    const { error } = await deleteInsentifProduksi(target.id);
    if (error) {
      alert("Gagal menghapus data: " + (error as any).message);
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== target.id));
    }
    setActionLoading(null);
  };

  const totalInsentif = records.reduce(
    (s, r) => s + Number(r.total_insentif),
    0,
  );
  const totalDus = records.reduce((s, r) => s + Number(r.jumlah_dus), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Riwayat Insentif Produksi
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Insentif Produksi
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
            <Factory className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Insentif</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalInsentif)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dus Diproduksi</h3>
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
            {loading ? "—" : records.length.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-lg overflow-hidden mb-10">
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
                    "Kategori",
                    "Jumlah Dus",
                    "Rate/Dus",
                    "Total",
                    "Karyawan",
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
                      Belum ada data insentif produksi
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
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 capitalize">
                          {r.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {r.jumlah_dus.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatRp(Number(r.rate_per_dus))}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-teal-600">
                        {formatRp(Number(r.total_insentif))}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {r.insentif_produksi_workers.map((w) => (
                            <span
                              key={w.id}
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700"
                            >
                              {w.karyawan?.nama ?? "—"}
                            </span>
                          ))}
                        </div>
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

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Rekap Pembayaran Insentif Produksi
      </h2>
      <RekapPembayaran
        jenis="insentif_produksi"
        accentClass="text-teal-600"
        onCalculate={calculateInsentifProduksiPerKaryawan}
      />

      {isModalOpen && (
        <InsentifProduksiModal
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => {
            setIsModalOpen(false);
            fetchAll();
          }}
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
                {formatDate(confirmDelete.tanggal)} — {confirmDelete.kategori}{" "}
                {confirmDelete.jumlah_dus} dus
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

function FeePenjualanTab() {
  const [rate, setRate] = useState(DEFAULT_RATE_FEE_PENJUALAN);

  const handleRateChange = (value: string) => {
    const v = value.replace(/\D/g, "");
    setRate(v === "" ? 0 : parseInt(v, 10));
  };

  return (
    <div>
      <RekapPembayaran
        jenis="fee_penjualan"
        accentClass="text-blue-600"
        onCalculate={(periode) =>
          calculateFeePenjualanPerKaryawan(periode, rate)
        }
        extraControls={
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rate per Dus Terjual (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={rate === 0 ? "" : rate}
              onChange={(e) => handleRateChange(e.target.value)}
              placeholder="500"
              className="w-40 px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
        }
      />
    </div>
  );
}

export function InsentifProduksiManagement() {
  const [activeTab, setActiveTab] = useState<"produksi" | "fee_penjualan">(
    "produksi",
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Insentif Produksi &amp; Fee Penjualan
        </h1>
        <p className="text-gray-600">
          Catat insentif produksi per batch dan hitung fee penjualan dari dus
          terjual per periode
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {[
          { id: "produksi", label: "Insentif Produksi" },
          { id: "fee_penjualan", label: "Fee Penjualan" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "produksi" | "fee_penjualan")}
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

      {activeTab === "produksi" ? <InsentifProduksiTab /> : <FeePenjualanTab />}
    </div>
  );
}
