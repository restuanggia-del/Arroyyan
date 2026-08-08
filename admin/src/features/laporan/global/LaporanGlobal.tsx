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
import {
  getRekapanSetoran,
  RekapanSetoran,
} from "../../../services/rekapanSetoranService";

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDus = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const currentPeriode = () => new Date().toISOString().slice(0, 7);

const exportToExcel = async (data: LaporanGlobalRow[], periode: string) => {
  try {
    const XLSX = await import("xlsx");
    const headers = [
      "Produk",
      "Stok Awal (Dus)",
      "Total Produksi (Dus)",
      "Total Keluar (Dus)",
      "Sisa Stok (Dus)",
      "Cash (Dus)",
      "Cash (Rp)",
      "Bon (Dus)",
      "Bon (Rp)",
      "Tot. Penjualan (Dus)",
      "Tot. Penjualan (Rp)",
      "Sodaqoh (Dus)",
      "Sodaqoh (Rp est.)",
      "Pribadi (Dus)",
      "Pribadi (Rp est.)",
      "Bonus (Dus)",
      "Bonus (Rp est.)",
      "Retur (Dus)",
      "Retur (Rp est.)",
    ];
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
    const safeRows =
      rows.length > 0
        ? rows
        : [Object.fromEntries(headers.map((h) => [h, ""]))];
    const ws = XLSX.utils.json_to_sheet(safeRows, { header: headers });
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

    const tableRows = [
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
    ];
    const bodyRows = data.length === 0 ? [Array(13).fill("")] : tableRows;

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
      body: bodyRows,
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

function RekapProdukTab() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<LaporanGlobalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
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
    <div>
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
                setExportingType("pdf");
                try {
                  await exportToPDF(data, periode, totals);
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

function RekapanSetoranTab() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<RekapanSetoran | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getRekapanSetoran(p);
    if (error)
      setError("Gagal memuat rekapan setoran: " + (error as any).message);
    setData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const handleExportPDF = async () => {
    if (!data) return;
    setExportingType("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`REKAPAN SETORAN PERIODE ${periode}`, 14, 18);

      let y = 28;
      doc.setFontSize(11);
      doc.text("Hasil Penjualan & Pembayaran Titipan", 14, y);
      autoTable(doc, {
        body: [
          [`Penjualan Bulan ${periode}`, formatRp(data.penjualan_bulan_ini)],
          ...data.titipan_lama.map((t) => [
            `Titipan Bulan ${t.periode_asal}`,
            formatRp(t.jumlah),
          ]),
          ["TOTAL DANA", formatRp(data.total_dana)],
        ],
        startY: y + 4,
        styles: { fontSize: 9 },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.text("Potongan", 14, y);
      autoTable(doc, {
        body: [
          ...data.potongan.map((p) => [p.label, formatRp(p.jumlah)]),
          ["TOTAL POTONGAN", formatRp(data.total_potongan)],
        ],
        startY: y + 4,
        styles: { fontSize: 9 },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.text(`Titipan/Bon Sales Bulan ${periode} (belum collect)`, 14, y);
      autoTable(doc, {
        body: [
          ...data.titipan_sales_bulan_ini.map((t) => [
            t.nama,
            formatRp(t.jumlah),
          ]),
          ["TOTAL", formatRp(data.total_titipan_sales)],
        ],
        startY: y + 4,
        styles: { fontSize: 9 },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.text("Insentif", 14, y);
      autoTable(doc, {
        body: [
          ["Insentif Produksi", formatRp(data.insentif.total_produksi)],
          ["Fee Penjualan", formatRp(data.insentif.total_fee_penjualan)],
          ["Handling", formatRp(data.insentif.total_handling)],
          ["Fee Rekapan", formatRp(data.insentif.total_fee_rekapan)],
          ["Bonus Target", formatRp(data.insentif.total_bonus_target)],
          ["TOTAL INSENTIF", formatRp(data.insentif.total_insentif)],
        ],
        startY: y + 4,
        styles: { fontSize: 9 },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.text("Pembayaran via Transfer", 14, y);
      autoTable(doc, {
        body: [
          [`Penjualan Bulan ${periode}`, formatRp(data.transfer_penjualan)],
          ...data.transfer_titipan.map((t) => [
            `${formatDate(t.tanggal_bayar)} — ${t.nama}`,
            formatRp(t.jumlah_transfer),
          ]),
          ["TOTAL TRANSFER", formatRp(data.total_transfer)],
        ],
        startY: y + 4,
        styles: { fontSize: 9 },
        theme: "grid",
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text(
        `SISA DANA PENJUALAN: ${formatRp(data.sisa_dana_penjualan)}`,
        14,
        y + 4,
      );

      doc.save(`rekapan-setoran-${periode}.pdf`);
    } catch {
      toast.error("Gagal export PDF", {
        description: "Jalankan: npm install jspdf jspdf-autotable",
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data) return;
    setExportingType("excel");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const danaRows = [
        {
          Keterangan: `Penjualan Bulan ${periode}`,
          Jumlah: data.penjualan_bulan_ini,
        },
        ...data.titipan_lama.map((t) => ({
          Keterangan: `Titipan Bulan ${t.periode_asal}`,
          Jumlah: t.jumlah,
        })),
        { Keterangan: "TOTAL DANA", Jumlah: data.total_dana },
        {},
        { Keterangan: "-- POTONGAN --", Jumlah: "" },
        ...data.potongan.map((p) => ({
          Keterangan: p.label,
          Jumlah: p.jumlah,
        })),
        { Keterangan: "TOTAL POTONGAN", Jumlah: data.total_potongan },
        {},
        { Keterangan: `-- TITIPAN/BON SALES BULAN ${periode} --`, Jumlah: "" },
        ...data.titipan_sales_bulan_ini.map((t) => ({
          Keterangan: t.nama,
          Jumlah: t.jumlah,
        })),
        { Keterangan: "TOTAL", Jumlah: data.total_titipan_sales },
        {},
        { Keterangan: "-- INSENTIF --", Jumlah: "" },
        {
          Keterangan: "Insentif Produksi",
          Jumlah: data.insentif.total_produksi,
        },
        {
          Keterangan: "Fee Penjualan",
          Jumlah: data.insentif.total_fee_penjualan,
        },
        { Keterangan: "Handling", Jumlah: data.insentif.total_handling },
        { Keterangan: "Fee Rekapan", Jumlah: data.insentif.total_fee_rekapan },
        {
          Keterangan: "Bonus Target",
          Jumlah: data.insentif.total_bonus_target,
        },
        { Keterangan: "TOTAL INSENTIF", Jumlah: data.insentif.total_insentif },
        {},
        { Keterangan: "-- PEMBAYARAN VIA TRANSFER --", Jumlah: "" },
        {
          Keterangan: `Penjualan Bulan ${periode}`,
          Jumlah: data.transfer_penjualan,
        },
        ...data.transfer_titipan.map((t) => ({
          Keterangan: `${t.tanggal_bayar} — ${t.nama}`,
          Jumlah: t.jumlah_transfer,
        })),
        { Keterangan: "TOTAL TRANSFER", Jumlah: data.total_transfer },
        {},
        { Keterangan: "SISA DANA PENJUALAN", Jumlah: data.sisa_dana_penjualan },
      ];

      const ws = XLSX.utils.json_to_sheet(danaRows, {
        header: ["Keterangan", "Jumlah"],
      });
      XLSX.utils.book_append_sheet(wb, ws, "Rekapan Setoran");
      XLSX.writeFile(wb, `rekapan-setoran-${periode}.xlsx`);
    } catch {
      toast.error("Gagal export Excel", {
        description: "Jalankan: npm install xlsx",
      });
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
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
              onClick={handleExportPDF}
              disabled={
                loading ||
                !data ||
                (exportingType !== null && exportingType !== "pdf")
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
                loading ||
                !data ||
                (exportingType !== null && exportingType !== "excel")
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
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      ) : !data ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Gagal memuat data
        </p>
      ) : (
        <div className="space-y-6">
          <SetoranBox
            title="Hasil Penjualan & Pembayaran Titipan"
            totalLabel="TOTAL DANA"
            total={data.total_dana}
          >
            <SetoranRow
              label={`Penjualan Bulan ${periode}`}
              value={data.penjualan_bulan_ini}
            />
            {data.titipan_lama.map((t) => (
              <SetoranRow
                key={t.periode_asal}
                label={`Titipan Bulan ${t.periode_asal}`}
                value={t.jumlah}
              />
            ))}
            {data.titipan_lama.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada pembayaran titipan lama bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title="Pembayaran via Transfer"
            totalLabel="TOTAL TRANSFER"
            total={data.total_transfer}
          >
            <SetoranRow
              label={`Penjualan Bulan ${periode}`}
              value={data.transfer_penjualan}
            />
            {data.transfer_titipan.map((t, i) => (
              <SetoranRow
                key={i}
                label={`${formatDate(t.tanggal_bayar)} — Titipan ${t.nama}`}
                value={t.jumlah_transfer}
              />
            ))}
            {data.transfer_titipan.length === 0 &&
              data.transfer_penjualan === 0 && (
                <p className="text-xs text-gray-400 italic px-4 py-2">
                  Tidak ada pembayaran via transfer bulan ini.
                </p>
              )}
          </SetoranBox>

          <SetoranBox
            title="Potongan"
            totalLabel="TOTAL POTONGAN"
            total={data.total_potongan}
          >
            {data.potongan.map((p) => (
              <SetoranRow key={p.kategori} label={p.label} value={p.jumlah} />
            ))}
            {data.potongan.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada potongan bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title={`Titipan/Bon Sales Bulan ${periode} (belum collect)`}
            totalLabel="TOTAL"
            total={data.total_titipan_sales}
          >
            {data.titipan_sales_bulan_ini.map((t) => (
              <SetoranRow key={t.karyawan_id} label={t.nama} value={t.jumlah} />
            ))}
            {data.titipan_sales_bulan_ini.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada titipan/bon baru bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title="Insentif"
            totalLabel="TOTAL INSENTIF"
            total={data.insentif.total_insentif}
          >
            <SetoranRow
              label="Insentif Produksi"
              value={data.insentif.total_produksi}
            />
            <SetoranRow
              label="Fee Penjualan"
              value={data.insentif.total_fee_penjualan}
            />
            <SetoranRow label="Handling" value={data.insentif.total_handling} />
            <SetoranRow
              label="Fee Rekapan"
              value={data.insentif.total_fee_rekapan}
            />
            <SetoranRow
              label="Bonus Target"
              value={data.insentif.total_bonus_target}
            />
          </SetoranBox>

          <div className="rounded-xl overflow-hidden border-2 border-green-300">
            <div className="bg-green-500 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-lg">SISA DANA PENJUALAN</span>
              <span className="font-bold text-xl">
                {formatRp(data.sisa_dana_penjualan)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 px-1">
            Sisa Dana Penjualan = Total Dana − Potongan − Titipan/Bon baru bulan
            ini (belum collect) − Total Insentif − Pembayaran via Transfer. Ini
            proyeksi otomatis dari data yang sudah tersimpan, bukan pengganti
            pencatatan setoran aktual di menu Potongan &amp; Setoran.
          </p>
        </div>
      )}
    </div>
  );
}

function SetoranBox({
  title,
  totalLabel,
  total,
  children,
}: {
  title: string;
  totalLabel: string;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
        <span className="text-sm font-bold text-gray-800">{totalLabel}</span>
        <span className="text-sm font-bold text-gray-900">
          {formatRp(total)}
        </span>
      </div>
    </div>
  );
}

function SetoranRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">
        {formatRp(value)}
      </span>
    </div>
  );
}

export function LaporanGlobal() {
  const [activeTab, setActiveTab] = useState<"produk" | "setoran">("produk");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Global
        </h1>
        <p className="text-gray-600">
          Rekap stok &amp; penjualan per produk, dan proyeksi sisa dana
          penjualan per bulan
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "produk", label: "Rekap Produk" },
          { id: "setoran", label: "Rekapan Setoran" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "produk" | "setoran")}
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

      {activeTab === "produk" ? <RekapProdukTab /> : <RekapanSetoranTab />}
    </div>
  );
}
