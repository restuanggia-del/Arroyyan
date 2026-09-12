import { BonusRecord } from "../../../services/bonusService";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import { formatRp, formatDus } from "../../../lib/formatters";

const EMPTY_DESCRIPTION = "Tidak ada data pada periode yang dipilih.";

export const exportBonusToExcel = async (
    data: BonusRecord[],
    startPeriode: string,
    endPeriode: string,
) => {
    await downloadExcel(
        data.map((r) => ({
            Periode: r.periode,
            Jenis: r.sales_id ? "Sales" : "Karyawan",
            Nama: r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
            "Total Dus Terjual": Number(r.total_dus_terjual),
            "Bonus Dus": r.bonus_dus,
            "Bonus Kaos": r.bonus_kaos,
            "Bonus Uang (Rp)": Number(r.bonus_target_rp),
            Catatan: r.catatan ?? "",
        })),
        [
            "Periode",
            "Jenis",
            "Nama",
            "Total Dus Terjual",
            "Bonus Dus",
            "Bonus Kaos",
            "Bonus Uang (Rp)",
            "Catatan",
        ],
        `laporan-bonus-${startPeriode}-${endPeriode}`,
        "Laporan Bonus",
        EMPTY_DESCRIPTION,
    );
};

export const exportBonusToPDF = async (
    data: BonusRecord[],
    startPeriode: string,
    endPeriode: string,
) => {
    await downloadTablePdf(
        `Laporan Bonus (${startPeriode} s/d ${endPeriode})`,
        [
            "Periode",
            "Jenis",
            "Nama",
            "Dus Terjual",
            "Bonus Dus",
            "Bonus Kaos",
            "Bonus Uang",
        ],
        data.map((r) => [
            r.periode,
            r.sales_id ? "Sales" : "Karyawan",
            r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
            formatDus(Number(r.total_dus_terjual)),
            r.bonus_dus,
            r.bonus_kaos,
            formatRp(Number(r.bonus_target_rp)),
        ]),
        `laporan-bonus-${startPeriode}-${endPeriode}`,
        { headColor: [217, 119, 6], emptyDescription: EMPTY_DESCRIPTION },
    );
};
