import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface StockItem {
    id: string;
    product_id: string;
    karyawan_id: string | null;
    sales_id: string | null;
    stock_quantity: number;
    created_at: string;
    products: {
        id: string;
        product_name: string;
        category: "cup" | "botol";
    } | null;
}

export interface StockMovement {
    id: string;
    product_id: string;
    karyawan_id: string | null;
    sales_id: string | null;
    movement_type:
    | "stock_in"
    | "stok_awal"
    | "distribution_out"
    | "distribution_in"
    | "sale_out"
    | "sodaqoh_out"
    | "pribadi_out"
    | "bonus_out"
    | "return_out";
    quantity: number;
    note: string | null;
    created_at: string;
    products: { product_name: string; category: string } | null;
    karyawan: { nama: string } | null;
    sales: { nama_sales: string } | null;
}

export const getCentralStock = async () => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`
      id,
      product_id,
      karyawan_id,
      sales_id,
      stock_quantity,
      created_at,
      products ( id, product_name, category )
    `)
        .is("karyawan_id", null)
        .is("sales_id", null);

    if (error) {
        console.error("[stockService] getCentralStock error:", error);
        return { data: null, error };
    }
    return { data: (data as unknown) as StockItem[], error: null };
};

export const getKaryawanStock = async (karyawanId: string) => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`
      id,
      product_id,
      karyawan_id,
      sales_id,
      stock_quantity,
      created_at,
      products ( id, product_name, category )
    `)
        .eq("karyawan_id", karyawanId);

    if (error) {
        console.error("[stockService] getKaryawanStock error:", error);
        return { data: null, error };
    }
    return { data: (data as unknown) as StockItem[], error: null };
};

export const getSalesStock = async (salesId: string) => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`
      id,
      product_id,
      karyawan_id,
      sales_id,
      stock_quantity,
      created_at,
      products ( id, product_name, category )
    `)
        .eq("sales_id", salesId);

    if (error) {
        console.error("[stockService] getSalesStock error:", error);
        return { data: null, error };
    }
    return { data: (data as unknown) as StockItem[], error: null };
};

export const getAllStockSummary = async () => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`
      id,
      product_id,
      karyawan_id,
      sales_id,
      stock_quantity,
      created_at,
      products ( id, product_name, category )
    `);

    if (error) {
        console.error("[stockService] getAllStockSummary error:", error);
        return { data: null, error };
    }

    return { data: (data as unknown) as StockItem[], error: null };
};

export const getStockMovements = async (limit = 50) => {
    const { data, error } = await supabaseAdmin
        .from("stock_movements")
        .select(`
      id,
      product_id,
      karyawan_id,
      sales_id,
      movement_type,
      quantity,
      note,
      created_at,
      products ( product_name, category ),
      karyawan ( nama ),
      sales ( nama_sales )
    `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[stockService] getStockMovements error:", error);
        return { data: null, error };
    }

    return { data: (data as unknown) as StockMovement[], error: null };
};

export const addCentralStock = async (
    productId: string,
    quantity: number,
    movementType: "stock_in" | "stok_awal",
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("stocks")
        .select("id, stock_quantity")
        .eq("product_id", productId)
        .is("karyawan_id", null)
        .is("sales_id", null)
        .maybeSingle();

    if (fetchErr) {
        console.error("[stockService] addCentralStock fetch error:", fetchErr);
        return { error: fetchErr };
    }

    if (existing) {
        const { error } = await supabaseAdmin
            .from("stocks")
            .update({ stock_quantity: existing.stock_quantity + quantity })
            .eq("id", existing.id);
        if (error) return { error };
    } else {
        const { error } = await supabaseAdmin
            .from("stocks")
            .insert([{ product_id: productId, karyawan_id: null, sales_id: null, stock_quantity: quantity }]);
        if (error) return { error };
    }

    const { error: movErr } = await supabaseAdmin
        .from("stock_movements")
        .insert([{
            product_id: productId,
            karyawan_id: null,
            sales_id: null,
            movement_type: movementType,
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const reduceCentralStock = async (
    productId: string,
    quantity: number,
    movementType: "sale_out" | "sodaqoh_out" | "pribadi_out" | "bonus_out",
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("stocks")
        .select("id, stock_quantity")
        .eq("product_id", productId)
        .is("karyawan_id", null)
        .is("sales_id", null)
        .maybeSingle();

    if (fetchErr) return { error: fetchErr };
    if (!existing) return { error: { message: "Stok pusat untuk produk ini belum ada." } };
    if (existing.stock_quantity < quantity) {
        return { error: { message: "Stok tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("stocks")
        .update({ stock_quantity: existing.stock_quantity - quantity })
        .eq("id", existing.id);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("stock_movements")
        .insert([{
            product_id: productId,
            karyawan_id: null,
            sales_id: null,
            movement_type: movementType,
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const MINIMUM_STOCK = 100;
