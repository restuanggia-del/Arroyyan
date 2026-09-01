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
        category: "cup" | "botol" | "galon";
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

export interface ProductStockSummaryRow {
    product_id: string;
    product_name: string;
    category: "cup" | "botol" | "galon";
    stokPusat: number;
    stokKaryawan: number;
    stokSales: number;
    minimumStok: number;
}

export const getStockSummaryWithProducts = async () => {
    const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, product_name, category")
        .eq("is_active", true)
        .order("product_name", { ascending: true });

    if (productsError) {
        console.error(
            "[stockService] getStockSummaryWithProducts products error:",
            productsError,
        );
        return { data: null, error: productsError };
    }

    const { data: stockRows, error: stockError } = await supabaseAdmin
        .from("stocks")
        .select("product_id, karyawan_id, sales_id, stock_quantity");

    if (stockError) {
        console.error(
            "[stockService] getStockSummaryWithProducts stocks error:",
            stockError,
        );
        return { data: null, error: stockError };
    }

    const summary = new Map<string, ProductStockSummaryRow>();
    for (const p of (products as any[]) ?? []) {
        summary.set(p.id, {
            product_id: p.id,
            product_name: p.product_name ?? "—",
            category: p.category,
            stokPusat: 0,
            stokKaryawan: 0,
            stokSales: 0,
            minimumStok: MINIMUM_STOCK,
        });
    }

    for (const row of (stockRows as any[]) ?? []) {
        const entry = summary.get(row.product_id);
        if (!entry) continue;
        if (row.karyawan_id === null && row.sales_id === null) {
            entry.stokPusat += row.stock_quantity ?? 0;
        } else if (row.karyawan_id !== null) {
            entry.stokKaryawan += row.stock_quantity ?? 0;
        } else if (row.sales_id !== null) {
            entry.stokSales += row.stock_quantity ?? 0;
        }
    }

    return { data: Array.from(summary.values()), error: null };
};

export const MINIMUM_STOCK = 100;
