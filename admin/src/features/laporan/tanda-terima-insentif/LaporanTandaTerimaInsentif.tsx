import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Circle,
  Wallet,
  Users,
  Trash2,
} from "lucide-react";
import {
  getIncentiveReceipts,
  generateReceipts,
  markReceiptStatus,
  deleteIncentiveReceipt,
  IncentiveReceipt,
} from "../../../services/incentiveReceiptService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const currentPeriode = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const exportToExcel = async (data: IncentiveReceipt[], periode: string) => {
  try {
    const XLSX = await import("xlsx");
    const headers = [
      "Karyawan",
      "Insentif Produksi",
      "Fee Penjualan",
      "Handling",
      "Fee Rekapan",
      "Bonus Target",
      "Jumlah Total",
      "Status",
      "Tanggal Terima",
    ];
    const rows = data.map((r) => ({
      Karyawan: r.karyawan?.nama ?? "—",
      "Insentif Produksi": r.total_produksi,
      "Fee Penjualan": r.total_fee_penjualan,
      Handling: r.total_handling,
      "Fee Rekapan": r.total_fee_rekapan,
      "Bonus Target": r.total_bonus_target,
      "Jumlah Total": r.jumlah_total,
      Status:
        r.status_tanda_terima === "sudah" ? "Sudah Diterima" : "Belum Diterima",
      "Tanggal Terima": r.tanggal_terima ?? "",
    }));
    const safeRows =
      rows.length > 0
        ? rows
        : [Object.fromEntries(headers.map((h) => [h, ""]))];
    const ws = XLSX.utils.json_to_sheet(safeRows, {
      header: headers,
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tanda Terima Insentif");
    XLSX.writeFile(wb, `tanda-terima-insentif-${periode}.xlsx`);

    if (data.length === 0) {
      toast.info("File Excel diunduh dengan template kosong", {
        description: "Belum ada rekap untuk periode ini.",
      });
    }
  } catch {
    toast.error("Gagal export Excel", {
      description: "Jalankan: npm install xlsx",
    });
  }
};

const exportToPDF = async (data: IncentiveReceipt[], periode: string) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ARROYYAN99 — Tanda Terima Insentif", 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${periode}`, 14, 28);

    const tableRows = data.map((r) => [
      r.karyawan?.nama ?? "—",
      formatRp(r.total_produksi),
      formatRp(r.total_fee_penjualan),
      formatRp(r.total_handling),
      formatRp(r.total_fee_rekapan),
      formatRp(r.total_bonus_target),
      formatRp(r.jumlah_total),
      "",
    ]);
    const bodyRows = data.length === 0 ? [Array(8).fill("")] : tableRows;

    autoTable(doc, {
      head: [
        [
          "Karyawan",
          "Produksi",
          "Fee Jual",
          "Handling",
          "Fee Rekap",
          "Bonus",
          "Total",
          "Tanda Tangan",
        ],
      ],
      body: bodyRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 7: { minCellWidth: 28 } },
    });

    doc.save(`tanda-terima-insentif-${periode}.pdf`);

    if (data.length === 0) {
      toast.info("File PDF diunduh dengan template kosong", {
        description: "Belum ada rekap untuk periode ini.",
      });
    }
  } catch {
    toast.error("Gagal export PDF", {
      description: "Jalankan: npm install jspdf jspdf-autotable",
    });
  }
};

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
          rekapan, bonus target) per karyawan per bulan, dan status konfirmasi
          penerimaannya
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Seluruh Insentif</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalKeseluruhan)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Jumlah Karyawan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : data.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-end justify-between flex-wrap gap-4">
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
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
                  await exportToPDF(data, periode);
                } finally {
                  setExportingType(null);
                }
              }}
              disabled={
                loading || (exportingType !== null && exportingType !== "pdf")
              }
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
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
                  await exportToExcel(data, periode);
                } finally {
                  setExportingType(null);
                }
              }}
              disabled={
                loading || (exportingType !== null && exportingType !== "excel")
              }
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          ) : data.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              Belum ada rekap untuk periode ini. Klik "Hitung / Refresh Rekap"
              untuk menghitung dari data yang sudah tersimpan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {[
                      "Karyawan",
                      "Produksi",
                      "Fee Jualan",
                      "Handling",
                      "Fee Rekap",
                      "Bonus",
                      "Total",
                      "Status",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">
                        {r.karyawan?.nama ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatRp(r.total_produksi)}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatRp(r.total_fee_penjualan)}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatRp(r.total_handling)}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatRp(r.total_fee_rekapan)}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatRp(r.total_bonus_target)}
                      </td>
                      <td className="py-3 px-3 font-bold text-indigo-700 whitespace-nowrap">
                        {formatRp(r.jumlah_total)}
                      </td>
                      <td className="py-3 px-3">
                        {actionLoading === r.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(r)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              r.status_tanda_terima === "sudah"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title={
                              r.status_tanda_terima === "sudah"
                                ? `Diterima ${r.tanggal_terima ? formatDate(r.tanggal_terima) : ""}`
                                : "Klik untuk tandai sudah diterima"
                            }
                          >
                            {r.status_tanda_terima === "sudah" ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                            {r.status_tanda_terima === "sudah"
                              ? "Sudah Terima"
                              : "Belum"}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Rekap Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {confirmDelete.karyawan?.nama ?? ""}
              </span>{" "}
              — periode {confirmDelete.periode}
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              Bisa dihitung ulang lagi lewat tombol "Hitung / Refresh Rekap".
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
