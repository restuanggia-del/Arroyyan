import { supabaseAdmin } from "../lib/supabaseAdmin";

export type KaryawanRole = "produksi" | "handling" | "jual_antar" | "admin";

export interface Karyawan {
    id: string;
    nama: string;
    phone: string | null;
    address: string | null;
    bonus_khusus: boolean;
    is_active: boolean;
    created_at: string;
    karyawan_roles?: { role: KaryawanRole }[];
}

export interface KaryawanInput {
    nama: string;
    phone?: string | null;
    address?: string | null;
    bonus_khusus?: boolean;
    is_active?: boolean;
    roles: KaryawanRole[];
}

export const getAllKaryawan = async () => {
    const { data, error } = await supabaseAdmin
        .from("karyawan")
        .select(`id, nama, phone, address, bonus_khusus, is_active, created_at,
      karyawan_roles ( role )`)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as Karyawan[], error: null };
};

// Karyawan aktif, opsional difilter berdasarkan salah satu peran (mis. "jual_antar"
// untuk daftar tujuan distribusi / pilihan sales di transaksi).
export const getActiveKaryawan = async (role?: KaryawanRole) => {
    const { data, error } = await getAllKaryawan();
    if (error) return { data: null, error };

    let result = (data ?? []).filter((k) => k.is_active);
    if (role) {
        result = result.filter((k) =>
            (k.karyawan_roles ?? []).some((r) => r.role === role),
        );
    }
    return { data: result, error: null };
};

export const createKaryawan = async (input: KaryawanInput) => {
    const { data: karyawan, error: karyawanError } = await supabaseAdmin
        .from("karyawan")
        .insert([{
            nama: input.nama,
            phone: input.phone || null,
            address: input.address || null,
            bonus_khusus: input.bonus_khusus ?? false,
            is_active: input.is_active ?? true,
        }])
        .select()
        .single();

    if (karyawanError) return { data: null, error: karyawanError };

    if (input.roles.length > 0) {
        const { error: rolesError } = await supabaseAdmin
            .from("karyawan_roles")
            .insert(input.roles.map((role) => ({ karyawan_id: karyawan.id, role })));

        if (rolesError) return { data: null, error: rolesError };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_karyawan",
        description: `Karyawan baru: ${input.nama} (${input.roles.join(", ") || "tanpa peran"})`,
    }]);

    return { data: karyawan, error: null };
};

export const updateKaryawan = async (
    karyawanId: string,
    input: Partial<Omit<KaryawanInput, "roles">> & { roles?: KaryawanRole[] },
    meta?: { oldName?: string },
) => {
    const { error: karyawanError } = await supabaseAdmin
        .from("karyawan")
        .update({
            ...(input.nama !== undefined && { nama: input.nama }),
            ...(input.phone !== undefined && { phone: input.phone || null }),
            ...(input.address !== undefined && { address: input.address || null }),
            ...(input.bonus_khusus !== undefined && { bonus_khusus: input.bonus_khusus }),
            ...(input.is_active !== undefined && { is_active: input.is_active }),
        })
        .eq("id", karyawanId);

    if (karyawanError) return { error: karyawanError };

    if (input.roles !== undefined) {
        const { error: deleteError } = await supabaseAdmin
            .from("karyawan_roles")
            .delete()
            .eq("karyawan_id", karyawanId);
        if (deleteError) return { error: deleteError };

        if (input.roles.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from("karyawan_roles")
                .insert(input.roles.map((role) => ({ karyawan_id: karyawanId, role })));
            if (insertError) return { error: insertError };
        }
    }

    const label = meta?.oldName ?? input.nama ?? karyawanId.slice(0, 8);
    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_karyawan",
        description: `Data karyawan diperbarui: ${label}`,
    }]);

    return { error: null };
};

export const deleteKaryawan = async (karyawanId: string, nama?: string) => {
    // karyawan_roles ikut terhapus otomatis lewat ON DELETE CASCADE
    const { error } = await supabaseAdmin.from("karyawan").delete().eq("id", karyawanId);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_karyawan",
        description: `Karyawan dihapus: ${nama ?? karyawanId.slice(0, 8)}`,
    }]);

    return { error: null };
};
