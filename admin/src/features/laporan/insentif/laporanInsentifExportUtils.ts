import {
    IncentivePayment,
    JENIS_LABEL,
} from "../../../services/insentifService";
import { downloadExcel } from "../../../lib/exportExcel";
import { downloadTablePdf } from "../../../lib/exportTablePdf";
import { formatRp } from "../../../lib/formatters";

const EMPTY_DESCRIPTION = "Tidak ada data pada periode yang dipilih.";

export const exportInsentifToExcel = async (
    data: IncentivePayment[],
    startPeriode: string,
    endPeriode: string,
) => {
    await downloadExcel(
        data.map((r) => ({
            Periode: r.periode,
            Jenis: JENIS_LABEL[r.jenis],
            "Jenis Pemilik": r.sales_id ? "Sales" : "Karyawan",
            Nama: r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
            "Jumlah Dihitung": Number(r.jumlah_dihitung),
            "Jumlah Dibayar": Number(r.jumlah_dibayar),
            Selisih: Number(r.jumlah_dibayar) - Number(r.jumlah_dihitung),
            Keterangan: r.keterangan ?? "",
        })),
        [
            "Periode",
            "Jenis",
            "Jenis Pemilik",
            "Nama",
            "Jumlah Dihitung",
            "Jumlah Dibayar",
            "Selisih",
            "Keterangan",
        ],
        `laporan-insentif-${startPeriode}-${endPeriode}`,
        "Laporan Insentif",
        EMPTY_DESCRIPTION,
    );
};

export const exportInsentifToPDF = async (
    data: IncentivePayment[],
    startPeriode: string,
    endPeriode: string,
) => {
    await downloadTablePdf(
        `Laporan Insentif (${startPeriode} s/d ${endPeriode})`,
        ["Periode", "Jenis", "Pemilik", "Nama", "Dihitung", "Dibayar", "Selisih"],
        data.map((r) => [
            r.periode,
            JENIS_LABEL[r.jenis],
            r.sales_id ? "Sales" : "Karyawan",
            r.sales?.nama_sales ?? r.karyawan?.nama ?? "—",
            formatRp(Number(r.jumlah_dihitung)),
            formatRp(Number(r.jumlah_dibayar)),
            formatRp(Number(r.jumlah_dibayar) - Number(r.jumlah_dihitung)),
        ]),
        `laporan-insentif-${startPeriode}-${endPeriode}`,
        { headColor: [13, 148, 136], emptyDescription: EMPTY_DESCRIPTION },
    );
};
