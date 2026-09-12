import { toast } from "sonner";

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
        orientation = "portrait",
    } = options ?? {};

    try {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF({ orientation });
        doc.setFontSize(16);
        doc.text("ARROYYAN99 — " + title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 14, 28);
        const safeRows = rows.length > 0 ? rows : [Array(headers.length).fill("")];
        autoTable(doc, {
            head: [headers],
            body: safeRows,
            startY: 35,
            styles: { fontSize: 9 },
            headStyles: { fillColor: headColor },
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
