import { supabaseAdmin } from "../lib/supabaseAdmin";
import { calculateReceiptTotals } from "./incentiveReceiptService";
import { KATEGORI_POTONGAN_LABEL, PotonganKategori } from "./potonganSetoranService";

export interface TitipanLamaRow {
    periode_asal: string;
    jumlah: number;
}

export interface TransferTitipanRow {
    tanggal_bayar: string;
    nama: string;
    jumlah_transfer: number;
}

export interface PotonganRow {
    kategori: PotonganKategori;
    label: string;
    jumlah: number;
}

export interface TitipanSalesRow {
    karyawan_id: string;
    nama: string;
    jumlah: number;
}

export interface InsentifBreakdown {
    total_produksi: number;
    total_fee_penjualan: number;
    total_handling: number;
    total_fee_rekapan: number;
    total_bonus_target: number;
    total_insentif: number;
}

export interface RekapanSetoran {
    periode: string;
    penjualan_bulan_ini: number;
    titipan_lama: TitipanLamaRow[];
    total_dana: number;

    transfer_penjualan: number;
    transfer_titipan: TransferTitipanRow[];
    total_transfer: number;

    potongan: PotonganRow[];
    total_potongan: number;

    titipan_sales_bulan_ini: TitipanSalesRow[];
    total_titipan_sales: number;

    insentif: InsentifBreakdown;

    sisa_dana_penjualan: number;
}

const monthLabel = (periodeYYYYMM: string) => {
    const [y, m] = periodeYYYYMM.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });
};

export const getRekapanSetoran = async (
    periode: string,
): Promise<{ data: RekapanSetoran | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();
    const startDateOnly = startDate.slice(0, 10);
    const endDateOnly = endDate.slice(0, 10);

    const [
        trxBulanIniRes,
        trxTransferRes,
        trxKasbonRes,
        kasbonPaymentsRes,
        potonganRes,
        insentifTotals,
    ] = await Promise.all([
        supabaseAdmin
            .from("transactions")
            .select("total_price")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin
            .from("transactions")
            .select("total_price")
            .eq("payment_method", "transfer")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin
            .from("transactions")
            .select("total_price, karyawan_id, karyawan ( nama )")
            .eq("payment_method", "kasbon")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin
            .from("kasbon_payments")
            .select(`
        tanggal_bayar, jumlah_transfer, jumlah_cash, jumlah_ke_owner,
        transactions!inner ( created_at, customers ( customer_name ) )
      `)
            .gte("tanggal_bayar", startDateOnly)
            .lt("tanggal_bayar", endDateOnly),
        supabaseAdmin
            .from("potongan")
            .select("kategori, jumlah")
            .gte("tanggal", startDateOnly)
            .lt("tanggal", endDateOnly),
        calculateReceiptTotals(periode),
    ]);

    if (trxBulanIniRes.error) return { data: null, error: trxBulanIniRes.error };
    if (trxTransferRes.error) return { data: null, error: trxTransferRes.error };
    if (trxKasbonRes.error) return { data: null, error: trxKasbonRes.error };
    if (kasbonPaymentsRes.error) return { data: null, error: kasbonPaymentsRes.error };
    if (potonganRes.error) return { data: null, error: potonganRes.error };
    if (insentifTotals.error) return { data: null, error: insentifTotals.error };

    const penjualanBulanIni = ((trxBulanIniRes.data ?? []) as { total_price: number }[]).reduce(
        (s, t) => s + Number(t.total_price),
        0,
    );

    const titipanLamaMap = new Map<string, number>();
    const transferTitipanRows: TransferTitipanRow[] = [];
    let transferTitipanTotal = 0;

    for (const kp of (kasbonPaymentsRes.data ?? []) as any[]) {
        const totalBayar = Number(kp.jumlah_transfer) + Number(kp.jumlah_cash) + Number(kp.jumlah_ke_owner);
        const asalCreatedAt: string | undefined = kp.transactions?.created_at;
        if (asalCreatedAt) {
            const asalPeriode = asalCreatedAt.slice(0, 7);
            titipanLamaMap.set(asalPeriode, (titipanLamaMap.get(asalPeriode) ?? 0) + totalBayar);
        }
        if (Number(kp.jumlah_transfer) > 0) {
            transferTitipanRows.push({
                tanggal_bayar: kp.tanggal_bayar,
                nama: kp.transactions?.customers?.customer_name ?? "—",
                jumlah_transfer: Number(kp.jumlah_transfer),
            });
            transferTitipanTotal += Number(kp.jumlah_transfer);
        }
    }

    const titipanLama: TitipanLamaRow[] = Array.from(titipanLamaMap.entries())
        .map(([p, jumlah]) => ({ periode_asal: monthLabel(p), jumlah }))
        .sort((a, b) => a.periode_asal.localeCompare(b.periode_asal));
    const totalTitipanLama = titipanLama.reduce((s, r) => s + r.jumlah, 0);

    const totalDana = penjualanBulanIni + totalTitipanLama;

    const transferPenjualan = ((trxTransferRes.data ?? []) as { total_price: number }[]).reduce(
        (s, t) => s + Number(t.total_price),
        0,
    );
    const totalTransfer = transferPenjualan + transferTitipanTotal;

    const potonganMap = new Map<PotonganKategori, number>();
    for (const p of (potonganRes.data ?? []) as { kategori: PotonganKategori; jumlah: number }[]) {
        potonganMap.set(p.kategori, (potonganMap.get(p.kategori) ?? 0) + Number(p.jumlah));
    }
    const potongan: PotonganRow[] = Array.from(potonganMap.entries()).map(([kategori, jumlah]) => ({
        kategori,
        label: KATEGORI_POTONGAN_LABEL[kategori],
        jumlah,
    }));
    const totalPotongan = potongan.reduce((s, r) => s + r.jumlah, 0);

    const titipanSalesMap = new Map<string, TitipanSalesRow>();
    for (const t of (trxKasbonRes.data ?? []) as any[]) {
        if (!t.karyawan_id) continue;
        const existing = titipanSalesMap.get(t.karyawan_id);
        if (existing) existing.jumlah += Number(t.total_price);
        else
            titipanSalesMap.set(t.karyawan_id, {
                karyawan_id: t.karyawan_id,
                nama: t.karyawan?.nama ?? "(Karyawan tidak aktif)",
                jumlah: Number(t.total_price),
            });
    }
    const titipanSalesBulanIni = Array.from(titipanSalesMap.values()).sort(
        (a, b) => b.jumlah - a.jumlah,
    );
    const totalTitipanSales = titipanSalesBulanIni.reduce((s, r) => s + r.jumlah, 0);

    const insentifRows = insentifTotals.data ?? [];
    const insentif: InsentifBreakdown = {
        total_produksi: insentifRows.reduce((s, r) => s + r.total_produksi, 0),
        total_fee_penjualan: insentifRows.reduce((s, r) => s + r.total_fee_penjualan, 0),
        total_handling: insentifRows.reduce((s, r) => s + r.total_handling, 0),
        total_fee_rekapan: insentifRows.reduce((s, r) => s + r.total_fee_rekapan, 0),
        total_bonus_target: insentifRows.reduce((s, r) => s + r.total_bonus_target, 0),
        total_insentif: insentifRows.reduce((s, r) => s + r.jumlah_total, 0),
    };

    const sisaDanaPenjualan =
        totalDana - totalPotongan - totalTitipanSales - insentif.total_insentif - totalTransfer;

    return {
        data: {
            periode,
            penjualan_bulan_ini: penjualanBulanIni,
            titipan_lama: titipanLama,
            total_dana: totalDana,
            transfer_penjualan: transferPenjualan,
            transfer_titipan: transferTitipanRows,
            total_transfer: totalTransfer,
            potongan,
            total_potongan: totalPotongan,
            titipan_sales_bulan_ini: titipanSalesBulanIni,
            total_titipan_sales: totalTitipanSales,
            insentif,
            sisa_dana_penjualan: sisaDanaPenjualan,
        },
        error: null,
    };
};
