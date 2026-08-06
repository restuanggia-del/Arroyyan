import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface FeeRekapan {
    id: string;
    periode: string;
    karyawan_id: string;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
}

const SELECT = `
  id, periode, karyawan_id, jumlah, keterangan, created_at,
  karyawan ( nama )
`;

export const getFeeRekapan = async (periode?: string) => {
    let query = supabaseAdmin
        .from("fee_rekapan_manual")
        .select(SELECT)
        .order("periode", { ascending: false })
        .order("created_at", { ascending: false });

    if (periode) query = query.eq("periode", periode);

    const { data, error } = await query;
    if (error) return { data: null, error };
    return { data: (data as unknown) as FeeRekapan[], error: null };
};

export const createFeeRekapan = async (input: {
    periode: string;
    karyawan_id: string;
    jumlah: number;
    keterangan?: string | null;
}) => {
    const { data, error } = await supabaseAdmin
        .from("fee_rekapan_manual")
        .insert([{
            periode: input.periode,
            karyawan_id: input.karyawan_id,
            jumlah: input.jumlah,
            keterangan: input.keterangan || null,
        }])
        .select(SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_fee_rekapan",
        description: `Fee rekapan periode ${input.periode} ditambahkan: Rp ${input.jumlah.toLocaleString("id-ID")}`,
    }]);

    return { data: (data as unknown) as FeeRekapan, error: null };
};

export const updateFeeRekapan = async (
    id: string,
    input: Partial<{
        periode: string;
        karyawan_id: string;
        jumlah: number;
        keterangan: string | null;
    }>,
) => {
    const { error } = await supabaseAdmin
        .from("fee_rekapan_manual")
        .update({
            ...(input.periode !== undefined && { periode: input.periode }),
            ...(input.karyawan_id !== undefined && { karyawan_id: input.karyawan_id }),
            ...(input.jumlah !== undefined && { jumlah: input.jumlah }),
            ...(input.keterangan !== undefined && { keterangan: input.keterangan || null }),
        })
        .eq("id", id);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_fee_rekapan",
        description: `Fee rekapan diperbarui (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export const deleteFeeRekapan = async (id: string) => {
    const { error } = await supabaseAdmin.from("fee_rekapan_manual").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_fee_rekapan",
        description: `Fee rekapan dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};
