import { supabaseAdmin } from "../lib/supabaseAdmin";

const DEFAULT_RATE_PER_DUS = 300;

export interface HandlingFeeWorker {
    id: string;
    karyawan_id: string;
    fee_per_orang: number;
    karyawan: { nama: string } | null;
}

export interface HandlingFeeRecord {
    id: string;
    tanggal: string;
    jumlah_dus: number;
    rate_per_dus: number;
    total_fee: number;
    keterangan: string | null;
    created_at: string;
    handling_fee_workers: HandlingFeeWorker[];
}

const RECORD_SELECT = `
  id, tanggal, jumlah_dus, rate_per_dus, total_fee, keterangan, created_at,
  handling_fee_workers ( id, karyawan_id, fee_per_orang, karyawan ( nama ) )
`;

export const getHandlingFeeRecords = async (limit = 200) => {
    const { data, error } = await supabaseAdmin
        .from("handling_fee_records")
        .select(RECORD_SELECT)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as HandlingFeeRecord[], error: null };
};

export const createHandlingFee = async (input: {
    tanggal: string;
    jumlah_dus: number;
    rate_per_dus?: number;
    keterangan?: string | null;
    karyawan_ids: string[];
}) => {
    if (input.karyawan_ids.length === 0) {
        return { data: null, error: { message: "Pilih minimal 1 karyawan yang mengerjakan handling." } };
    }

    const ratePerDus = input.rate_per_dus ?? DEFAULT_RATE_PER_DUS;
    const totalFee = input.jumlah_dus * ratePerDus;
    const feePerOrang = Math.round((totalFee / input.karyawan_ids.length) * 100) / 100;

    const { data: record, error: recordError } = await supabaseAdmin
        .from("handling_fee_records")
        .insert([{
            tanggal: input.tanggal,
            jumlah_dus: input.jumlah_dus,
            rate_per_dus: ratePerDus,
            total_fee: totalFee,
            keterangan: input.keterangan || null,
        }])
        .select()
        .single();

    if (recordError) return { data: null, error: recordError };

    const { error: workersError } = await supabaseAdmin
        .from("handling_fee_workers")
        .insert(
            input.karyawan_ids.map((karyawanId) => ({
                handling_fee_id: record.id,
                karyawan_id: karyawanId,
                fee_per_orang: feePerOrang,
            })),
        );

    if (workersError) return { data: null, error: workersError };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_handling_fee",
        description: `Handling fee ${input.jumlah_dus} dus (Rp ${totalFee.toLocaleString("id-ID")}) dicatat untuk ${input.karyawan_ids.length} karyawan`,
    }]);

    return { data: record, error: null };
};

export const deleteHandlingFee = async (id: string) => {
    const { error } = await supabaseAdmin.from("handling_fee_records").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_handling_fee",
        description: `Data handling fee dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export interface HandlingFeeSummaryKaryawan {
    karyawan_id: string;
    nama: string;
    total_fee_diterima: number;
    total_kegiatan: number;
}

export const getHandlingFeeSummaryByKaryawan = async (): Promise<{
    data: HandlingFeeSummaryKaryawan[] | null;
    error: any;
}> => {
    const { data, error } = await supabaseAdmin
        .from("handling_fee_workers")
        .select("karyawan_id, fee_per_orang, karyawan ( nama )");

    if (error) return { data: null, error };

    const map = new Map<string, HandlingFeeSummaryKaryawan>();
    for (const row of (data ?? []) as any[]) {
        const id = row.karyawan_id as string;
        const nama = row.karyawan?.nama ?? "(Karyawan tidak aktif)";
        const existing = map.get(id);
        if (existing) {
            existing.total_fee_diterima += Number(row.fee_per_orang);
            existing.total_kegiatan += 1;
        } else {
            map.set(id, {
                karyawan_id: id,
                nama,
                total_fee_diterima: Number(row.fee_per_orang),
                total_kegiatan: 1,
            });
        }
    }

    const result = Array.from(map.values()).sort(
        (a, b) => b.total_fee_diterima - a.total_fee_diterima,
    );

    return { data: result, error: null };
};
