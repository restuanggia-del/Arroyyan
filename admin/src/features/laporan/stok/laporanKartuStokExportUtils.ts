import { KartuStokProduk } from "../../../services/laporanStokService";
import { downloadExcelWorkbook } from "../../../lib/exportExcel";
import { downloadPdfDoc } from "../../../lib/exportPdf";
import { formatDate } from "../../../lib/dateUtils";
import type { CellHookData } from "jspdf-autotable";

const COMPANY_NAME = "PT JATRA BABE SALIM";
const DOKUMEN_NO = "F.8.6-2";
const EDISI_REVISI = "1/00";
const TANGGAL_TERBIT = "5 Agustus 2024";

const CATEGORY_LABEL: Record<string, string> = {
    cup: "Cup",
    botol: "Botol",
    galon: "Galon",
};

const namaBarang = (p: KartuStokProduk) => {
    let s = p.product_name;
    if (p.size) s += ` ${p.size}`;
    if (p.isi_per_dus) s += ` @ ${p.isi_per_dus} pcs`;
    return s;
};

export const exportKartuStokToPDF = async (
    produk: KartuStokProduk[],
    startDate: string,
    endDate: string,
) => {
    await downloadPdfDoc(async (jsPDF, autoTable) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 14;
        const boxWidth = pageWidth - marginX * 2;

        produk.forEach((p, idx) => {
            if (idx > 0) doc.addPage();

            const boxTop = 12;
            const boxHeight = 22;
            const col1W = boxWidth * 0.35;
            const col2W = boxWidth * 0.3;
            const col3W = boxWidth - col1W - col2W;
            const col1X = marginX;
            const col2X = marginX + col1W;
            const col3X = marginX + col1W + col2W;

            doc.setDrawColor(0);
            doc.rect(marginX, boxTop, boxWidth, boxHeight);
            doc.line(col2X, boxTop, col2X, boxTop + boxHeight);
            doc.line(col3X, boxTop, col3X, boxTop + boxHeight);

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(COMPANY_NAME, col1X + col1W / 2, boxTop + boxHeight / 2 + 2, {
                align: "center",
                maxWidth: col1W - 4,
            });

            doc.setFontSize(10);
            doc.text("FORM", col2X + col2W / 2, boxTop + 9, { align: "center" });
            doc.text("KARTU STOK", col2X + col2W / 2, boxTop + 16, {
                align: "center",
            });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            const infoLines = [
                `Dokumen No.   : ${DOKUMEN_NO}`,
                `Edisi/Revisi  : ${EDISI_REVISI}`,
                `Tanggal Terbit: ${TANGGAL_TERBIT}`,
                `Halaman       : ${idx + 1} dari ${produk.length}`,
            ];
            infoLines.forEach((line, i) => {
                doc.text(line, col3X + 3, boxTop + 5 + i * 4.3);
            });

            let y = boxTop + boxHeight + 8;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Gudang       : Produk", marginX, y);
            y += 5.5;
            doc.text(
                `Nama Barang  : ${namaBarang(p)} (${CATEGORY_LABEL[p.category] ?? p.category})`,
                marginX,
                y,
            );
            y += 7;

            const body = [
                [formatDate(startDate), "Stok Awal", "", "", String(p.stok_awal)],
                ...p.rows.map((r) => [
                    formatDate(r.created_at),
                    r.uraian,
                    r.masuk ? String(r.masuk) : "",
                    r.keluar ? String(r.keluar) : "",
                    String(r.sisa),
                ]),
            ];

            autoTable(doc, {
                head: [["Tanggal", "Uraian", "Masuk", "Keluar", "Sisa"]],
                body,
                startY: y,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [2, 73, 225] },
                columnStyles: {
                    0: { cellWidth: 25 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 22 },
                },
                didParseCell: (data: CellHookData) => {
                    if ([2, 3, 4].includes(data.column.index)) {
                        data.cell.styles.halign = "right";
                    }
                },
            });
        });

        doc.save(`kartu-stok-${startDate}-${endDate}.pdf`);
    });
};

/* --------------------------- Excel --------------------------- */

export const exportKartuStokToExcel = async (
    produk: KartuStokProduk[],
    startDate: string,
    endDate: string,
) => {
    await downloadExcelWorkbook((XLSX, wb) => {
        const usedSheetNames = new Set<string>();
        const uniqueSheetName = (raw: string) => {
            const base =
                raw.replace(/[\[\]\*\/\\\?:]/g, "").trim().slice(0, 31) || "Produk";
            let name = base;
            let counter = 2;
            while (usedSheetNames.has(name)) {
                const suffix = ` (${counter})`;
                name = base.slice(0, 31 - suffix.length) + suffix;
                counter++;
            }
            usedSheetNames.add(name);
            return name;
        };

        for (const p of produk) {
            const aoa: any[][] = [
                [COMPANY_NAME, "", "FORM — KARTU STOK", "", "Dokumen No.", DOKUMEN_NO],
                ["", "", "", "", "Edisi/Revisi", EDISI_REVISI],
                ["", "", "", "", "Tanggal Terbit", TANGGAL_TERBIT],
                [],
                ["Gudang", "Produk"],
                [
                    "Nama Barang",
                    `${namaBarang(p)} (${CATEGORY_LABEL[p.category] ?? p.category})`,
                ],
                [],
                ["Tanggal", "Uraian", "Masuk", "Keluar", "Sisa"],
                [formatDate(startDate), "Stok Awal", "", "", p.stok_awal],
                ...p.rows.map((r) => [
                    formatDate(r.created_at),
                    r.uraian,
                    r.masuk || "",
                    r.keluar || "",
                    r.sisa,
                ]),
            ];
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            const sheetName = uniqueSheetName(
                `${p.product_name} ${CATEGORY_LABEL[p.category] ?? p.category}${p.size ? " " + p.size : ""}`,
            );
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    }, `kartu-stok-${startDate}-${endDate}`);
};
