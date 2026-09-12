import { HandlingFeeDetailRow } from "../../../services/handlingFeeService";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";

const EMPTY_DESCRIPTION = "Tidak ada data pada rentang tanggal yang dipilih.";

export const exportHandlingFeeToExcel = async (
    data: HandlingFeeDetailRow[],
    startDate: string,
    endDate: string,
) => {
    await downloadExcel(
        data.map((r) => ({
            Tanggal: r.tanggal,
            "Nama Pekerja": r.nama,
            "Jumlah Dus": r.jumlah_dus,
            "Rate/Dus": r.rate_per_dus,
            "Fee Diterima": r.fee_per_orang,
            Keterangan: r.keterangan ?? "",
        })),
        [
            "Tanggal",
            "Nama Pekerja",
            "Jumlah Dus",
            "Rate/Dus",
            "Fee Diterima",
            "Keterangan",
        ],
        `laporan-handling-fee-${startDate}-${endDate}`,
        "Laporan Handling Fee",
        EMPTY_DESCRIPTION,
    );
};

export const exportHandlingFeeToPDF = async (
    data: HandlingFeeDetailRow[],
    startDate: string,
    endDate: string,
) => {
    await downloadTablePdf(
        `Laporan Handling Fee (${startDate} s/d ${endDate})`,
        ["Tanggal", "Nama Pekerja", "Jumlah Dus", "Rate/Dus", "Fee Diterima"],
        data.map((r) => [
            formatDate(r.tanggal),
            r.nama,
            r.jumlah_dus,
            formatRp(r.rate_per_dus),
            formatRp(r.fee_per_orang),
        ]),
        `laporan-handling-fee-${startDate}-${endDate}`,
        { headColor: [234, 88, 12], emptyDescription: EMPTY_DESCRIPTION },
    );
};
