import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Package,
  Wallet,
} from "lucide-react";
import {
  getLaporanGlobal,
  LaporanGlobalRow,
} from "../../../services/laporanGlobalService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDus = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const currentPeriode = () => new Date().toISOString().slice(0, 7);

const exportToExcel = async (data: LaporanGlobalRow[], periode: string) => {
  try {
    const XLSX = await import("xlsx");
    const rows = data.map((r) => ({
      Produk: `${r.product_name}${r.size ? ` (${r.size})` : ""}`,
      "Stok Awal (Dus)": r.stok_awal_dus,
      "Total Produksi (Dus)": r.total_produksi_dus,
      "Total Keluar (Dus)": r.total_keluar_dus,
      "Sisa Stok (Dus)": r.sisa_stok_dus,
      "Cash (Dus)": r.penjualan_cash_dus,
      "Cash (Rp)": r.penjualan_cash_rp,
      "Bon (Dus)": r.penjualan_bon_dus,
      "Bon (Rp)": r.penjualan_bon_rp,
      "Tot. Penjualan (Dus)": r.penjualan_total_dus,
      "Tot. Penjualan (Rp)": r.penjualan_total_rp,
      "Sodaqoh (Dus)": r.sodaqoh_dus,
      "Sodaqoh (Rp est.)": r.sodaqoh_rp,
      "Pribadi (Dus)": r.pribadi_dus,
      "Pribadi (Rp est.)": r.pribadi_rp,
      "Bonus (Dus)": r.bonus_dus,
      "Bonus (Rp est.)": r.bonus_rp,
      "Retur (Dus)": r.retur_dus,
      "Retur (Rp est.)": r.retur_rp,
    }));
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: Object.keys(
        rows[0] ?? {
          Produk: "",
          "Stok Awal (Dus)": "",
          "Total Produksi (Dus)": "",
          "Total Keluar (Dus)": "",
          "Sisa Stok (Dus)": "",
          "Cash (Dus)": "",
          "Cash (Rp)": "",
          "Bon (Dus)": "",
          "Bon (Rp)": "",
          "Tot. Penjualan (Dus)": "",
          "Tot. Penjualan (Rp)": "",
          "Sodaqoh (Dus)": "",
          "Sodaqoh (Rp est.)": "",
          "Pribadi (Dus)": "",
          "Pribadi (Rp est.)": "",
          "Bonus (Dus)": "",
          "Bonus (Rp est.)": "",
          "Retur (Dus)": "",
          "Retur (Rp est.)": "",
        },
      ),
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Global");
    XLSX.writeFile(wb, `laporan-global-${periode}.xlsx`);

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
  data: LaporanGlobalRow[],
  periode: string,
  totals: any,
) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("REKAPAN PENJUALAN PRODUK ARROYYAN99", 14, 16);
    doc.setFontSize(10);
    doc.text(`Periode: ${periode}`, 14, 23);

    autoTable(doc, {
      head: [
        [
          "Produk",
          "Stok Awal",
          "Produksi",
          "Keluar",
          "Sisa",
          "Cash Dus",
          "Cash Rp",
          "Bon Dus",
          "Bon Rp",
          "Sodaqoh",
          "Pribadi",
          "Bonus",
          "Retur",
        ],
      ],
      body: [
        ...data.map((r) => [
          `${r.product_name}${r.size ? ` (${r.size})` : ""}`,
          formatDus(r.stok_awal_dus),
          formatDus(r.total_produksi_dus),
          formatDus(r.total_keluar_dus),
          formatDus(r.sisa_stok_dus),
          formatDus(r.penjualan_cash_dus),
          formatRp(r.penjualan_cash_rp),
          formatDus(r.penjualan_bon_dus),
          formatRp(r.penjualan_bon_rp),
          formatDus(r.sodaqoh_dus),
          formatDus(r.pribadi_dus),
          formatDus(r.bonus_dus),
          formatDus(r.retur_dus),
        ]),
        [
          "TOTAL",
          formatDus(totals.stok_awal_dus),
          formatDus(totals.total_produksi_dus),
          formatDus(totals.total_keluar_dus),
          formatDus(totals.sisa_stok_dus),
          formatDus(totals.penjualan_cash_dus),
          formatRp(totals.penjualan_cash_rp),
          formatDus(totals.penjualan_bon_dus),
          formatRp(totals.penjualan_bon_rp),
          formatDus(totals.sodaqoh_dus),
          formatDus(totals.pribadi_dus),
          formatDus(totals.bonus_dus),
          formatDus(totals.retur_dus),
        ],
      ],
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save(`laporan-global-${periode}.pdf`);

    if (data.length === 0) {
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

export function LaporanGlobal() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<LaporanGlobalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getLaporanGlobal(p);
    if (error)
      setError("Gagal memuat laporan global: " + (error as any).message);
    setData(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const sum = (key: keyof LaporanGlobalRow) =>
    data.reduce((s, r) => s + Number(r[key] as number), 0);

  const totals = {
    stok_awal_dus: sum("stok_awal_dus"),
    total_produksi_dus: sum("total_produksi_dus"),
    total_keluar_dus: sum("total_keluar_dus"),
    sisa_stok_dus: sum("sisa_stok_dus"),
    penjualan_cash_dus: sum("penjualan_cash_dus"),
    penjualan_cash_rp: sum("penjualan_cash_rp"),
    penjualan_bon_dus: sum("penjualan_bon_dus"),
    penjualan_bon_rp: sum("penjualan_bon_rp"),
    penjualan_total_dus: sum("penjualan_total_dus"),
    penjualan_total_rp: sum("penjualan_total_rp"),
    sodaqoh_dus: sum("sodaqoh_dus"),
    sodaqoh_rp: sum("sodaqoh_rp"),
    pribadi_dus: sum("pribadi_dus"),
    pribadi_rp: sum("pribadi_rp"),
    bonus_dus: sum("bonus_dus"),
    bonus_rp: sum("bonus_rp"),
    retur_dus: sum("retur_dus"),
    retur_rp: sum("retur_rp"),
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Global
        </h1>
        <p className="text-gray-600">
          Rekapan penjualan produk per bulan — Stok, Penjualan, Sodaqoh,
          Pribadi, Bonus, Retur, mengikuti format Rekapan Penjualan Produk
          ARROYYAN99
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Nilai Rp pada kolom Sodaqoh, Pribadi, Bonus, dan Retur adalah{" "}
          <b>estimasi</b> (dus × harga dasar produk), karena bukan transaksi
          penjualan sehingga tidak ada nilai Rp asli. Kolom
          Sodaqoh/Pribadi/Bonus baru akan terisi kalau sudah dicatat lewat menu
          Manajemen Stok → Stok Keluar.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Produksi</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.total_produksi_dus)} dus
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totals.penjualan_total_rp)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Sisa Stok (Saat Ini)</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.sisa_stok_dus)} dus
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Keluar</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatDus(totals.total_keluar_dus)} dus
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3">
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
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setExporting(true);
                await exportToPDF(data, periode, totals);
                setExporting(false);
              }}
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
              onClick={async () => {
                setExporting(true);
                await exportToExcel(data, periode);
                setExporting(false);
              }}
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
              Belum ada produk aktif
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th
                      rowSpan={2}
                      className="text-left py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Produk
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Stok Awal
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Produksi
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Keluar
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Sisa Stok
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-1 px-2 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
                    >
                      Cash
                    </th>
                    <th
                      colSpan={2}
                      className="text-center py-1 px-2 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
                    >
                      Bon
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Sodaqoh
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Pribadi
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Bonus
                    </th>
                    <th
                      rowSpan={2}
                      className="text-right py-2 px-2 font-semibold text-gray-700 align-bottom whitespace-nowrap"
                    >
                      Retur
                    </th>
                  </tr>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Dus
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Rp
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Dus
                    </th>
                    <th className="text-right py-1 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                      Rp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.product_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-2 font-medium text-gray-900 whitespace-nowrap">
                        {r.product_name}
                        {r.size ? ` (${r.size})` : ""}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.stok_awal_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.total_produksi_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.total_keluar_dus)}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold">
                        {formatDus(r.sisa_stok_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.penjualan_cash_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatRp(r.penjualan_cash_rp)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.penjualan_bon_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatRp(r.penjualan_bon_rp)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.sodaqoh_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.pribadi_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.bonus_dus)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {formatDus(r.retur_dus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                    <td className="py-3 px-2">TOTAL</td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.stok_awal_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.total_produksi_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.total_keluar_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.sisa_stok_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.penjualan_cash_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatRp(totals.penjualan_cash_rp)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.penjualan_bon_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatRp(totals.penjualan_bon_rp)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.sodaqoh_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.pribadi_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.bonus_dus)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatDus(totals.retur_dus)}
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
