import { supabaseAdmin } from "../lib/supabaseAdmin";

export type FeeRekapanOwnerType = "karyawan" | "sales";

export const OWNER_TYPE_LABEL: Record<FeeRekapanOwnerType, string> = {
    karyawan: "Karyawan",
    sales: "Sales",
};

export interface FeeRekapan {
    id: string;
    periode: string;
    karyawan_id: string | null;
    sales_id: string | null;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
    sales: { nama_sales: string } | null;
}

const SELECT = `
  id, periode, karyawan_id, sales_id, jumlah, keterangan, created_at,
  karyawan ( nama ),
  sales ( nama_sales )
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
    owner_type: FeeRekapanOwnerType;
    owner_id: string;
    jumlah: number;
    keterangan?: string | null;
}) => {
    const { data, error } = await supabaseAdmin
        .from("fee_rekapan_manual")
        .insert([{
            periode: input.periode,
            karyawan_id: input.owner_type === "karyawan" ? input.owner_id : null,
            sales_id: input.owner_type === "sales" ? input.owner_id : null,
            jumlah: input.jumlah,
            keterangan: input.keterangan || null,
        }])
        .select(SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_fee_rekapan",
        description: `Fee rekapan periode ${input.periode} (${OWNER_TYPE_LABEL[input.owner_type]}) ditambahkan: Rp ${input.jumlah.toLocaleString("id-ID")}`,
    }]);

    return { data: (data as unknown) as FeeRekapan, error: null };
};

export const updateFeeRekapan = async (
    id: string,
    input: Partial<{
        periode: string;
        owner_type: FeeRekapanOwnerType;
        owner_id: string;
        jumlah: number;
        keterangan: string | null;
    }>,
) => {
    const patch: Record<string, unknown> = {};
    if (input.periode !== undefined) patch.periode = input.periode;
    if (input.jumlah !== undefined) patch.jumlah = input.jumlah;
    if (input.keterangan !== undefined) patch.keterangan = input.keterangan || null;
    if (input.owner_type !== undefined && input.owner_id !== undefined) {
        patch.karyawan_id = input.owner_type === "karyawan" ? input.owner_id : null;
        patch.sales_id = input.owner_type === "sales" ? input.owner_id : null;
    }

    const { error } = await supabaseAdmin
        .from("fee_rekapan_manual")
        .update(patch)
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
