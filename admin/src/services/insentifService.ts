import { supabaseAdmin } from "../lib/supabaseAdmin";

export type ProduksiKategori = "cup" | "botol";
export type IncentiveJenis =
    | "insentif_produksi"
    | "fee_penjualan"
    | "handling"
    | "fee_rekapan"
    | "bonus_target";

export const RATE_DEFAULT_PER_KATEGORI: Record<ProduksiKategori, number> = {
    cup: 1000,
    botol: 2000,
};

export const JENIS_LABEL: Record<IncentiveJenis, string> = {
    insentif_produksi: "Insentif Produksi",
    fee_penjualan: "Fee Penjualan",
    handling: "Handling Fee",
    fee_rekapan: "Fee Rekapan",
    bonus_target: "Bonus Target",
};

export interface InsentifProduksiWorker {
    id: string;
    karyawan_id: string;
    karyawan: { nama: string } | null;
}

export interface InsentifProduksiRecord {
    id: string;
    tanggal: string;
    kategori: ProduksiKategori;
    jumlah_dus: number;
    rate_per_dus: number;
    total_insentif: number;
    keterangan: string | null;
    created_at: string;
    insentif_produksi_workers: InsentifProduksiWorker[];
}

const INSENTIF_SELECT = `
  id, tanggal, kategori, jumlah_dus, rate_per_dus, total_insentif, keterangan, created_at,
  insentif_produksi_workers ( id, karyawan_id, karyawan ( nama ) )
`;

export const getInsentifProduksiRecords = async (limit = 200) => {
    const { data, error } = await supabaseAdmin
        .from("insentif_produksi_records")
        .select(INSENTIF_SELECT)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as InsentifProduksiRecord[], error: null };
};

export const createInsentifProduksi = async (input: {
    tanggal: string;
    kategori: ProduksiKategori;
    jumlah_dus: number;
    rate_per_dus?: number;
    keterangan?: string | null;
    karyawan_ids: string[];
}) => {
    if (input.karyawan_ids.length === 0) {
        return { data: null, error: { message: "Pilih minimal 1 karyawan yang hadir mengerjakan." } };
    }

    const ratePerDus = input.rate_per_dus ?? RATE_DEFAULT_PER_KATEGORI[input.kategori];
    const totalInsentif = input.jumlah_dus * ratePerDus;

    const { data: record, error: recordError } = await supabaseAdmin
        .from("insentif_produksi_records")
        .insert([{
            tanggal: input.tanggal,
            kategori: input.kategori,
            jumlah_dus: input.jumlah_dus,
            rate_per_dus: ratePerDus,
            total_insentif: totalInsentif,
            keterangan: input.keterangan || null,
        }])
        .select()
        .single();

    if (recordError) return { data: null, error: recordError };

    const { error: workersError } = await supabaseAdmin
        .from("insentif_produksi_workers")
        .insert(
            input.karyawan_ids.map((karyawanId) => ({
                insentif_id: record.id,
                karyawan_id: karyawanId,
            })),
        );

    if (workersError) return { data: null, error: workersError };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_insentif_produksi",
        description: `Insentif produksi ${input.kategori} ${input.jumlah_dus} dus (Rp ${totalInsentif.toLocaleString("id-ID")}) untuk ${input.karyawan_ids.length} karyawan`,
    }]);

    return { data: record, error: null };
};

export const deleteInsentifProduksi = async (id: string) => {
    const { error } = await supabaseAdmin.from("insentif_produksi_records").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_insentif_produksi",
        description: `Data insentif produksi dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export interface KaryawanAmount {
    karyawan_id: string;
    nama: string;
    jumlah_dihitung: number;
}

export const calculateInsentifProduksiPerKaryawan = async (
    periode: string,
): Promise<{ data: KaryawanAmount[] | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = `${periode}-01`;
    const endDateObj = new Date(Date.UTC(year, month, 1));
    const endDate = endDateObj.toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
        .from("insentif_produksi_records")
        .select(`
      total_insentif,
      insentif_produksi_workers ( karyawan_id, karyawan ( nama ) )
    `)
        .gte("tanggal", startDate)
        .lt("tanggal", endDate);

    if (error) return { data: null, error };

    const map = new Map<string, KaryawanAmount>();
    for (const row of (data ?? []) as any[]) {
        const workers = row.insentif_produksi_workers ?? [];
        if (workers.length === 0) continue;
        const perOrang = Number(row.total_insentif) / workers.length;
        for (const w of workers) {
            const id = w.karyawan_id as string;
            const nama = w.karyawan?.nama ?? "(Karyawan tidak aktif)";
            const existing = map.get(id);
            if (existing) existing.jumlah_dihitung += perOrang;
            else map.set(id, { karyawan_id: id, nama, jumlah_dihitung: perOrang });
        }
    }

    const result = Array.from(map.values()).map((r) => ({
        ...r,
        jumlah_dihitung: Math.round(r.jumlah_dihitung * 100) / 100,
    }));
    result.sort((a, b) => b.jumlah_dihitung - a.jumlah_dihitung);

    return { data: result, error: null };
};

export const calculateFeePenjualanPerKaryawan = async (
    periode: string,
    ratePerDus: number,
): Promise<{ data: (KaryawanAmount & { total_dus_terjual: number })[] | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [trxRes, karyawanRes] = await Promise.all([
        supabaseAdmin
            .from("transaction_details")
            .select(`
        quantity,
        products ( isi_per_dus ),
        transactions!inner ( karyawan_id, created_at )
      `)
            .gte("transactions.created_at", startDate)
            .lt("transactions.created_at", endDate),
        supabaseAdmin.from("karyawan").select("id, nama"),
    ]);

    if (trxRes.error) return { data: null, error: trxRes.error };
    if (karyawanRes.error) return { data: null, error: karyawanRes.error };

    const namaMap = new Map(
        ((karyawanRes.data ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]),
    );

    const dusMap = new Map<string, number>();
    for (const row of (trxRes.data ?? []) as any[]) {
        const karyawanId: string | null = row.transactions?.karyawan_id ?? null;
        if (!karyawanId) continue;
        const isiPerDus: number = row.products?.isi_per_dus ?? 0;
        if (!isiPerDus) continue;
        const dus = Number(row.quantity) / isiPerDus;
        dusMap.set(karyawanId, (dusMap.get(karyawanId) ?? 0) + dus);
    }

    const result = Array.from(dusMap.entries()).map(([karyawanId, totalDus]) => ({
        karyawan_id: karyawanId,
        nama: namaMap.get(karyawanId) ?? "(Karyawan tidak aktif)",
        total_dus_terjual: Math.round(totalDus * 100) / 100,
        jumlah_dihitung: Math.round(totalDus * ratePerDus * 100) / 100,
    }));

    result.sort((a, b) => b.total_dus_terjual - a.total_dus_terjual);

    return { data: result, error: null };
};

export interface IncentivePayment {
    id: string;
    jenis: IncentiveJenis;
    karyawan_id: string;
    periode: string;
    jumlah_dihitung: number;
    jumlah_dibayar: number;
    keterangan: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
}

const PAYMENT_SELECT = `
  id, jenis, karyawan_id, periode, jumlah_dihitung, jumlah_dibayar, keterangan, created_at,
  karyawan ( nama )
`;

export const getIncentivePayments = async (jenis: IncentiveJenis, periode?: string) => {
    let query = supabaseAdmin
        .from("incentive_payments")
        .select(PAYMENT_SELECT)
        .eq("jenis", jenis)
        .order("periode", { ascending: false });

    if (periode) query = query.eq("periode", periode);

    const { data, error } = await query;
    if (error) return { data: null, error };
    return { data: (data as unknown) as IncentivePayment[], error: null };
};

export const getIncentivePaymentsRange = async (
    jenisList: IncentiveJenis[],
    startPeriode: string,
    endPeriode: string,
) => {
    const { data, error } = await supabaseAdmin
        .from("incentive_payments")
        .select(PAYMENT_SELECT)
        .in("jenis", jenisList)
        .gte("periode", startPeriode)
        .lte("periode", endPeriode)
        .order("periode", { ascending: false });

    if (error) return { data: null, error };
    return { data: (data as unknown) as IncentivePayment[], error: null };
};

export const savePayments = async (
    jenis: IncentiveJenis,
    periode: string,
    rows: {
        karyawan_id: string;
        jumlah_dihitung: number;
        jumlah_dibayar: number;
        keterangan?: string | null;
    }[],
) => {
    if (rows.length === 0) return { data: [], error: null };

    const payload = rows.map((r) => ({
        jenis,
        karyawan_id: r.karyawan_id,
        periode,
        jumlah_dihitung: r.jumlah_dihitung,
        jumlah_dibayar: r.jumlah_dibayar,
        keterangan: r.keterangan || null,
    }));

    const { data, error } = await supabaseAdmin
        .from("incentive_payments")
        .upsert(payload, { onConflict: "jenis,karyawan_id,periode" })
        .select(PAYMENT_SELECT);

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "save_incentive_payments",
        description: `Pembayaran ${JENIS_LABEL[jenis]} periode ${periode} disimpan untuk ${rows.length} karyawan`,
    }]);

    return { data: (data as unknown) as IncentivePayment[], error: null };
};

export const deletePayment = async (id: string) => {
    const { error } = await supabaseAdmin.from("incentive_payments").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_incentive_payment",
        description: `Data pembayaran insentif dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};
