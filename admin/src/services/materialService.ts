import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Material {
    id: string;
    nama_bahan: string;
    satuan: string;
    stock_quantity: number;
    stock_sementara: number;
    is_active: boolean;
    created_at: string;
}

export interface MaterialMovement {
    id: string;
    material_id: string;
    movement_type:
    | "masuk"
    | "stok_awal"
    | "keluar"
    | "ke_sementara"
    | "kembali_gudang"
    | "produksi"
    | "stok_awal_sementara"
    | "reject";
    quantity: number;
    note: string | null;
    created_at: string;
    materials: { nama_bahan: string; satuan: string } | null;
}

export const MOVEMENT_TYPE_LABEL: Record<MaterialMovement["movement_type"], string> = {
    masuk: "Stok Masuk (Gudang)",
    stok_awal: "Stok Awal (Input Awal / Opname)",
    keluar: "Stok Keluar (Gudang)",
    ke_sementara: "Pindah ke Sementara",
    kembali_gudang: "Kembali ke Gudang",
    produksi: "Pemakaian Produksi",
    stok_awal_sementara: "Stok Awal Sementara (Pabrik)",
    reject: "Bahan Rusak / Reject (Sementara)",
};

export const MATERIAL_MINIMUM_STOCK = 10;

export const getMaterials = async () => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Material[], error: null };
};

export const getActiveMaterials = async () => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .select("*")
        .eq("is_active", true)
        .order("nama_bahan", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as Material[], error: null };
};

export const createMaterial = async (
    material: Pick<Material, "nama_bahan" | "satuan" | "is_active">
) => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .insert([{ ...material, stock_quantity: 0 }])
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "create_material",
            description: `Bahan baru ditambahkan: ${material.nama_bahan}`,
        },
    ]);

    return { data: data as Material, error: null };
};

export const updateMaterial = async (
    id: string,
    material: Partial<Pick<Material, "nama_bahan" | "satuan" | "is_active">>
) => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .update(material)
        .eq("id", id)
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "update_material",
            description: `Bahan diperbarui: ${material.nama_bahan ?? id}`,
        },
    ]);

    return { data: data as Material, error: null };
};

export const toggleMaterialStatus = async (id: string, isActive: boolean) => {
    const { error } = await supabaseAdmin
        .from("materials")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};

export const deleteMaterial = async (id: string, namaBahan: string) => {
    const { error } = await supabaseAdmin.from("materials").delete().eq("id", id);

    if (error) {
        if ((error as any).code === "23503") {
            return {
                error: {
                    message:
                        `"${namaBahan}" sudah punya riwayat pergerakan stok (masuk/keluar/dll), ` +
                        `jadi tidak bisa dihapus permanen. Nonaktifkan saja bahan ini lewat tombol ` +
                        `status di tabel — riwayatnya tetap aman dan bahan otomatis hilang dari ` +
                        `pilihan transaksi baru.`,
                    code: "HAS_MOVEMENTS",
                },
            };
        }
        return { error };
    }

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "delete_material",
            description: `Bahan dihapus: ${namaBahan}`,
        },
    ]);

    return { error: null };
};

export const getMaterialMovements = async (limit = 50) => {
    const { data, error } = await supabaseAdmin
        .from("material_movements")
        .select(`
      id,
      material_id,
      movement_type,
      quantity,
      note,
      created_at,
      materials ( nama_bahan, satuan )
    `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as MaterialMovement[], error: null };
};

export const addMaterialStock = async (
    materialId: string,
    quantity: number,
    note: string,
    movementType: "masuk" | "stok_awal" = "masuk"
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_quantity: existing.stock_quantity + quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: movementType,
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const reduceMaterialStock = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_quantity < quantity) {
        return { error: { message: "Stok bahan tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_quantity: existing.stock_quantity - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "keluar",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const moveToSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_quantity < quantity) {
        return { error: { message: "Stok bahan gudang tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({
            stock_quantity: existing.stock_quantity - quantity,
            stock_sementara: existing.stock_sementara + quantity,
        })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "ke_sementara",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const addSementaraStokAwal = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara + quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "stok_awal_sementara",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const consumeSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "produksi",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const rejectSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "reject",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const recordSisaBahan = async (
    materialId: string,
    sisaCount: number,
    note: string
) => {
    if (sisaCount < 0) {
        return { error: { message: "Jumlah sisa tidak boleh negatif." } };
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const stokSaatIni = Number(existing.stock_sementara) || 0;
    const pemakaian = stokSaatIni - sisaCount;

    if (pemakaian < 0) {
        return {
            error: {
                message: `Sisa yang diinput (${sisaCount}) lebih besar dari Stok Sementara saat ini (${stokSaatIni}). Periksa kembali jumlahnya.`,
            },
        };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: sisaCount })
        .eq("id", materialId);

    if (error) return { error };

    if (pemakaian > 0) {
        const autoNote = `Otomatis dari Sisa Bahan (stok sementara ${stokSaatIni} → sisa ${sisaCount})`;
        const { error: movErr } = await supabaseAdmin
            .from("material_movements")
            .insert([{
                material_id: materialId,
                movement_type: "produksi",
                quantity: pemakaian,
                note: note ? `${autoNote} — ${note}` : autoNote,
            }]);

        if (movErr) return { error: movErr };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "sisa_bahan_material",
        description: `Sisa Bahan dicatat: stok sementara ${stokSaatIni} → ${sisaCount} (Pemakaian Produksi otomatis ${pemakaian})`,
    }]);

    return { error: null };
};
