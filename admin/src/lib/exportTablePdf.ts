import { toast } from "sonner";

const isNumericLike = (v: string | number) =>
    typeof v === "number" || /^Rp\s?[\d.,-]+$/.test(String(v).trim());

export const downloadTablePdf = async (
    title: string,
    headers: string[],
    rows: (string | number)[][],
    fileName: string,
    options?: {
        headColor?: [number, number, number];
        emptyDescription?: string;
        orientation?: "portrait" | "landscape";
    },
) => {
    const {
        headColor = [2, 73, 225],
        emptyDescription = "Tidak ada data untuk ditampilkan.",
        orientation = headers.length >= 6 ? "landscape" : "portrait",
    } = options ?? {};

    try {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF({ orientation });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 14;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        const titleLines: string[] = doc.splitTextToSize(
            "ARROYYAN99 — " + title,
            pageWidth - marginX * 2,
        );
        doc.text(titleLines, marginX, 18);
        const titleBottom = 18 + (titleLines.length - 1) * 6.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
            `Dicetak: ${new Date().toLocaleString("id-ID")}`,
            marginX,
            titleBottom + 7,
        );
        doc.setTextColor(0);

        const safeRows = rows.length > 0 ? rows : [Array(headers.length).fill("")];

        const columnStyles: Record<number, { halign: "right" }> = {};
        headers.forEach((_, i) => {
            const values = rows
                .map((r) => r[i])
                .filter((v) => v !== "" && v !== null && v !== undefined);
            if (values.length > 0 && values.every(isNumericLike)) {
                columnStyles[i] = { halign: "right" };
            }
        });

        autoTable(doc, {
            head: [headers],
            body: safeRows,
            startY: titleBottom + 12,
            margin: { left: marginX, right: marginX, bottom: 16 },
            theme: "grid",
            styles: {
                fontSize: 8.5,
                cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
                overflow: "linebreak",
                valign: "middle",
                lineColor: [226, 232, 240],
                lineWidth: 0.2,
                textColor: [30, 41, 59],
            },
            headStyles: {
                fillColor: headColor,
                textColor: 255,
                fontStyle: "bold",
                halign: "center",
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles,
            showHead: "everyPage",
            didParseCell: (data) => {
                // Header kolom angka juga rata kanan supaya sejajar dengan isinya
                if (data.section === "head" && columnStyles[data.column.index]) {
                    data.cell.styles.halign = "right";
                }
            },
            didDrawPage: () => {
                const page = doc.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8);
                doc.setTextColor(120);
                doc.text(`Halaman ${page}`, pageWidth - marginX, pageHeight - 8, {
                    align: "right",
                });
                doc.text("ARROYYAN99", marginX, pageHeight - 8);
                doc.setTextColor(0);
            },
        });
        doc.save(`${fileName}.pdf`);

        if (rows.length === 0) {
            toast.info("File PDF diunduh dengan template kosong", {
                description: emptyDescription,
            });
        }
    } catch {
        toast.error("Gagal export PDF", {
            description: "Jalankan: npm install jspdf jspdf-autotable",
        });
    }
};
