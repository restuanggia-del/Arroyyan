import { ProductStockReportRow } from "../../../services/laporanStokService";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";

export const STATUS_LABEL: Record<string, string> = {
    aman: "Aman",
    menipis: "Menipis",
    habis: "Habis",
};

export const STATUS_CLASS: Record<string, string> = {
    aman: "bg-green-100 text-green-700",
    menipis: "bg-amber-100 text-amber-700",
    habis: "bg-red-100 text-red-700",
};

export const CATEGORY_LABEL: Record<string, string> = {
    cup: "Cup",
    botol: "Botol",
    galon: "Galon",
};

const EMPTY_DESCRIPTION = "Tidak ada data produk untuk ditampilkan.";

export const exportStokToExcel = async (
    data: ProductStockReportRow[],
    startDate: string,
    endDate: string,
) => {
    const headers = [
        "Nama Produk",
        "Kategori",
        "Satuan",
        "Stok Pusat",
        "Stok Lapangan",
        "Total Stok",
        "Minimum Stok",
        "Masuk (Periode)",
        "Keluar (Periode)",
        "Status",
    ];

    await downloadExcel(
        data.map((r) => ({
            "Nama Produk": r.product_name,
            Kategori: CATEGORY_LABEL[r.category] ?? r.category,
            Satuan: r.unit,
            "Stok Pusat": r.stok_pusat,
            "Stok Lapangan": r.stok_lapangan,
            "Total Stok": r.total_stok,
            "Minimum Stok": r.minimum_stock,
            "Masuk (Periode)": r.total_masuk,
            "Keluar (Periode)": r.total_keluar,
            Status: STATUS_LABEL[r.status],
        })),
        headers,
        `laporan-stok-produk-${startDate}-${endDate}`,
        "Laporan Stok",
        EMPTY_DESCRIPTION,
    );
};

export const exportStokToPDF = async (
    data: ProductStockReportRow[],
    startDate: string,
    endDate: string,
) => {
    const headers = [
        "Nama Produk",
        "Kategori",
        "Satuan",
        "Pusat",
        "Lapangan",
        "Total",
        "Min",
        "Masuk",
        "Keluar",
        "Status",
    ];

    await downloadTablePdf(
        `Laporan Stok Produk (${startDate} s/d ${endDate})`,
        headers,
        data.map((r) => [
            r.product_name,
            CATEGORY_LABEL[r.category] ?? r.category,
            r.unit,
            r.stok_pusat,
            r.stok_lapangan,
            r.total_stok,
            r.minimum_stock,
            r.total_masuk,
            r.total_keluar,
            STATUS_LABEL[r.status],
        ]),
        `laporan-stok-produk-${startDate}-${endDate}`,
        { emptyDescription: EMPTY_DESCRIPTION },
    );
};
