import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Product {
    id: string;
    product_name: string;
    category: "cup" | "botol";
    size: string | null;
    price: number;
    unit: string;
    photo_url: string | null;
    is_active: boolean;
    created_at: string;
}

export const getProducts = async () => {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Product[], error: null };
};

export const getActiveProducts = async () => {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("product_name", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as Product[], error: null };
};

export const createProduct = async (
    product: Omit<Product, "id" | "created_at">
) => {
    const { data, error } = await supabaseAdmin
        .from("products")
        .insert([product])
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "create_product",
            description: `Produk baru ditambahkan: ${product.product_name}`,
        },
    ]);

    return { data: data as Product, error: null };
};

export const updateProduct = async (
    id: string,
    product: Partial<Omit<Product, "id" | "created_at">>
) => {
    const { data, error } = await supabaseAdmin
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "update_product",
            description: `Produk diperbarui: ${product.product_name ?? id}`,
        },
    ]);

    return { data: data as Product, error: null };
};

export const toggleProductStatus = async (id: string, isActive: boolean) => {
    const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};

export const deleteProduct = async (id: string, productName: string) => {
    const { error } = await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "delete_product",
            description: `Produk dihapus: ${productName}`,
        },
    ]);

    return { error: null };
};
