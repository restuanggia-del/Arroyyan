import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Material {
    id: string;
    nama_bahan: string;
    satuan: string;
    stock_quantity: number;
    is_active: boolean;
    created_at: string;
}

export interface MaterialMovement {
    id: string;
    material_id: string;
    movement_type: "masuk" | "awal" | "keluar";
    quantity: number;
    note: string | null;
    created_at: string;
    materials: { nama_bahan: string; satuan: string } | null;
}

export const MATERIAL_MINIMUM_STOCK = 10;

export const getMaterials = async () => {
    const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Material[], error: null };
};

export const getActiveMaterials = async () => {
    const { data, error } = await supabase
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

    if (error) return { error };

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
    movementType: "masuk" | "awal" = "masuk"
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
