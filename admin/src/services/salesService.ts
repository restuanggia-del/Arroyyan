import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Sales {
    id: string;
    user_id: string | null;
    nama_sales: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    users?: {
        is_approved: boolean;
    } | null;
}

export interface SalesInput {
    nama_sales: string;
    phone?: string | null;
    address?: string | null;
    is_active?: boolean;
}

export const getAllSales = async () => {
    const { data, error } = await supabaseAdmin
        .from("sales")
        .select("*, users ( is_approved )")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Sales[], error: null };
};

export const getActiveSales = async () => {
    const { data, error } = await supabaseAdmin
        .from("sales")
        .select("*")
        .eq("is_active", true)
        .order("nama_sales", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as Sales[], error: null };
};

export const createSales = async (input: SalesInput) => {
    const { data, error } = await supabaseAdmin
        .from("sales")
        .insert([{
            nama_sales: input.nama_sales,
            phone: input.phone || null,
            address: input.address || null,
            is_active: input.is_active ?? true,
        }])
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_sales",
        description: `Sales baru: ${input.nama_sales}`,
    }]);

    return { data: data as Sales, error: null };
};

export const updateSales = async (
    salesId: string,
    input: Partial<SalesInput>,
    meta?: { oldName?: string },
) => {
    const { error } = await supabaseAdmin
        .from("sales")
        .update({
            ...(input.nama_sales !== undefined && { nama_sales: input.nama_sales }),
            ...(input.phone !== undefined && { phone: input.phone || null }),
            ...(input.address !== undefined && { address: input.address || null }),
            ...(input.is_active !== undefined && { is_active: input.is_active }),
        })
        .eq("id", salesId);

    if (error) return { error };

    const label = meta?.oldName ?? input.nama_sales ?? salesId.slice(0, 8);
    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_sales",
        description: `Data sales diperbarui: ${label}`,
    }]);

    return { error: null };
};

export const deleteSales = async (salesId: string, nama?: string) => {
    const { error } = await supabaseAdmin.from("sales").delete().eq("id", salesId);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_sales",
        description: `Sales dihapus: ${nama ?? salesId.slice(0, 8)}`,
    }]);

    return { error: null };
};

export const linkSalesUser = async (salesId: string, userId: string) => {
    const { error } = await supabaseAdmin
        .from("sales")
        .update({ user_id: userId })
        .eq("id", salesId);

    if (error) return { error };
    return { error: null };
};
