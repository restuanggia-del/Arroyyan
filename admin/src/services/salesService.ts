import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Sales {
    id: string;
    user_id: string | null;
    nama_sales: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    users?: { auth_user_id: string; name: string; email: string; is_approved: boolean } | null;
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
        .select(`id, user_id, nama_sales, phone, address, is_active, created_at,
      users ( auth_user_id, name, email, is_approved )`)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as Sales[], error: null };
};

export const getActiveSales = async () => {
    const { data, error } = await getAllSales();
    if (error) return { data: null, error };

    return { data: (data ?? []).filter((s) => s.is_active), error: null };
};

export const createSales = async (input: SalesInput) => {
    const { data: sales, error: salesError } = await supabaseAdmin
        .from("sales")
        .insert([{
            nama_sales: input.nama_sales,
            phone: input.phone || null,
            address: input.address || null,
            is_active: input.is_active ?? true,
        }])
        .select()
        .single();

    if (salesError) return { data: null, error: salesError };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_sales",
        description: `Sales baru: ${input.nama_sales}`,
    }]);

    return { data: sales, error: null };
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

export const deleteSales = async (salesId: string, namaSales?: string) => {
    const { error } = await supabaseAdmin.from("sales").delete().eq("id", salesId);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_sales",
        description: `Sales dihapus: ${namaSales ?? salesId.slice(0, 8)}`,
    }]);

    return { error: null };
};

export const createSalesAccount = async (
    salesId: string,
    namaSales: string,
    email: string,
    password: string,
) => {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        return { error: authError ?? { message: "Gagal membuat akun login." } };
    }

    const { data: userRow, error: userError } = await supabaseAdmin
        .from("users")
        .insert([{
            auth_user_id: authData.user.id,
            name: namaSales,
            email,
            role: "sales",
            is_approved: true,
        }])
        .select()
        .single();

    if (userError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { error: userError };
    }

    const { error: linkError } = await supabaseAdmin
        .from("sales")
        .update({ user_id: userRow.id })
        .eq("id", salesId);

    if (linkError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabaseAdmin.from("users").delete().eq("id", userRow.id);
        return { error: linkError };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_sales_account",
        description: `Akun login dibuat untuk sales: ${namaSales} (${email})`,
    }]);

    return { error: null };
};

export const resetSalesPassword = async (userAuthId: string, newPassword: string) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userAuthId, {
        password: newPassword,
    });
    if (error) return { error };
    return { error: null };
};

export const linkSalesToUser = async (salesId: string, userId: string) => {
    const { error } = await supabaseAdmin
        .from("sales")
        .update({ user_id: userId })
        .eq("id", salesId);

    if (error) return { error };
    return { error: null };
};
