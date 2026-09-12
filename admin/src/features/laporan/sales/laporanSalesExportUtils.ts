import { LaporanPenjualanResult } from "../../../services/laporanPenjualanService";
import { downloadExcelWorkbook } from "../../../lib/exportExcel";
import { downloadPdfDoc } from "../../../lib/exportPdf";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp, formatDus } from "../../../lib/formatters";
import { productLabel } from "../sales/laporanSalesShared";

export const exportLaporanSalesToExcel = async (
    data: LaporanPenjualanResult,
    fileName: string,
) => {
    await downloadExcelWorkbook((XLSX, wb) => {
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
    }, fileName);
};

export const exportLaporanSalesToPDF = async (
    data: LaporanPenjualanResult,
    fileName: string,
) => {
    await downloadPdfDoc(async (jsPDF, autoTable) => {
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
        const section = (title: string, rows: string[][], totalLabel: string, total: number) => {
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
    });
};
