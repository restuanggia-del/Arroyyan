import { toast } from "sonner";

/**
 * Export data tabel sederhana (satu sheet, satu array of object) ke Excel.
 *
 * @param data      Array data, tiap item adalah object { [header]: value }
 * @param headers   Urutan kolom yang mau ditampilkan
 * @param fileName  Nama file tanpa ekstensi
 * @param sheetName Nama sheet di dalam file Excel
 * @param emptyDescription Pesan toast kalau data kosong (template kosong tetap diunduh)
 */
export const downloadExcel = async (
    data: Record<string, any>[],
    headers: string[],
    fileName: string,
    sheetName = "Laporan",
    emptyDescription = "Tidak ada data untuk ditampilkan.",
) => {
    try {
        const XLSX = await import("xlsx");
        const safeData =
            data.length > 0
                ? data
                : [Object.fromEntries(headers.map((h) => [h, ""]))];
        const ws = XLSX.utils.json_to_sheet(safeData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);

        if (data.length === 0) {
            toast.info("File Excel diunduh dengan template kosong", {
                description: emptyDescription,
            });
        }
    } catch {
        toast.error("Gagal export Excel", {
            description: "Jalankan: npm install xlsx",
        });
    }
};


export const downloadExcelWorkbook = async (
    builder: (XLSX: typeof import("xlsx"), wb: any) => void | Promise<void>,
    fileName: string,
) => {
    try {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        await builder(XLSX, wb);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch {
        toast.error("Gagal export Excel", {
            description: "Jalankan: npm install xlsx",
        });
    }
};
