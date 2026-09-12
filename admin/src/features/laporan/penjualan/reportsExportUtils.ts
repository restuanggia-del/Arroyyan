import {
    SalesReportRow,
    DistributionReportRow,
    TopProduct,
    StockReportRow,
} from "../../../services/reportService";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import { formatRp } from "../../../lib/formatters";

export type ReportType = "sales" | "distribution" | "topProducts" | "stock";

const EMPTY_DESCRIPTION = "Tidak ada data pada periode/filter yang dipilih.";

interface ReportDataset {
    salesData: SalesReportRow[];
    distData: DistributionReportRow[];
    topData: TopProduct[];
    stockData: StockReportRow[];
}

interface ReportDateRange {
    startDate: string;
    endDate: string;
    today: string;
}

export const exportReportToExcel = async (
    activeReport: ReportType,
    data: ReportDataset,
    range: ReportDateRange,
) => {
    const { salesData, distData, topData, stockData } = data;
    const { startDate, endDate, today } = range;

    if (activeReport === "sales") {
        await downloadExcel(
            salesData.map((r) => ({
                Tanggal: r.date,
                "No.": r.id,
                Pelanggan: r.customer,
                Karyawan: r.karyawan,
                Produk: r.items,
                Total: r.total,
                Pembayaran: r.payment,
            })),
            ["Tanggal", "No.", "Pelanggan", "Karyawan", "Produk", "Total", "Pembayaran"],
            `ringkasan-transaksi-${startDate}-${endDate}`,
            "Laporan",
            EMPTY_DESCRIPTION,
        );
    } else if (activeReport === "distribution") {
        await downloadExcel(
            distData.map((r) => ({
                Tanggal: r.date,
                "No.": r.id,
                Karyawan: r.karyawan,
                Produk: r.items,
                "Total Qty": r.totalQty,
                Status: r.status,
            })),
            ["Tanggal", "No.", "Karyawan", "Produk", "Total Qty", "Status"],
            `laporan-distribusi-${startDate}-${endDate}`,
            "Laporan",
            EMPTY_DESCRIPTION,
        );
    } else if (activeReport === "topProducts") {
        await downloadExcel(
            topData.map((r, i) => ({
                Peringkat: i + 1,
                Produk: r.product_name,
                Kategori: r.category,
                "Total Terjual": r.totalSold,
                Pendapatan: r.revenue,
            })),
            ["Peringkat", "Produk", "Kategori", "Total Terjual", "Pendapatan"],
            "laporan-produk-terlaris",
            "Laporan",
            EMPTY_DESCRIPTION,
        );
    } else {
        await downloadExcel(
            stockData.map((r) => ({
                Produk: r.product_name,
                Kategori: r.category,
                "Stok Pusat": r.stockPusat,
                "Stok Karyawan": r.stockKaryawan,
                Total: r.total,
                Minimum: r.minimum,
                Status: r.status,
            })),
            [
                "Produk",
                "Kategori",
                "Stok Pusat",
                "Stok Karyawan",
                "Total",
                "Minimum",
                "Status",
            ],
            `laporan-stok-${today}`,
            "Laporan",
            EMPTY_DESCRIPTION,
        );
    }
};

export const exportReportToPDF = async (
    activeReport: ReportType,
    data: ReportDataset,
    range: ReportDateRange,
) => {
    const { salesData, distData, topData, stockData } = data;
    const { startDate, endDate, today } = range;

    if (activeReport === "sales") {
        await downloadTablePdf(
            `Ringkasan Transaksi Penjualan (${startDate} s/d ${endDate})`,
            ["Tanggal", "No.", "Pelanggan", "Karyawan", "Produk", "Total", "Bayar"],
            salesData.map((r) => [
                r.date,
                r.id,
                r.customer,
                r.karyawan,
                r.items,
                formatRp(r.total),
                r.payment,
            ]),
            `ringkasan-transaksi-${startDate}-${endDate}`,
            { headColor: [37, 99, 235], emptyDescription: EMPTY_DESCRIPTION },
        );
    } else if (activeReport === "distribution") {
        await downloadTablePdf(
            `Laporan Distribusi (${startDate} s/d ${endDate})`,
            ["Tanggal", "No.", "Karyawan", "Produk", "Qty", "Status"],
            distData.map((r) => [
                r.date,
                r.id,
                r.karyawan,
                r.items,
                r.totalQty,
                r.status,
            ]),
            `laporan-distribusi-${startDate}-${endDate}`,
            { headColor: [37, 99, 235], emptyDescription: EMPTY_DESCRIPTION },
        );
    } else if (activeReport === "topProducts") {
        await downloadTablePdf(
            "Laporan Produk Terlaris",
            ["No", "Produk", "Kategori", "Terjual", "Pendapatan"],
            topData.map((r, i) => [
                i + 1,
                r.product_name,
                r.category,
                r.totalSold,
                formatRp(r.revenue),
            ]),
            "laporan-produk-terlaris",
            { headColor: [37, 99, 235], emptyDescription: EMPTY_DESCRIPTION },
        );
    } else {
        await downloadTablePdf(
            `Laporan Stok (${today})`,
            ["Produk", "Kategori", "Pusat", "Karyawan", "Total", "Min", "Status"],
            stockData.map((r) => [
                r.product_name,
                r.category,
                r.stockPusat,
                r.stockKaryawan,
                r.total,
                r.minimum,
                r.status,
            ]),
            `laporan-stok-${today}`,
            { headColor: [37, 99, 235], emptyDescription: EMPTY_DESCRIPTION },
        );
    }
};
