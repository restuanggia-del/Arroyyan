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
  Info,
} from "lucide-react";
import {
  getLaporanPenjualan,
  LaporanPenjualanResult,
  ProdukHarianTable,
  SalesColumn,
} from "../../../services/laporanPenjualanService";

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const formatDus = (n: number) =>
  n === 0 ? "—" : n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const currentPeriode = () => new Date().toISOString().slice(0, 7);
const productLabel = (t: { product_name: string; size: string | null }) =>
  `${t.product_name}${t.size ? ` (${t.size})` : ""}`;

const exportToExcel = async (
  data: LaporanPenjualanResult,
  fileName: string,
) => {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    for (const table of data.produk) {
      const header = [
        "Tanggal",
        "Stok Awal",
        "Produksi",
        ...data.sales_columns.map((s) => s.nama),
        "Bonus",
        "Retur",
        "Sodaqoh",
        "Pribadi",
        "Total Keluar",
        "Terjual",
        "Sisa Stock",
        "Jumlah (Rp)",
        "Dibayar (Rp)",
        "Bon (Rp)",
      ];
      const rowsOut = [
        ...table.rows.map((r) => [
          formatDate(r.tanggal),
          r.stok_awal_dus,
          r.produksi_dus,
          ...data.sales_columns.map((s) => r.distribusi[s.actor_id] ?? 0),
          r.bonus_dus,
          r.retur_dus,
          r.sodaqoh_dus,
          r.pribadi_dus,
          r.total_keluar_dus,
          r.terjual_dus,
          r.sisa_stock_dus,
          r.jumlah_rp,
          r.dibayar_rp,
          r.bon_rp,
        ]),
        [
          "TOTAL",
          table.total.stok_awal_dus,
          table.total.produksi_dus,
          ...data.sales_columns.map(
            (s) => table.total.distribusi[s.actor_id] ?? 0,
          ),
          table.total.bonus_dus,
          table.total.retur_dus,
          table.total.sodaqoh_dus,
          table.total.pribadi_dus,
          table.total.total_keluar_dus,
          table.total.terjual_dus,
          table.total.sisa_stock_dus,
          table.total.jumlah_rp,
          table.total.dibayar_rp,
          table.total.bon_rp,
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet([header, ...rowsOut]);
      const sheetName = productLabel(table).slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const setoranAoa: any[][] = [];
    setoranAoa.push(["POTONGAN BBM"]);
    setoranAoa.push(["Tanggal", "Keterangan", "Karyawan", "Jumlah"]);
    data.potongan.bbm.forEach((p) =>
      setoranAoa.push([
        formatDate(p.tanggal),
        p.keterangan ?? "",
        p.nama_karyawan,
        p.jumlah,
      ]),
    );
    setoranAoa.push(["", "", "Total BBM", data.potongan.total_bbm]);
    setoranAoa.push([]);
    setoranAoa.push(["POTONGAN UANG MAKAN"]);
    setoranAoa.push(["Tanggal", "Keterangan", "Karyawan", "Jumlah"]);
    data.potongan.uang_makan.forEach((p) =>
      setoranAoa.push([
        formatDate(p.tanggal),
        p.keterangan ?? "",
        p.nama_karyawan,
        p.jumlah,
      ]),
    );
    setoranAoa.push([
      "",
      "",
      "Total Uang Makan",
      data.potongan.total_uang_makan,
    ]);
    setoranAoa.push([]);
    setoranAoa.push(["POTONGAN LAIN-LAIN"]);
    setoranAoa.push(["Tanggal", "Keterangan", "Karyawan", "Jumlah"]);
    data.potongan.lain_lain.forEach((p) =>
      setoranAoa.push([
        formatDate(p.tanggal),
        p.keterangan ?? "",
        p.nama_karyawan,
        p.jumlah,
      ]),
    );
    setoranAoa.push(["", "", "Total Lain-lain", data.potongan.total_lain_lain]);
    setoranAoa.push([]);
    setoranAoa.push(["PEMBAYARAN VIA TRANSFER"]);
    setoranAoa.push(["Tanggal", "Keterangan", "Jumlah"]);
    data.transfer.items.forEach((t) =>
      setoranAoa.push([formatDate(t.tanggal), t.keterangan, t.jumlah]),
    );
    setoranAoa.push(["", "Total Transfer", data.transfer.total]);
    setoranAoa.push([]);
    setoranAoa.push(["SETORAN KE OWNER"]);
    setoranAoa.push(["Tanggal", "Karyawan", "Keterangan", "Jumlah"]);
    data.setoran_owner.items.forEach((s) =>
      setoranAoa.push([
        formatDate(s.tanggal),
        s.nama_karyawan,
        s.keterangan ?? "",
        s.jumlah,
      ]),
    );
    setoranAoa.push(["", "", "Total Setoran", data.setoran_owner.total]);
    setoranAoa.push([]);
    setoranAoa.push(["TITIP KE TOKO-TOKO"]);
    data.titipan.per_sales.forEach((b) => {
      setoranAoa.push([`Titipan ${b.nama}`]);
      setoranAoa.push(["Tanggal", "Keterangan", "Dus", "Rp"]);
      b.items.forEach((it) =>
        setoranAoa.push([formatDate(it.tanggal), it.keterangan, it.dus, it.rp]),
      );
      setoranAoa.push(["", `Total ${b.nama}`, b.total_dus, b.total_rp]);
      setoranAoa.push([]);
    });
    setoranAoa.push([
      "",
      "TOTAL TITIPAN DAN BON",
      data.titipan.total_dus,
      data.titipan.total_rp,
    ]);
    setoranAoa.push([]);
    setoranAoa.push(["Total Penjualan", data.ringkasan.total_penjualan_rp]);
    setoranAoa.push(["Total Potongan", data.ringkasan.total_potongan_semua]);
    setoranAoa.push(["Sisa Penjualan", data.ringkasan.sisa_penjualan_rp]);
    setoranAoa.push(["Dibulatkan", data.ringkasan.dibulatkan_rp]);

    const wsSetoran = XLSX.utils.aoa_to_sheet(setoranAoa);
    XLSX.utils.book_append_sheet(wb, wsSetoran, "Rincian Setoran");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch {
    toast.error("Gagal export Excel", {
      description: "Jalankan: npm install xlsx",
    });
  }
};

const exportToPDF = async (data: LaporanPenjualanResult, fileName: string) => {
  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    data.produk.forEach((table, idx) => {
      if (idx > 0) doc.addPage();
      doc.setFontSize(12);
      doc.text(`CATATAN PENJUALAN — ${productLabel(table)}`, 14, 14);
      doc.setFontSize(9);
      doc.text(`Periode: ${data.periode}`, 14, 20);

      const head = [
        "Tanggal",
        "Awal",
        "Prod.",
        ...data.sales_columns.map((s) => s.nama),
        "Bonus",
        "Retur",
        "Sdq",
        "Prb",
        "Keluar",
        "Terjual",
        "Sisa",
        "Jumlah Rp",
        "Dibayar",
        "Bon",
      ];
      const body =
        table.rows.length === 0
          ? [Array(head.length).fill("")]
          : table.rows.map((r) => [
              formatDate(r.tanggal),
              formatDus(r.stok_awal_dus),
              formatDus(r.produksi_dus),
              ...data.sales_columns.map((s) =>
                formatDus(r.distribusi[s.actor_id] ?? 0),
              ),
              formatDus(r.bonus_dus),
              formatDus(r.retur_dus),
              formatDus(r.sodaqoh_dus),
              formatDus(r.pribadi_dus),
              formatDus(r.total_keluar_dus),
              formatDus(r.terjual_dus),
              formatDus(r.sisa_stock_dus),
              formatRp(r.jumlah_rp),
              formatRp(r.dibayar_rp),
              formatRp(r.bon_rp),
            ]);
      body.push([
        "TOTAL",
        formatDus(table.total.stok_awal_dus),
        formatDus(table.total.produksi_dus),
        ...data.sales_columns.map((s) =>
          formatDus(table.total.distribusi[s.actor_id] ?? 0),
        ),
        formatDus(table.total.bonus_dus),
        formatDus(table.total.retur_dus),
        formatDus(table.total.sodaqoh_dus),
        formatDus(table.total.pribadi_dus),
        formatDus(table.total.total_keluar_dus),
        formatDus(table.total.terjual_dus),
        formatDus(table.total.sisa_stock_dus),
        formatRp(table.total.jumlah_rp),
        formatRp(table.total.dibayar_rp),
        formatRp(table.total.bon_rp),
      ]);

      autoTable(doc, {
        head: [head],
        body,
        startY: 25,
        styles: { fontSize: 6, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 64, 175] },
      });
    });

    doc.addPage();
    doc.setFontSize(12);
    doc.text("RINCIAN SETORAN & POTONGAN", 14, 14);
    doc.setFontSize(9);
    doc.text(`Periode: ${data.periode}`, 14, 20);

    let y = 26;
    const section = (
      title: string,
      rows: string[][],
      totalLabel: string,
      total: number,
    ) => {
      autoTable(doc, {
        head: [[title, "", ""]],
        body: rows.length > 0 ? rows : [["-", "", ""]],
        foot: [[totalLabel, "", formatRp(total)]],
        startY: y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [55, 65, 81] },
        footStyles: {
          fillColor: [254, 240, 138],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    };

    section(
      "Potongan BBM",
      data.potongan.bbm.map((p) => [
        formatDate(p.tanggal),
        `${p.keterangan ?? ""} (${p.nama_karyawan})`,
        formatRp(p.jumlah),
      ]),
      "Total Potongan BBM",
      data.potongan.total_bbm,
    );
    section(
      "Potongan Uang Makan",
      data.potongan.uang_makan.map((p) => [
        formatDate(p.tanggal),
        `${p.keterangan ?? ""} (${p.nama_karyawan})`,
        formatRp(p.jumlah),
      ]),
      "Total Uang Makan",
      data.potongan.total_uang_makan,
    );
    section(
      "Potongan Lain-lain",
      data.potongan.lain_lain.map((p) => [
        formatDate(p.tanggal),
        `${p.keterangan ?? ""} (${p.nama_karyawan})`,
        formatRp(p.jumlah),
      ]),
      "Total Lain-lain",
      data.potongan.total_lain_lain,
    );
    section(
      "Pembayaran via Transfer",
      data.transfer.items.map((t) => [
        formatDate(t.tanggal),
        t.keterangan,
        formatRp(t.jumlah),
      ]),
      "Total Transfer",
      data.transfer.total,
    );
    section(
      "Setoran ke Owner",
      data.setoran_owner.items.map((s) => [
        formatDate(s.tanggal),
        `${s.nama_karyawan}${s.keterangan ? " — " + s.keterangan : ""}`,
        formatRp(s.jumlah),
      ]),
      "Total Setoran",
      data.setoran_owner.total,
    );
    for (const b of data.titipan.per_sales) {
      section(
        `Titip ke Toko — ${b.nama}`,
        b.items.map((it) => [
          formatDate(it.tanggal),
          `${it.keterangan} (${formatDus(it.dus)} dus)`,
          formatRp(it.rp),
        ]),
        `Total ${b.nama}`,
        b.total_rp,
      );
    }

    autoTable(doc, {
      body: [
        ["Total Penjualan", formatRp(data.ringkasan.total_penjualan_rp)],
        ["Total Potongan", formatRp(data.ringkasan.total_potongan_semua)],
        ["Sisa Penjualan", formatRp(data.ringkasan.sisa_penjualan_rp)],
        ["Dibulatkan", formatRp(data.ringkasan.dibulatkan_rp)],
      ],
      startY: y,
      styles: { fontSize: 10, fontStyle: "bold" },
      theme: "grid",
    });

    doc.save(`${fileName}.pdf`);
  } catch {
    toast.error("Gagal export PDF", {
      description: "Jalankan: npm install jspdf jspdf-autotable",
    });
  }
};

function ProdukTableCard({
  table,
  salesColumns,
}: {
  table: ProdukHarianTable;
  salesColumns: SalesColumn[];
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          Catatan Penjualan — {productLabel(table)}
        </h3>
      </div>
      {table.rows.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          Tidak ada aktivitas produk ini pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="text-left py-2 px-3 font-semibold">Tanggal</th>
                <th className="text-right py-2 px-3 font-semibold">
                  Stok Awal
                </th>
                <th className="text-right py-2 px-3 font-semibold">Produksi</th>
                {salesColumns.map((s) => (
                  <th
                    key={s.actor_id}
                    className="text-right py-2 px-3 font-semibold"
                  >
                    {s.nama}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-semibold">Bonus</th>
                <th className="text-right py-2 px-3 font-semibold">Retur</th>
                <th className="text-right py-2 px-3 font-semibold">Sodaqoh</th>
                <th className="text-right py-2 px-3 font-semibold">Pribadi</th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Tot. Keluar
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Terjual
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Sisa Stock
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Jumlah (Rp)
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Dibayar
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Bon
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr
                  key={r.tanggal}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 px-3 text-gray-600">
                    {formatDate(r.tanggal)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.stok_awal_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.produksi_dus)}
                  </td>
                  {salesColumns.map((s) => (
                    <td key={s.actor_id} className="py-2 px-3 text-right">
                      {formatDus(r.distribusi[s.actor_id] ?? 0)}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.bonus_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.retur_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.sodaqoh_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.pribadi_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.total_keluar_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.terjual_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.sisa_stock_dus)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.jumlah_rp)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.dibayar_rp)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.bon_rp)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="py-2.5 px-3">TOTAL</td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.stok_awal_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.produksi_dus)}
                </td>
                {salesColumns.map((s) => (
                  <td key={s.actor_id} className="py-2.5 px-3 text-right">
                    {formatDus(table.total.distribusi[s.actor_id] ?? 0)}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.bonus_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.retur_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.sodaqoh_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.pribadi_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.total_keluar_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.terjual_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.sisa_stock_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.jumlah_rp)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.dibayar_rp)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.bon_rp)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function ItemBox({
  title,
  totalLabel,
  total,
  rows,
  emptyText,
}: {
  title: string;
  totalLabel: string;
  total: number;
  rows: { left: string; right: string; jumlah: number }[];
  emptyText: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-4 py-3">{emptyText}</p>
        ) : (
          rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">{r.left}</p>
                <p className="text-xs text-gray-400 truncate">{r.right}</p>
              </div>
              <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                {formatRp(r.jumlah)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
        <span className="text-sm font-bold text-gray-800">{totalLabel}</span>
        <span className="text-sm font-bold text-gray-900">
          {formatRp(total)}
        </span>
      </div>
    </div>
  );
}

function DetailHarianTab({
  data,
  loading,
}: {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat laporan...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Gagal memuat data
      </p>
    );
  }
  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Kolom nama sales menampilkan dus yang didistribusikan ke sales
          tersebut per hari. Tot. Keluar juga mencakup penjualan langsung dari
          stok pusat. Kolom Sisa Stock harian adalah kalkulasi berjalan (stok
          awal + produksi − keluar); baris TOTAL memakai stok gudang saat ini
          supaya sinkron dengan Laporan Global.
        </p>
      </div>
      {data.produk.every((p) => p.rows.length === 0) ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada aktivitas produk pada periode ini
        </p>
      ) : (
        data.produk.map((table) => (
          <ProdukTableCard
            key={table.product_id}
            table={table}
            salesColumns={data.sales_columns}
          />
        ))
      )}
    </div>
  );
}

function RincianSetoranTab({
  data,
  loading,
}: {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat laporan...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Gagal memuat data
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <ItemBox
        title="Potongan BBM"
        totalLabel="Total Potongan BBM"
        total={data.potongan.total_bbm}
        emptyText="Tidak ada potongan BBM bulan ini."
        rows={data.potongan.bbm.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Potongan Uang Makan"
        totalLabel="Total Uang Makan"
        total={data.potongan.total_uang_makan}
        emptyText="Tidak ada potongan uang makan bulan ini."
        rows={data.potongan.uang_makan.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Potongan Lain-lain"
        totalLabel="Total Lain-lain"
        total={data.potongan.total_lain_lain}
        emptyText="Tidak ada potongan lain-lain bulan ini."
        rows={data.potongan.lain_lain.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Pembayaran via Transfer"
        totalLabel="Total Transfer"
        total={data.transfer.total}
        emptyText="Tidak ada pembayaran via transfer bulan ini."
        rows={data.transfer.items.map((t) => ({
          left: t.keterangan,
          right: formatDate(t.tanggal),
          jumlah: t.jumlah,
        }))}
      />
      <ItemBox
        title="Setoran ke Owner"
        totalLabel="Total Setoran"
        total={data.setoran_owner.total}
        emptyText="Belum ada setoran ke owner bulan ini."
        rows={data.setoran_owner.items.map((s) => ({
          left: s.keterangan || s.nama_karyawan,
          right: `${formatDate(s.tanggal)} · ${s.nama_karyawan}`,
          jumlah: s.jumlah,
        }))}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Titip ke Toko-toko / Bon Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Otomatis dari transaksi titipan (kasbon) yang dibuat pada periode
            ini.
          </p>
        </div>
        {data.titipan.per_sales.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-4 py-3">
            Tidak ada transaksi titipan bulan ini.
          </p>
        ) : (
          data.titipan.per_sales.map((b) => (
            <div
              key={b.actor_id}
              className="border-b border-gray-100 last:border-b-0"
            >
              <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  Titipan {b.nama}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDus(b.total_dus)} dus · {formatRp(b.total_rp)}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {b.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-1.5"
                  >
                    <span className="text-xs text-gray-600">
                      {formatDate(it.tanggal)} — {it.keterangan}
                    </span>
                    <span className="text-xs text-gray-800">
                      {formatDus(it.dus)} dus · {formatRp(it.rp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <span className="text-sm font-bold text-gray-800">
            TOTAL TITIPAN DAN BON
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatDus(data.titipan.total_dus)} dus ·{" "}
            {formatRp(data.titipan.total_rp)}
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 mt-6">
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-600">Total Penjualan</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatRp(data.ringkasan.total_penjualan_rp)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-orange-50">
            <span className="text-sm text-gray-700">Total Potongan</span>
            <span className="text-sm font-semibold text-orange-700">
              {formatRp(data.ringkasan.total_potongan_semua)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-yellow-100">
            <span className="text-sm font-bold text-gray-800">
              Sisa Penjualan
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatRp(data.ringkasan.sisa_penjualan_rp)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-4 bg-green-500">
            <span className="font-bold text-white">Dibulatkan</span>
            <span className="font-bold text-white text-lg">
              {formatRp(data.ringkasan.dibulatkan_rp)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 px-1 pt-2">
        Total Potongan = Potongan (BBM + Uang Makan + Lain-lain) + Pembayaran
        via Transfer + Setoran ke Owner + Titip ke Toko-toko/Bon bulan ini. Sisa
        Penjualan = Total Penjualan − Total Potongan.
      </p>
    </div>
  );
}

function KomisiSetoranSalesTab({
  data,
  loading,
}: {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat laporan...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Gagal memuat data
      </p>
    );
  }

  const totalSetoranSales =
    data.setoran_sales.total_cash + data.setoran_sales.total_transfer;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Komisi Sales Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Dihitung otomatis dari selisih harga jual sales vs harga pabrik, per
            transaksi.
          </p>
        </div>
        {data.komisi_sales.rows.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-5 py-4">
            Belum ada transaksi sales pada periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                  <th className="text-left py-2.5 px-4 font-semibold">Sales</th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Dus Terjual
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Omzet (Harga Pabrik)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Omzet (Harga Jual)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold bg-green-50">
                    Komisi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.komisi_sales.rows.map((r) => (
                  <tr
                    key={r.sales_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-4 font-medium text-gray-900">
                      {r.nama_sales}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {formatDus(r.total_dus_terjual)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {formatRp(r.total_omzet_pabrik)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {formatRp(r.total_omzet_jual)}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-semibold bg-green-50/50 ${
                        r.total_komisi >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {formatRp(r.total_komisi)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-2.5 px-4" colSpan={4}>
                    TOTAL KOMISI SALES
                  </td>
                  <td className="py-2.5 px-4 text-right bg-green-100 text-green-800">
                    {formatRp(data.komisi_sales.total_komisi)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400 px-5 py-3 border-t border-gray-100">
          Catatan: laporan omzet resmi perusahaan (di tab "Detail Harian per
          Produk" &amp; "Rincian Setoran") menggunakan kolom Omzet (Harga
          Pabrik) di atas — bukan harga jual sales.
        </p>
      </div>

      <ItemBox
        title="Setoran Sales ke Admin"
        totalLabel="Total Setoran (Cash + Transfer)"
        total={totalSetoranSales}
        emptyText="Belum ada setoran sales bulan ini."
        rows={data.setoran_sales.items.map((s) => ({
          left: s.keterangan || s.nama_sales,
          right: `${formatDate(s.tanggal)} · ${s.nama_sales} · Cash ${formatRp(s.jumlah_cash)} / Transfer ${formatRp(s.jumlah_transfer)}`,
          jumlah: s.jumlah_cash + s.jumlah_transfer,
        }))}
      />
    </div>
  );
}

export function LaporanSales() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [activeTab, setActiveTab] = useState<"harian" | "setoran" | "komisi">(
    "harian",
  );
  const [data, setData] = useState<LaporanPenjualanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getLaporanPenjualan(p);
    if (error)
      setError("Gagal memuat laporan penjualan: " + (error as any).message);
    setData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const totalPenjualanCard = data?.ringkasan.total_penjualan_rp ?? 0;
  const totalPotonganCard = data?.ringkasan.total_potongan_semua ?? 0;
  const sisaCard = data?.ringkasan.sisa_penjualan_rp ?? 0;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Laporan Penjualan
          </h1>
          <p className="text-gray-600">
            Rincian harian per produk (semua sales) beserta potongan, transfer,
            setoran, dan titipan — mengikuti format Laporan Hasil Penjualan Air
            Mineral ARROYYAN99. Totalnya sinkron dengan Laporan Global.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bulan
            </label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="text-sm focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!data) return;
              setExportingType("pdf");
              try {
                await exportToPDF(data, `laporan-penjualan-${periode}`);
              } finally {
                setExportingType(null);
              }
            }}
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
            onClick={async () => {
              if (!data) return;
              setExportingType("excel");
              try {
                await exportToExcel(data, `laporan-penjualan-${periode}`);
              } finally {
                setExportingType(null);
              }
            }}
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalPenjualanCard)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Potongan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(totalPotonganCard)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Sisa Penjualan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : formatRp(sisaCard)}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "harian", label: "Detail Harian per Produk" },
          { id: "setoran", label: "Rincian Setoran & Potongan" },
          { id: "komisi", label: "Komisi & Setoran Sales" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id as "harian" | "setoran" | "komisi")
            }
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

      {activeTab === "harian" ? (
        <DetailHarianTab data={data} loading={loading} />
      ) : activeTab === "setoran" ? (
        <RincianSetoranTab data={data} loading={loading} />
      ) : (
        <KomisiSetoranSalesTab data={data} loading={loading} />
      )}
    </div>
  );
}
