import { LaporanGlobalRow } from "../../../services/laporanGlobalService";
import { RekapanSetoran } from "../../../services/rekapanSetoranService";
import { downloadExcel, downloadExcelWorkbook } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import { downloadPdfDoc } from "../../../lib/exportPdf";
import { formatDus } from "../../../lib/formatters";
import { formatRp } from "../../../lib/formatters";
import { formatDate } from "../../../lib/dateUtils";

const EMPTY_DESCRIPTION = "Tidak ada data pada periode yang dipilih.";

export const exportRekapProdukToExcel = async (
    data: LaporanGlobalRow[],
    periode: string,
) => {
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

    await downloadExcel(
        data.map((r) => ({
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
        })),
        headers,
        `laporan-global-${periode}`,
        "Laporan Global",
        EMPTY_DESCRIPTION,
    );
};

export const exportRekapProdukToPDF = async (
    data: LaporanGlobalRow[],
    periode: string,
    totals: Record<string, number>,
) => {
    const dataRows = data.map((r) => [
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
    ]);

    const totalRow = [
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
    ];

    await downloadTablePdf(
        `REKAPAN PENJUALAN PRODUK ARROYYAN99 — Periode: ${periode}`,
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
        data.length > 0 ? [...dataRows, totalRow] : dataRows,
        `laporan-global-${periode}`,
        {
            headColor: [30, 64, 175],
            emptyDescription: EMPTY_DESCRIPTION,
            orientation: "landscape",
        },
    );
};

export const exportRekapanSetoranToPDF = async (
    data: RekapanSetoran,
    periode: string,
) => {
    await downloadPdfDoc(async (jsPDF, autoTable) => {
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
                ...data.titipan_sales_bulan_ini.map((t) => [t.nama, formatRp(t.jumlah)]),
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
        doc.text(`SISA DANA PENJUALAN: ${formatRp(data.sisa_dana_penjualan)}`, 14, y + 4);

        doc.save(`rekapan-setoran-${periode}.pdf`);
    });
};

export const exportRekapanSetoranToExcel = async (
    data: RekapanSetoran,
    periode: string,
) => {
    await downloadExcelWorkbook((XLSX, wb) => {
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
            ...data.potongan.map((p) => ({ Keterangan: p.label, Jumlah: p.jumlah })),
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
            { Keterangan: "Insentif Produksi", Jumlah: data.insentif.total_produksi },
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
    }, `rekapan-setoran-${periode}`);
};
