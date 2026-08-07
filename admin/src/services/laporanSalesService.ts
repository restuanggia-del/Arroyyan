import { supabaseAdmin } from "../lib/supabaseAdmin";

export const DEFAULT_RATE_INSENTIF_SALES = 500;
export const DEFAULT_RATE_HANDLING_SALES = 300;

export interface LaporanSalesRow {
    tanggal: string;
    size: string;
    cash_dos: number;
    cash_rp: number;
    titip_dos: number;
    titip_rp: number;
    sub_total_rp: number;
}

export interface LaporanSalesResult {
    karyawan_id: string;
    nama_sales: string;
    periode: string;
    rows: LaporanSalesRow[];
    total_cash_dos: number;
    total_cash_rp: number;
    total_titip_dos: number;
    total_titip_rp: number;
    total_sub_total_rp: number;
    total_dos: number;
    insentif_sales: number;
    handling: number;
    rate_insentif_sales: number;
    rate_handling: number;
}

export const getLaporanSales = async (
    karyawanId: string,
    periode: string,
    rateInsentifSales: number = DEFAULT_RATE_INSENTIF_SALES,
    rateHandling: number = DEFAULT_RATE_HANDLING_SALES,
): Promise<{ data: LaporanSalesResult | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [karyawanRes, trxRes] = await Promise.all([
        supabaseAdmin.from("karyawan").select("id, nama").eq("id", karyawanId).single(),
        supabaseAdmin
            .from("transactions")
            .select(`
        id, created_at, payment_method,
        transaction_details ( quantity, subtotal, products ( size, isi_per_dus ) )
      `)
            .eq("karyawan_id", karyawanId)
            .gte("created_at", startDate)
            .lt("created_at", endDate),
    ]);

    if (karyawanRes.error) return { data: null, error: karyawanRes.error };
    if (trxRes.error) return { data: null, error: trxRes.error };

    const map = new Map<string, LaporanSalesRow>();

    for (const trx of (trxRes.data ?? []) as any[]) {
        const tanggal: string = (trx.created_at as string).slice(0, 10);
        const isTitip = trx.payment_method === "kasbon";

        for (const detail of trx.transaction_details ?? []) {
            const size: string = detail.products?.size ?? "Lainnya";
            const isiPerDus: number = detail.products?.isi_per_dus ?? 0;
            const dos = isiPerDus ? Number(detail.quantity) / isiPerDus : 0;
            const rp = Number(detail.subtotal);

            const key = `${tanggal}|${size}`;
            const existing = map.get(key);
            const base: LaporanSalesRow = existing ?? {
                tanggal,
                size,
                cash_dos: 0,
                cash_rp: 0,
                titip_dos: 0,
                titip_rp: 0,
                sub_total_rp: 0,
            };

            if (isTitip) {
                base.titip_dos += dos;
                base.titip_rp += rp;
            } else {
                base.cash_dos += dos;
                base.cash_rp += rp;
            }
            base.sub_total_rp = base.cash_rp + base.titip_rp;

            map.set(key, base);
        }
    }

    const rows = Array.from(map.values()).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));

    const totalCashDos = rows.reduce((s, r) => s + r.cash_dos, 0);
    const totalCashRp = rows.reduce((s, r) => s + r.cash_rp, 0);
    const totalTitipDos = rows.reduce((s, r) => s + r.titip_dos, 0);
    const totalTitipRp = rows.reduce((s, r) => s + r.titip_rp, 0);
    const totalDos = totalCashDos + totalTitipDos;

    const result: LaporanSalesResult = {
        karyawan_id: karyawanId,
        nama_sales: (karyawanRes.data as any)?.nama ?? "—",
        periode,
        rows: rows.map((r) => ({
            ...r,
            cash_dos: Math.round(r.cash_dos * 100) / 100,
            titip_dos: Math.round(r.titip_dos * 100) / 100,
        })),
        total_cash_dos: Math.round(totalCashDos * 100) / 100,
        total_cash_rp: totalCashRp,
        total_titip_dos: Math.round(totalTitipDos * 100) / 100,
        total_titip_rp: totalTitipRp,
        total_sub_total_rp: totalCashRp + totalTitipRp,
        total_dos: Math.round(totalDos * 100) / 100,
        insentif_sales: Math.round(totalDos * rateInsentifSales),
        handling: Math.round(totalTitipDos * rateHandling),
        rate_insentif_sales: rateInsentifSales,
        rate_handling: rateHandling,
    };

    return { data: result, error: null };
};
