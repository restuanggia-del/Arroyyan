import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  HardHat,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Boxes,
  Users,
} from "lucide-react";
import {
  getHandlingFeeDetailByDateRange,
  HandlingFeeDetailRow,
} from "../../../services/handlingFeeService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => today().slice(0, 8) + "01";

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
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Handling Fee");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    if (data.length === 0) {
      toast.info("File Excel diunduh dengan template kosong", {
        description: "Tidak ada data pada rentang tanggal yang dipilih.",
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
      headStyles: { fillColor: [234, 88, 12] },
    });
    doc.save(`${fileName}.pdf`);

    if (rows.length === 0) {
      toast.info("File PDF diunduh dengan template kosong", {
        description: "Tidak ada data pada rentang tanggal yang dipilih.",
      });
    }
  } catch {
    toast.error("Gagal export PDF", {
      description: "Jalankan: npm install jspdf jspdf-autotable",
    });
  }
};

interface KaryawanSummary {
  karyawan_id: string;
  nama: string;
  jumlah_kegiatan: number;
  total_fee: number;
}

export function LaporanHandlingFee() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HandlingFeeDetailRow[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (startDate > endDate) {
      setError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      setLoading(false);
      return;
    }

    const { data, error } = await getHandlingFeeDetailByDateRange(
      startDate,
      endDate,
    );
    if (error) setError("Gagal memuat laporan handling fee. Coba refresh.");
    setData(data || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summaryByKaryawan = useMemo<KaryawanSummary[]>(() => {
    const map = new Map<string, KaryawanSummary>();
    for (const row of data) {
      const existing = map.get(row.karyawan_id);
      if (existing) {
        existing.jumlah_kegiatan += 1;
        existing.total_fee += row.fee_per_orang;
      } else {
        map.set(row.karyawan_id, {
          karyawan_id: row.karyawan_id,
          nama: row.nama,
          jumlah_kegiatan: 1,
          total_fee: row.fee_per_orang,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_fee - a.total_fee);
  }, [data]);

  const totalFee = data.reduce((s, r) => s + r.fee_per_orang, 0);
  const totalDusUnik = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    for (const row of data) {
      const key = `${row.tanggal}-${row.jumlah_dus}-${row.rate_per_dus}-${row.keterangan}`;
      if (!seen.has(key)) {
        seen.add(key);
        sum += row.jumlah_dus;
      }
    }
    return sum;
  }, [data]);

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportToExcel(
        data.map((r) => ({
          Tanggal: r.tanggal,
          Karyawan: r.nama,
          "Jumlah Dus": r.jumlah_dus,
          "Rate/Dus": r.rate_per_dus,
          "Fee Diterima": r.fee_per_orang,
          Keterangan: r.keterangan ?? "",
        })),
        [
          "Tanggal",
          "Karyawan",
          "Jumlah Dus",
          "Rate/Dus",
          "Fee Diterima",
          "Keterangan",
        ],
        `laporan-handling-fee-${startDate}-${endDate}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportToPDF(
        `Laporan Handling Fee (${startDate} s/d ${endDate})`,
        ["Tanggal", "Karyawan", "Jumlah Dus", "Rate/Dus", "Fee Diterima"],
        data.map((r) => [
          formatDate(r.tanggal),
          r.nama,
          r.jumlah_dus,
          formatRp(r.rate_per_dus),
          formatRp(r.fee_per_orang),
        ]),
        `laporan-handling-fee-${startDate}-${endDate}`,
      );
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Handling Fee
        </h1>
        <p className="text-gray-600">
          Rekap fee handling per karyawan dalam rentang tanggal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <HardHat className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Fee Handling</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalFee)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Boxes className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dus Dihandle</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : totalDusUnik.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Karyawan Terlibat</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : summaryByKaryawan.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Rekap per Karyawan
          </h2>
        </div>
        {loading ? (
          <div className="py-10 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : summaryByKaryawan.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">
            Belum ada data pada rentang tanggal ini
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  {["Karyawan", "Jumlah Kegiatan", "Total Fee Diterima"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {summaryByKaryawan.map((s) => (
                  <tr
                    key={s.karyawan_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {s.nama}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {s.jumlah_kegiatan}
                    </td>
                    <td className="py-3 px-4 font-semibold text-orange-600">
                      {formatRp(s.total_fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-gray-400 mb-2.5">—</span>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
              Belum ada data handling fee pada rentang tanggal ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {[
                      "Tanggal",
                      "Karyawan",
                      "Jumlah Dus",
                      "Rate/Dus",
                      "Fee Diterima",
                      "Keterangan",
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
                  {data.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {formatDate(r.tanggal)}
                      </td>
                      <td className="py-3 px-3 font-medium">{r.nama}</td>
                      <td className="py-3 px-3">
                        {r.jumlah_dus.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3">{formatRp(r.rate_per_dus)}</td>
                      <td className="py-3 px-3 font-semibold text-orange-600">
                        {formatRp(r.fee_per_orang)}
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">
                        {r.keterangan || "—"}
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
