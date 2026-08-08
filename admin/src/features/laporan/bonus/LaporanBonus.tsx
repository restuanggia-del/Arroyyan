import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Package,
  Shirt,
  Wallet,
} from "lucide-react";
import {
  getBonusRecordsByPeriodeRange,
  BonusRecord,
} from "../../../services/bonusService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDus = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const currentPeriode = () => new Date().toISOString().slice(0, 7);

const exportToExcel = async (
  data: Record<string, any>[],
  headers: string[],
  fileName: string,
) => {
  try {
    const XLSX = await import("xlsx");
    const safeData =
      data.length > 0
        ? data
        : [Object.fromEntries(headers.map((h) => [h, ""]))];
    const ws = XLSX.utils.json_to_sheet(safeData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bonus");
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
    const safeRows = rows.length > 0 ? rows : [Array(headers.length).fill("")];
    autoTable(doc, {
      head: [headers],
      body: safeRows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 119, 6] },
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

export function LaporanBonus() {
  const [startPeriode, setStartPeriode] = useState(currentPeriode());
  const [endPeriode, setEndPeriode] = useState(currentPeriode());
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BonusRecord[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startPeriode > endPeriode) {
      setError("Periode awal tidak boleh setelah periode akhir.");
      setLoading(false);
      return;
    }

    const { data, error } = await getBonusRecordsByPeriodeRange(
      startPeriode,
      endPeriode,
    );
    if (error) setError("Gagal memuat laporan bonus. Coba refresh.");
    setData(data || []);
    setLoading(false);
  }, [startPeriode, endPeriode]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalBonusDus = data.reduce((s, r) => s + Number(r.bonus_dus), 0);
  const totalBonusKaos = data.reduce((s, r) => s + Number(r.bonus_kaos), 0);
  const totalBonusRp = data.reduce((s, r) => s + Number(r.bonus_target_rp), 0);
  const jumlahPenerima = new Set(data.map((r) => r.karyawan_id)).size;

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportToExcel(
        data.map((r) => ({
          Periode: r.periode,
          Karyawan: r.karyawan?.nama ?? "—",
          "Total Dus Terjual": Number(r.total_dus_terjual),
          "Bonus Dus": r.bonus_dus,
          "Bonus Kaos": r.bonus_kaos,
          "Bonus Uang (Rp)": Number(r.bonus_target_rp),
          Catatan: r.catatan ?? "",
        })),
        [
          "Periode",
          "Karyawan",
          "Total Dus Terjual",
          "Bonus Dus",
          "Bonus Kaos",
          "Bonus Uang (Rp)",
          "Catatan",
        ],
        `laporan-bonus-${startPeriode}-${endPeriode}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportToPDF(
        `Laporan Bonus (${startPeriode} s/d ${endPeriode})`,
        [
          "Periode",
          "Karyawan",
          "Dus Terjual",
          "Bonus Dus",
          "Bonus Kaos",
          "Bonus Uang",
        ],
        data.map((r) => [
          r.periode,
          r.karyawan?.nama ?? "—",
          formatDus(Number(r.total_dus_terjual)),
          r.bonus_dus,
          r.bonus_kaos,
          formatRp(Number(r.bonus_target_rp)),
        ]),
        `laporan-bonus-${startPeriode}-${endPeriode}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Bonus</h1>
        <p className="text-gray-600">
          Rekap bonus karyawan yang sudah tersimpan, per rentang periode
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">
            Karyawan Menerima Bonus
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : jumlahPenerima}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Bonus Dus</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totalBonusDus)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Shirt className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Bonus Kaos</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalBonusKaos.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Bonus Uang</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalBonusRp)}
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
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
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
              onClick={handleExportExcel}
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
              Belum ada rekap bonus tersimpan pada rentang periode ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {[
                      "Periode",
                      "Karyawan",
                      "Dus Terjual",
                      "Bonus Dus",
                      "Bonus Kaos",
                      "Bonus Uang",
                      "Catatan",
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
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {r.periode}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {r.karyawan?.nama ?? "—"}
                        {r.karyawan?.bonus_khusus && (
                          <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                            Khusus
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {formatDus(Number(r.total_dus_terjual))}
                      </td>
                      <td className="py-3 px-3 font-semibold">{r.bonus_dus}</td>
                      <td className="py-3 px-3 font-semibold">
                        {r.bonus_kaos}
                      </td>
                      <td className="py-3 px-3 font-semibold text-green-600">
                        {formatRp(Number(r.bonus_target_rp))}
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">
                        {r.catatan || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
