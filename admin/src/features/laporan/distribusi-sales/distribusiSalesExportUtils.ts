import { formatDate } from "../../../lib/dateUtils";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import {
    DistRow,
    SalesSummary,
    ProductSummary,
    TabId,
    EMPTY_DESCRIPTION,
    statusLabel,
    itemsToText,
} from "./distribusiSalesUtils";

export interface ExportData {
    rows: DistRow[];
    summaryBySales: SalesSummary[];
    summaryByProduct: ProductSummary[];
    startDate: string;
    endDate: string;
}

const PDF_OPTIONS = {
    headColor: [37, 99, 235] as [number, number, number],
    emptyDescription: EMPTY_DESCRIPTION,
};

export async function exportDistribusiSalesExcel(
    tab: TabId,
    d: ExportData,
): Promise<void> {
    const range = `${d.startDate} s/d ${d.endDate}`;
    const suffix = `${d.startDate}-${d.endDate}`;

    if (tab === "rincian") {
        await downloadExcel(
            d.rows.map((r) => ({
                Tanggal: r.date.slice(0, 10),
                "No. Distribusi": r.shortId,
                Sales: r.salesName,
                Produk: itemsToText(r.items),
                "Total Qty": r.totalQty,
                Status: statusLabel[r.status] ?? r.status,
                Keterangan: r.keterangan,
            })),
            ["Tanggal", "No. Distribusi", "Sales", "Produk", "Total Qty", "Status", "Keterangan"],
            `laporan-distribusi-sales-${suffix}`,
            "Distribusi ke Sales",
            EMPTY_DESCRIPTION,
            { title: `Laporan Distribusi ke Sales (${range})` },
        );
    } else if (tab === "per-sales") {
        await downloadExcel(
            d.summaryBySales.map((s, i) => ({
                No: i + 1,
                Sales: s.salesName,
                "Jumlah Distribusi": s.jumlahDistribusi,
                "Total Qty": s.totalQty,
                "Sudah Diterima": s.diterima,
                "Belum Diterima": s.belumDiterima,
            })),
            ["No", "Sales", "Jumlah Distribusi", "Total Qty", "Sudah Diterima", "Belum Diterima"],
            `rekap-distribusi-per-sales-${suffix}`,
            "Rekap per Sales",
            EMPTY_DESCRIPTION,
            { title: `Rekap Distribusi per Sales (${range})` },
        );
    } else {
        await downloadExcel(
            d.summaryByProduct.map((p, i) => ({
                No: i + 1,
                Produk: p.name,
                Kategori: p.category,
                "Total Qty": p.totalQty,
                "Jumlah Distribusi": p.jumlahDistribusi,
            })),
            ["No", "Produk", "Kategori", "Total Qty", "Jumlah Distribusi"],
            `rekap-distribusi-per-produk-${suffix}`,
            "Rekap per Produk",
            EMPTY_DESCRIPTION,
            { title: `Rekap Distribusi per Produk (${range})` },
        );
    }
}

export async function exportDistribusiSalesPdf(
    tab: TabId,
    d: ExportData,
): Promise<void> {
    const range = `${d.startDate} s/d ${d.endDate}`;
    const suffix = `${d.startDate}-${d.endDate}`;

    if (tab === "rincian") {
        await downloadTablePdf(
            `Laporan Distribusi ke Sales (${range})`,
            ["Tanggal", "No.", "Sales", "Produk", "Qty", "Status", "Keterangan"],
            d.rows.map((r) => [
                formatDate(r.date),
                r.shortId,
                r.salesName,
                itemsToText(r.items),
                r.totalQty,
                statusLabel[r.status] ?? r.status,
                r.keterangan,
            ]),
            `laporan-distribusi-sales-${suffix}`,
            PDF_OPTIONS,
        );
    } else if (tab === "per-sales") {
        await downloadTablePdf(
            `Rekap Distribusi per Sales (${range})`,
            ["No", "Sales", "Distribusi", "Total Qty", "Diterima", "Belum Diterima"],
            d.summaryBySales.map((s, i) => [
                i + 1,
                s.salesName,
                s.jumlahDistribusi,
                s.totalQty,
                s.diterima,
                s.belumDiterima,
            ]),
            `rekap-distribusi-per-sales-${suffix}`,
            PDF_OPTIONS,
        );
    } else {
        await downloadTablePdf(
            `Rekap Distribusi per Produk (${range})`,
            ["No", "Produk", "Kategori", "Total Qty", "Distribusi"],
            d.summaryByProduct.map((p, i) => [
                i + 1,
                p.name,
                p.category,
                p.totalQty,
                p.jumlahDistribusi,
            ]),
            `rekap-distribusi-per-produk-${suffix}`,
            PDF_OPTIONS,
        );
    }
}
