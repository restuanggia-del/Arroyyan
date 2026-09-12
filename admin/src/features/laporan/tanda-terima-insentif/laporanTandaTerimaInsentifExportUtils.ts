import { toast } from "sonner";
import { IncentiveReceipt } from "../../../services/incentiveReceiptService";
import { downloadExcelWorkbook } from "../../../lib/exportExcel";
import { downloadPdfDoc } from "../../../lib/exportPdf";
import { formatRp } from "../../../lib/formatters";

const EMPTY_DESCRIPTION = "Belum ada rekap untuk periode ini.";

export const exportTandaTerimaToExcel = async (
    data: IncentiveReceipt[],
    periode: string,
) => {
    await downloadExcelWorkbook(async (XLSX, wb) => {
        const headers = [
            "Jenis",
            "Nama",
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
            Jenis: r.sales_id ? "Sales" : "Karyawan",
            Nama: r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
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
            rows.length > 0 ? rows : [Object.fromEntries(headers.map((h) => [h, ""]))];
        const ws = XLSX.utils.json_to_sheet(safeRows, { header: headers });
        XLSX.utils.book_append_sheet(wb, ws, "Tanda Terima Insentif");

        if (data.length === 0) {
            toast.info("File Excel diunduh dengan template kosong", {
                description: EMPTY_DESCRIPTION,
            });
        }
    }, `tanda-terima-insentif-${periode}`);
};

export const exportTandaTerimaToPDF = async (
    data: IncentiveReceipt[],
    periode: string,
) => {
    await downloadPdfDoc(async (jsPDF, autoTable) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("ARROYYAN99 — Tanda Terima Insentif", 14, 20);
        doc.setFontSize(10);
        doc.text(`Periode: ${periode}`, 14, 28);

        const tableRows = data.map((r) => [
            r.sales_id ? "Sales" : "Karyawan",
            r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
            formatRp(r.total_produksi),
            formatRp(r.total_fee_penjualan),
            formatRp(r.total_handling),
            formatRp(r.total_fee_rekapan),
            formatRp(r.total_bonus_target),
            formatRp(r.jumlah_total),
            "",
        ]);
        const bodyRows = data.length === 0 ? [Array(9).fill("")] : tableRows;

        autoTable(doc, {
            head: [
                [
                    "Jenis",
                    "Nama",
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
                description: EMPTY_DESCRIPTION,
            });
        }
    });
};
