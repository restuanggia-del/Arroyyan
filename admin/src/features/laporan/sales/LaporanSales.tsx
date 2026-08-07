import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Wallet,
  HandCoins,
} from "lucide-react";
import { getActiveKaryawan, Karyawan } from "../../../services/karyawanService";
import {
  getLaporanSales,
  LaporanSalesResult,
  DEFAULT_RATE_INSENTIF_SALES,
  DEFAULT_RATE_HANDLING_SALES,
} from "../../../services/laporanSalesService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDos = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const currentPeriode = () => new Date().toISOString().slice(0, 7);

const exportToExcel = async (result: LaporanSalesResult, fileName: string) => {
  try {
    const XLSX = await import("xlsx");
    const rows = result.rows.map((r) => ({
      Tanggal: r.tanggal,
      Ukuran: r.size,
      "Cash (Dos)": r.cash_dos,
      "Cash (Rp)": r.cash_rp,
      "Titip (Dos)": r.titip_dos,
      "Titip (Rp)": r.titip_rp,
      "Sub Total (Rp)": r.sub_total_rp,
    }));
    rows.push({
      Tanggal: "TOTAL",
      Ukuran: "",
      "Cash (Dos)": result.total_cash_dos,
      "Cash (Rp)": result.total_cash_rp,
      "Titip (Dos)": result.total_titip_dos,
      "Titip (Rp)": result.total_titip_rp,
      "Sub Total (Rp)": result.total_sub_total_rp,
    } as any);

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: [
        "Tanggal",
        "Ukuran",
        "Cash (Dos)",
        "Cash (Rp)",
        "Titip (Dos)",
        "Titip (Rp)",
        "Sub Total (Rp)",
      ],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Sales");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    if (result.rows.length === 0) {
      toast.info("File Excel diunduh dengan template kosong", {
        description: "Tidak ada transaksi pada periode yang dipilih.",
      });
    }
  } catch {
    toast.error("Gagal export Excel", {
      description: "Jalankan: npm install xlsx",
    });
  }
};

const exportToPDF = async (result: LaporanSalesResult, fileName: string) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("LAPORAN HASIL PENJUALAN AIR MINERAL ARROYYAN99", 14, 18);
    doc.setFontSize(10);
    doc.text(`Nama Sales: ${result.nama_sales}`, 14, 26);
    doc.text(`Bulan: ${result.periode}`, 14, 32);

    autoTable(doc, {
      head: [
        [
          "Tanggal",
          "Ukuran",
          "Cash (Dos)",
          "Cash (Rp)",
          "Titip (Dos)",
          "Titip (Rp)",
          "Sub Total",
        ],
      ],
      body: [
        ...result.rows.map((r) => [
          formatDate(r.tanggal),
          r.size,
          formatDos(r.cash_dos),
          formatRp(r.cash_rp),
          formatDos(r.titip_dos),
          formatRp(r.titip_rp),
          formatRp(r.sub_total_rp),
        ]),
        [
          "TOTAL",
          "",
          formatDos(result.total_cash_dos),
          formatRp(result.total_cash_rp),
          formatDos(result.total_titip_dos),
          formatRp(result.total_titip_rp),
          formatRp(result.total_sub_total_rp),
        ],
      ],
      startY: 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(
      `Insentif Sales (Rp ${result.rate_insentif_sales.toLocaleString("id-ID")}/dos): ${formatRp(result.insentif_sales)}`,
      14,
      finalY,
    );
    doc.text(
      `Handling (Rp ${result.rate_handling.toLocaleString("id-ID")}/dos titip): ${formatRp(result.handling)}`,
      14,
      finalY + 6,
    );

    doc.text(
      `Bogatama, ${new Date().toLocaleDateString("id-ID")}`,
      140,
      finalY + 20,
    );
    doc.text("Diketahui Oleh,", 14, finalY + 20);
    doc.text("Direkap Oleh,", 100, finalY + 20);

    doc.save(`${fileName}.pdf`);

    if (result.rows.length === 0) {
      toast.info("File PDF diunduh dengan template kosong", {
        description: "Tidak ada transaksi pada periode yang dipilih.",
      });
    }
  } catch {
    toast.error("Gagal export PDF", {
      description: "Jalankan: npm install jspdf jspdf-autotable",
    });
  }
};

export function LaporanSales() {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loadingKaryawan, setLoadingKaryawan] = useState(true);
  const [karyawanId, setKaryawanId] = useState("");
  const [periode, setPeriode] = useState(currentPeriode());
  const [rateInsentif, setRateInsentif] = useState(DEFAULT_RATE_INSENTIF_SALES);
  const [rateHandling, setRateHandling] = useState(DEFAULT_RATE_HANDLING_SALES);

  const [result, setResult] = useState<LaporanSalesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingKaryawan(true);
      const { data } = await getActiveKaryawan("jual_antar");
      setKaryawanList(data || []);
      if (data && data.length > 0) setKaryawanId(data[0].id);
      setLoadingKaryawan(false);
    };
    load();
  }, []);

  const fetchReport = useCallback(async () => {
    if (!karyawanId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await getLaporanSales(
      karyawanId,
      periode,
      rateInsentif,
      rateHandling,
    );
    if (error)
      setError("Gagal memuat laporan sales: " + (error as any).message);
    setResult(data);
    setLoading(false);
  }, [karyawanId, periode, rateInsentif, rateHandling]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRateChange = (setter: (v: number) => void) => (value: string) => {
    const v = value.replace(/\D/g, "");
    setter(v === "" ? 0 : parseInt(v, 10));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Sales</h1>
        <p className="text-gray-600">
          Rekap hasil penjualan per sales per bulan (Cash vs Titip, Insentif
          Sales, Handling) — mengikuti format Laporan Hasil Penjualan Air
          Mineral ARROYYAN99
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Sales
            </label>
            {loadingKaryawan ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat...
              </div>
            ) : (
              <select
                value={karyawanId}
                onChange={(e) => setKaryawanId(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px]"
              >
                {karyawanList.length === 0 && (
                  <option value="">Belum ada karyawan sales</option>
                )}
                {karyawanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bulan
            </label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rate Insentif Sales (Rp/dos)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={rateInsentif === 0 ? "" : rateInsentif}
              onChange={(e) =>
                handleRateChange(setRateInsentif)(e.target.value)
              }
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rate Handling (Rp/dos titip)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={rateHandling === 0 ? "" : rateHandling}
              onChange={(e) =>
                handleRateChange(setRateHandling)(e.target.value)
              }
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Default: Insentif Sales Rp 500/dos (total cash + titip), Handling Rp
          300/dos khusus porsi titip/kasbon — sesuaikan kalau beda dari
          kesepakatan.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Dos Terjual</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading || !result ? "—" : formatDos(result.total_dos)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading || !result ? "—" : formatRp(result.total_sub_total_rp)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <HandCoins className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Insentif Sales</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading || !result ? "—" : formatRp(result.insentif_sales)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <HandCoins className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Handling (Titip)</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading || !result ? "—" : formatRp(result.handling)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {result?.nama_sales ?? "—"} — {periode}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                result &&
                (setExporting(true),
                exportToPDF(
                  result,
                  `laporan-sales-${result.nama_sales}-${periode}`,
                ).finally(() => setExporting(false)))
              }
              disabled={exporting || loading || !result}
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
              onClick={() =>
                result &&
                (setExporting(true),
                exportToExcel(
                  result,
                  `laporan-sales-${result.nama_sales}-${periode}`,
                ).finally(() => setExporting(false)))
              }
              disabled={exporting || loading || !result}
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
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat laporan...</p>
            </div>
          ) : !result || result.rows.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              Belum ada transaksi penjualan untuk sales &amp; periode ini
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th
                      rowSpan={2}
                      className="text-left py-3 px-3 font-semibold text-gray-700 align-bottom"
                    >
                      Tanggal
                    </th>
                    <th
                      rowSpan={2}
                      className="text-left py-3 px-3 font-semibold text-gray-700 align-bottom"
                    >
                      Ukuran
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-2 px-3 font-semibold text-gray-700 border-b border-gray-200"
                    >
                      Cash
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-2 px-3 font-semibold text-gray-700 border-b border-gray-200"
                    >
                      Titip
                    </th>
                    <th
                      rowSpan={2}
                      className="text-left py-3 px-3 font-semibold text-gray-700 align-bottom"
                    >
                      Sub Total
                    </th>
                  </tr>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">
                      Dos
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">
                      Rp
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">
                      Dos
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">
                      Rp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                        {formatDate(r.tanggal)}
                      </td>
                      <td className="py-2.5 px-3">{r.size}</td>
                      <td className="py-2.5 px-3">
                        {r.cash_dos ? formatDos(r.cash_dos) : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.cash_rp ? formatRp(r.cash_rp) : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.titip_dos ? formatDos(r.titip_dos) : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.titip_rp ? formatRp(r.titip_rp) : "—"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {formatRp(r.sub_total_rp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td className="py-3 px-3" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="py-3 px-3">
                      {formatDos(result.total_cash_dos)}
                    </td>
                    <td className="py-3 px-3">
                      {formatRp(result.total_cash_rp)}
                    </td>
                    <td className="py-3 px-3">
                      {formatDos(result.total_titip_dos)}
                    </td>
                    <td className="py-3 px-3">
                      {formatRp(result.total_titip_rp)}
                    </td>
                    <td className="py-3 px-3 text-blue-700">
                      {formatRp(result.total_sub_total_rp)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
