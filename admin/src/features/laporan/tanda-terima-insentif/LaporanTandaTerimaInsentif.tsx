import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Wallet,
  Users,
} from "lucide-react";
import {
  getIncentiveReceipts,
  generateReceipts,
  markReceiptStatus,
  deleteIncentiveReceipt,
  IncentiveReceipt,
} from "../../../services/incentiveReceiptService";
import { currentPeriode, today } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";
import {
  exportTandaTerimaToExcel,
  exportTandaTerimaToPDF,
} from "../tanda-terima-insentif/laporanTandaTerimaInsentifExportUtils";
import { TandaTerimaTable } from "../tanda-terima-insentif/TandaTerimaTable";
import { DeleteReceiptModal } from "../tanda-terima-insentif/DeleteReceiptModal";

export function LaporanTandaTerimaInsentif() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<IncentiveReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IncentiveReceipt | null>(
    null,
  );

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getIncentiveReceipts(p);
    if (error) setError("Gagal memuat data tanda terima insentif.");
    setData(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(periode);
  }, [periode, fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const { error } = await generateReceipts(periode);
    if (error) {
      setError("Gagal menghitung rekap: " + (error as any).message);
      setGenerating(false);
      return;
    }
    setGenerating(false);
    fetchData(periode);
  };

  const handleToggleStatus = async (receipt: IncentiveReceipt) => {
    setActionLoading(receipt.id);
    const newStatus =
      receipt.status_tanda_terima === "sudah" ? "belum" : "sudah";
    const { error } = await markReceiptStatus(receipt.id, newStatus, today());
    if (error) {
      alert("Gagal mengubah status: " + (error as any).message);
    } else {
      fetchData(periode);
    }
    setActionLoading(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    const target = confirmDelete;
    setConfirmDelete(null);
    const { error } = await deleteIncentiveReceipt(target.id);
    if (error) {
      alert("Gagal menghapus data: " + (error as any).message);
    } else {
      setData((prev) => prev.filter((r) => r.id !== target.id));
    }
    setActionLoading(null);
  };

  const totalKeseluruhan = data.reduce((s, r) => s + Number(r.jumlah_total), 0);
  const sudahDiterima = data.filter(
    (r) => r.status_tanda_terima === "sudah",
  ).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Tanda Terima Insentif
        </h1>
        <p className="text-gray-600">
          Rekap total seluruh insentif (produksi, fee penjualan, handling, fee
          rekapan, bonus target) per karyawan/sales per bulan, dan status
          konfirmasi penerimaannya
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Seluruh Insentif</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalKeseluruhan)}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Jumlah Penerima (Karyawan & Sales)
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : data.length}
          </p>
        </div>
        <div className="clay-raised rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Sudah Konfirmasi Terima
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : `${sudahDiterima} / ${data.length}`}
          </p>
        </div>
      </div>

      <div className="clay-raised rounded-xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Periode
              </label>
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 clay-purple clay-pressable text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Hitung / Refresh Rekap
            </button>
            <p className="text-xs text-gray-400 max-w-xs">
              Produksi, Fee Penjualan, dan Bonus Target otomatis pakai hitungan
              live dari data transaksi kalau belum pernah disimpan manual di
              halaman masing-masing.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setExportingType("pdf");
                try {
                  await exportTandaTerimaToPDF(data, periode);
                } finally {
                  setExportingType(null);
                }
              }}
              disabled={
                loading || (exportingType !== null && exportingType !== "pdf")
              }
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "pdf" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={async () => {
                setExportingType("excel");
                try {
                  await exportTandaTerimaToExcel(data, periode);
                } finally {
                  setExportingType(null);
                }
              }}
              disabled={
                loading || (exportingType !== null && exportingType !== "excel")
              }
              className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "excel" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-400 mb-4">
            "Hitung / Refresh Rekap" mengambil ulang total dari data Insentif
            Produksi, Fee Penjualan, Handling Fee, Fee Rekapan, dan Bonus
            (bagian uang) yang sudah tersimpan di periode ini — status
            konfirmasi terima yang sudah dicentang tidak akan ter-reset.
          </p>

          {error && (
            <div className="mb-4 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          ) : (
            <TandaTerimaTable
              data={data}
              actionLoading={actionLoading}
              onToggleStatus={handleToggleStatus}
              onRequestDelete={setConfirmDelete}
            />
          )}
        </div>
      </div>

      <DeleteReceiptModal
        receipt={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
