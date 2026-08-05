import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface ProductPrice {
    id: string;
    product_id: string;
    price: number;
    label: string | null;
    is_active: boolean;
    created_at: string;
}

// Semua opsi harga (aktif) untuk satu produk, dipakai di form Manajemen Produk.
export const getProductPrices = async (productId: string) => {
    const { data, error } = await supabase
        .from("product_prices")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as ProductPrice[], error: null };
};

// Semua opsi harga aktif untuk semua produk sekaligus, dipakai di
// Transaksi Penjualan supaya tidak perlu 1 query per produk.
export const getAllActiveProductPrices = async () => {
    const { data, error } = await supabase
        .from("product_prices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as ProductPrice[], error: null };
};

export const createProductPrice = async (
    productPrice: Pick<ProductPrice, "product_id" | "price" | "label" | "is_active">
) => {
    const { data, error } = await supabaseAdmin
        .from("product_prices")
        .insert([productPrice])
        .select()
        .single();

    if (error) return { data: null, error };
    return { data: data as ProductPrice, error: null };
};

export const updateProductPrice = async (
    id: string,
    productPrice: Partial<Pick<ProductPrice, "price" | "label" | "is_active">>
) => {
    const { data, error } = await supabaseAdmin
        .from("product_prices")
        .update(productPrice)
        .eq("id", id)
        .select()
        .single();

    if (error) return { data: null, error };
    return { data: data as ProductPrice, error: null };
};

export const deleteProductPrice = async (id: string) => {
    const { error } = await supabaseAdmin
        .from("product_prices")
        .delete()
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};
