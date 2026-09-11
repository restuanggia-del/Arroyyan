import { toast } from "sonner";

export const exportToExcel = async (
    data: Record<string, any>[],
    headers: string[],
    fileName: string,
) => {
    try {
        const XLSX = await import("xlsx");
        const safeData =
            data.length > 0
                ? data
                : [Object.fromEntries(headers.map((h) => [h, ""]))];
        const ws = XLSX.utils.json_to_sheet(safeData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Bahan");
        XLSX.writeFile(wb, `${fileName}.xlsx`);

        if (data.length === 0) {
            toast.info("File Excel diunduh dengan template kosong", {
                description: "Tidak ada data bahan untuk ditampilkan.",
            });
        }
    } catch {
        toast.error("Gagal export Excel", {
            description: "Jalankan: npm install xlsx",
        });
    }
};

export const exportToPDF = async (
    title: string,
    headers: string[],
    rows: (string | number)[][],
    fileName: string,
) => {
    try {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;
        const doc = new jsPDF();
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
            headStyles: { fillColor: [2, 73, 225] },
        });
        doc.save(`${fileName}.pdf`);

        if (rows.length === 0) {
            toast.info("File PDF diunduh dengan template kosong", {
                description: "Tidak ada data bahan untuk ditampilkan.",
            });
        }
    } catch {
        toast.error("Gagal export PDF", {
            description: "Jalankan: npm install jspdf jspdf-autotable",
        });
    }
};

export const today = () => new Date().toISOString().slice(0, 10);
export const firstOfMonth = () => today().slice(0, 8) + "01";

export const formatTanggalPanjang = (iso: string) => {
    try {
        return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    } catch {
        return iso;
    }
};

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
