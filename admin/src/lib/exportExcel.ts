import { toast } from "sonner";

export interface DownloadExcelOptions {
    title?: string;
    currencyColumns?: string[];
    headColor?: string;
}

const MAX_COL_WIDTH = 45;
const MIN_COL_WIDTH = 8;

/**
 * @param data      Array data, tiap item adalah object { [header]: value }
 * @param headers   Urutan kolom yang mau ditampilkan
 * @param fileName  Nama file tanpa ekstensi
 * @param sheetName Nama sheet di dalam file Excel
 * @param emptyDescription Pesan toast kalau data kosong (template kosong tetap diunduh)
 * @param options   Opsi tampilan tambahan (judul, kolom Rupiah, warna header)
 */
export const downloadExcel = async (
    data: Record<string, any>[],
    headers: string[],
    fileName: string,
    sheetName = "Laporan",
    emptyDescription = "Tidak ada data untuk ditampilkan.",
    options: DownloadExcelOptions = {},
) => {
    try {
        const ExcelJS = (await import("exceljs")).default;
        const { title, currencyColumns = [], headColor = "2563EB" } = options;

        const wb = new ExcelJS.Workbook();
        wb.creator = "ARROYYAN99";
        const ws = wb.addWorksheet(sheetName, {
            pageSetup: {
                orientation: headers.length >= 6 ? "landscape" : "portrait",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                paperSize: 9,
            },
        });

        const colCount = headers.length;
        const thin = { style: "thin" as const, color: { argb: "FFE2E8F0" } };
        const border = { top: thin, left: thin, bottom: thin, right: thin };

        let headerRowNum = 1;
        if (title) {
            ws.mergeCells(1, 1, 1, colCount);
            const t = ws.getCell(1, 1);
            t.value = `ARROYYAN99 — ${title}`;
            t.font = { bold: true, size: 14 };
            t.alignment = { vertical: "middle", horizontal: "left" };
            ws.getRow(1).height = 24;

            ws.mergeCells(2, 1, 2, colCount);
            const p = ws.getCell(2, 1);
            p.value = `Dicetak: ${new Date().toLocaleString("id-ID")}`;
            p.font = { size: 9, color: { argb: "FF64748B" } };
            headerRowNum = 4;
        }

        const isNumberCol = headers.map((h) => {
            const vals = data
                .map((r) => r[h])
                .filter((v) => v !== "" && v !== null && v !== undefined);
            return vals.length > 0 && vals.every((v) => typeof v === "number");
        });

        // Header
        const headerRow = ws.getRow(headerRowNum);
        headers.forEach((h, i) => {
            const c = headerRow.getCell(i + 1);
            c.value = h;
            c.font = { bold: true, color: { argb: "FFFFFFFF" } };
            c.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: `FF${headColor}` },
            };
            c.alignment = {
                vertical: "middle",
                horizontal: isNumberCol[i] ? "right" : "center",
                wrapText: true,
            };
            c.border = border;
        });
        headerRow.height = 22;

        // Isi data
        data.forEach((rowData, rIdx) => {
            const row = ws.getRow(headerRowNum + 1 + rIdx);
            headers.forEach((h, i) => {
                const c = row.getCell(i + 1);
                const v = rowData[h];
                c.value = v ?? "";
                c.border = border;
                c.alignment = {
                    vertical: "middle",
                    horizontal: isNumberCol[i] ? "right" : "left",
                    wrapText: true,
                };
                if (typeof v === "number") {
                    if (currencyColumns.includes(h)) {
                        c.numFmt = '"Rp" #,##0';
                    } else {
                        c.numFmt = Number.isInteger(v) ? "#,##0" : "#,##0.00";
                    }
                }
                if (rIdx % 2 === 1) {
                    c.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF8FAFC" },
                    };
                }
            });
        });

        // Lebar kolom otomatis
        headers.forEach((h, i) => {
            let max = h.length;
            for (const r of data) {
                const v = r[h];
                const len = (
                    typeof v === "number"
                        ? v.toLocaleString("id-ID") +
                          (currencyColumns.includes(h) ? 3 : 0)
                        : String(v ?? "")
                ).length;
                if (len > max) max = len;
            }
            ws.getColumn(i + 1).width = Math.min(
                Math.max(max + 3, MIN_COL_WIDTH),
                MAX_COL_WIDTH,
            );
        });

        // Header beku + filter
        ws.views = [{ state: "frozen", ySplit: headerRowNum }];
        ws.autoFilter = {
            from: { row: headerRowNum, column: 1 },
            to: { row: headerRowNum, column: colCount },
        };

        // Download
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        if (data.length === 0) {
            toast.info("File Excel diunduh dengan template kosong", {
                description: emptyDescription,
            });
        }
    } catch {
        toast.error("Gagal export Excel", {
            description: "Jalankan: npm install exceljs",
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
