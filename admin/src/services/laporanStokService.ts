import { supabaseAdmin } from "../lib/supabaseAdmin";

export type StokProdukStatus = "aman" | "menipis" | "habis";

export interface ProductStockReportRow {
    product_id: string;
    product_name: string;
    category: "cup" | "botol" | "galon";
    unit: string;
    is_active: boolean;
    stok_pusat: number;
    stok_lapangan: number;
    total_stok: number;
    minimum_stock: number;
    status: StokProdukStatus;
    total_masuk: number;
    total_keluar: number;
}

const DEFAULT_MINIMUM_STOCK = 100;

const statusFor = (total: number, minimum: number): StokProdukStatus => {
    if (total <= 0) return "habis";
    if (total <= minimum) return "menipis";
    return "aman";
};

const IN_TYPES = new Set([
    "stock_in",
    "stok_awal",
    "distribution_in",
    "return_out",
    "koreksi_tambah",
]);
const OUT_TYPES = new Set([
    "distribution_out",
    "sale_out",
    "sodaqoh_out",
    "pribadi_out",
    "bonus_out",
    "koreksi_kurang",
]);

interface StockMovementAggRow {
    product_id: string;
    movement_type: string;
    quantity: number;
}

export const getLaporanStokProduk = async (
    startDate: string,
    endDate: string,
) => {
    const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, product_name, category, unit, minimum_stock, is_active")
        .order("product_name", { ascending: true });

    if (productsError) {
        console.error(
            "[laporanStokService] getLaporanStokProduk products error:",
            productsError,
        );
        return { data: null, error: productsError };
    }

    const { data: stockRows, error: stockError } = await supabaseAdmin
        .from("stocks")
        .select("product_id, karyawan_id, sales_id, stock_quantity");

    if (stockError) {
        console.error(
            "[laporanStokService] getLaporanStokProduk stocks error:",
            stockError,
        );
        return { data: null, error: stockError };
    }

    const { data: movements, error: movError } = await supabaseAdmin
        .from("stock_movements")
        .select("product_id, movement_type, quantity, created_at")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

    if (movError) {
        console.error(
            "[laporanStokService] getLaporanStokProduk movements error:",
            movError,
        );
        return { data: null, error: movError };
    }

    const summary = new Map<string, ProductStockReportRow>();
    for (const p of (products as any[]) ?? []) {
        summary.set(p.id, {
            product_id: p.id,
            product_name: p.product_name ?? "—",
            category: p.category,
            unit: p.unit ?? "unit",
            is_active: p.is_active ?? true,
            stok_pusat: 0,
            stok_lapangan: 0,
            total_stok: 0,
            minimum_stock: p.minimum_stock ?? DEFAULT_MINIMUM_STOCK,
            status: "aman",
            total_masuk: 0,
            total_keluar: 0,
        });
    }

    for (const row of (stockRows as any[]) ?? []) {
        const entry = summary.get(row.product_id);
        if (!entry) continue;
        const qty = Number(row.stock_quantity) || 0;
        entry.total_stok += qty;
        if (row.karyawan_id === null && row.sales_id === null) {
            entry.stok_pusat += qty;
        } else {
            entry.stok_lapangan += qty;
        }
    }

    for (const mv of (movements as StockMovementAggRow[]) ?? []) {
        const entry = summary.get(mv.product_id);
        if (!entry) continue;
        const qty = Number(mv.quantity) || 0;
        if (IN_TYPES.has(mv.movement_type)) entry.total_masuk += qty;
        else if (OUT_TYPES.has(mv.movement_type)) entry.total_keluar += qty;
    }

    for (const entry of summary.values()) {
        entry.status = statusFor(entry.total_stok, entry.minimum_stock);
    }

    return { data: Array.from(summary.values()), error: null };
};
