import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Calculator,
  Wallet,
  Users,
} from "lucide-react";
import {
  getIncentivePaymentsRange,
  IncentivePayment,
  IncentiveJenis,
  JENIS_LABEL,
} from "../../../services/insentifService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const currentPeriode = () => new Date().toISOString().slice(0, 7);

type FilterJenis = "semua" | "insentif_produksi" | "fee_penjualan";

const exportToExcel = async (
  data: Record<string, any>[],
  headers: string[],
  fileName: string,
) => {
  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Insentif");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    if (data.length === 0) {
      toast.info("File Excel diunduh dengan template kosong", {
        description: "Tidak ada data pada periode yang dipilih.",
      });
    }
  } catch {
    toast.error("Gagal export Excel", {
      description: "Jalankan: npm install xlsx",
    });
  }
};

const exportToPDF = async (
  title: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ARROYYAN99 — " + title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 28);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 148, 136] },
    });
    doc.save(`${fileName}.pdf`);

    if (rows.length === 0) {
      toast.info("File PDF diunduh dengan template kosong", {
        description: "Tidak ada data pada periode yang dipilih.",
      });
    }
  } catch {
    toast.error("Gagal export PDF", {
      description: "Jalankan: npm install jspdf jspdf-autotable",
    });
  }
};

export function LaporanInsentif() {
  const [startPeriode, setStartPeriode] = useState(currentPeriode());
  const [endPeriode, setEndPeriode] = useState(currentPeriode());
  const [filterJenis, setFilterJenis] = useState<FilterJenis>("semua");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IncentivePayment[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startPeriode > endPeriode) {
      setError("Periode awal tidak boleh setelah periode akhir.");
      setLoading(false);
      return;
    }

    const jenisList: IncentiveJenis[] =
      filterJenis === "semua"
        ? ["insentif_produksi", "fee_penjualan"]
        : [filterJenis];

    const { data, error } = await getIncentivePaymentsRange(
      jenisList,
      startPeriode,
      endPeriode,
    );
    if (error) setError("Gagal memuat laporan insentif. Coba refresh.");
    setData(data || []);
    setLoading(false);
  }, [startPeriode, endPeriode, filterJenis]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalDihitung = data.reduce((s, r) => s + Number(r.jumlah_dihitung), 0);
  const totalDibayar = data.reduce((s, r) => s + Number(r.jumlah_dibayar), 0);
  const jumlahKaryawan = new Set(data.map((r) => r.karyawan_id)).size;

  const handleExportExcel = async () => {
    setExporting(true);
    await exportToExcel(
      data.map((r) => ({
        Periode: r.periode,
        Jenis: JENIS_LABEL[r.jenis],
        Karyawan: r.karyawan?.nama ?? "—",
        "Jumlah Dihitung": Number(r.jumlah_dihitung),
        "Jumlah Dibayar": Number(r.jumlah_dibayar),
        Selisih: Number(r.jumlah_dibayar) - Number(r.jumlah_dihitung),
        Keterangan: r.keterangan ?? "",
      })),
      [
        "Periode",
        "Jenis",
        "Karyawan",
        "Jumlah Dihitung",
        "Jumlah Dibayar",
        "Selisih",
        "Keterangan",
      ],
      `laporan-insentif-${startPeriode}-${endPeriode}`,
    );
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    await exportToPDF(
      `Laporan Insentif (${startPeriode} s/d ${endPeriode})`,
      ["Periode", "Jenis", "Karyawan", "Dihitung", "Dibayar", "Selisih"],
      data.map((r) => [
        r.periode,
        JENIS_LABEL[r.jenis],
        r.karyawan?.nama ?? "—",
        formatRp(Number(r.jumlah_dihitung)),
        formatRp(Number(r.jumlah_dibayar)),
        formatRp(Number(r.jumlah_dibayar) - Number(r.jumlah_dihitung)),
      ]),
      `laporan-insentif-${startPeriode}-${endPeriode}`,
    );
    setExporting(false);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Insentif
        </h1>
        <p className="text-gray-600">
          Rekap pembayaran insentif produksi &amp; fee penjualan yang sudah
          tersimpan
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dihitung</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalDihitung)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dibayar</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalDibayar)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Karyawan Menerima</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : jumlahKaryawan}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Periode Awal
              </label>
              <input
                type="month"
                value={startPeriode}
                onChange={(e) => setStartPeriode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-400 mb-2.5">—</span>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Periode Akhir
              </label>
              <input
                type="month"
                value={endPeriode}
                onChange={(e) => setEndPeriode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jenis</label>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value as FilterJenis)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="semua">Semua Jenis</option>
                <option value="insentif_produksi">Insentif Produksi</option>
                <option value="fee_penjualan">Fee Penjualan</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting || loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat laporan...</p>
            </div>
          ) : data.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              Belum ada pembayaran insentif tersimpan pada rentang periode ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {[
                      "Periode",
                      "Jenis",
                      "Karyawan",
                      "Dihitung",
                      "Dibayar",
                      "Selisih",
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
                  {data.map((r) => {
                    const selisih =
                      Number(r.jumlah_dibayar) - Number(r.jumlah_dihitung);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                          {r.periode}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              r.jenis === "insentif_produksi"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {JENIS_LABEL[r.jenis]}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {r.karyawan?.nama ?? "—"}
                        </td>
                        <td className="py-3 px-3">
                          {formatRp(Number(r.jumlah_dihitung))}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900">
                          {formatRp(Number(r.jumlah_dibayar))}
                        </td>
                        <td
                          className={`py-3 px-3 font-medium ${
                            selisih === 0
                              ? "text-gray-400"
                              : selisih > 0
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          {selisih === 0 ? "—" : formatRp(selisih)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
