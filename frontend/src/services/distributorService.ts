import { supabaseAdmin } from "../lib/supabaseAdmin";
import { supabase } from "../lib/supabase";

export interface DistributorWithUser {
    id: string;
    distributor_name: string;
    phone: string;
    address: string;
    created_at: string;
    users: {
        id: string;
        name: string;
        email: string;
        is_approved: boolean;
        created_at: string;
    };
}

export const getAllDistributors = async () => {
    const { data, error } = await supabaseAdmin
        .from("distributors")
        .select(
            `
      id,
      distributor_name,
      phone,
      address,
      created_at,
      users (
        id,
        name,
        email,
        is_approved,
        created_at
      )
    `
        )
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as DistributorWithUser[], error: null };
};

export const getPendingDistributors = async () => {
    const { data, error } = await supabaseAdmin
        .from("distributors")
        .select(
            `
      id,
      distributor_name,
      phone,
      address,
      created_at,
      users!inner (
        id,
        name,
        email,
        is_approved,
        created_at
      )
    `
        )
        .eq("users.is_approved", false)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as DistributorWithUser[], error: null };
};

export const approveDistributor = async (userId: string) => {
    const { error } = await supabaseAdmin
        .from("users")
        .update({ is_approved: true })
        .eq("id", userId);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "approve_distributor",
            description: `Admin menyetujui akun distributor dengan user_id: ${userId}`,
        },
    ]);

    return { error: null };
};

export const rejectDistributor = async (userId: string) => {
    const { error } = await supabaseAdmin
        .from("users")
        .update({ is_approved: false })
        .eq("id", userId);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "reject_distributor",
            description: `Admin menolak/menonaktifkan akun distributor dengan user_id: ${userId}`,
        },
    ]);

    return { error: null };
};

export const deleteDistributor = async (userId: string) => {
    const { data: userData, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();

    if (fetchError || !userData) return { error: fetchError };

    const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userData.auth_user_id);
    if (authDeleteError) return { error: authDeleteError };

    const { error: dbDeleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

    if (dbDeleteError) return { error: dbDeleteError };

    return { error: null };
};

export const updateDistributor = async (
    distributorId: string,
    data: { distributor_name?: string; phone?: string; address?: string }
) => {
    const { error } = await supabaseAdmin
        .from("distributors")
        .update(data)
        .eq("id", distributorId);

    if (error) return { error };
    return { error: null };
};
