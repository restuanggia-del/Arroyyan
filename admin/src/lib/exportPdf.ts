import { toast } from "sonner";
import type jsPDFType from "jspdf";

export const loadPdfLibs = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    return { jsPDF, autoTable };
};

export const downloadPdfDoc = async (
    builder: (jsPDF: typeof jsPDFType, autoTable: any) => Promise<void> | void,
    errorDescription = "Jalankan: npm install jspdf jspdf-autotable",
) => {
    try {
        const { jsPDF, autoTable } = await loadPdfLibs();
        await builder(jsPDF, autoTable);
    } catch {
        toast.error("Gagal export PDF", {
            description: errorDescription,
        });
    }
};
