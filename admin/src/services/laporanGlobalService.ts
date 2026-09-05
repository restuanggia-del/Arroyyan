import { supabaseAdmin } from "../lib/supabaseAdmin";
import { toDusQuantity, estimasiRpFromDus } from "../services/unitConversion";

export interface LaporanGlobalRow {
    product_id: string;
    product_name: string;
    size: string | null;
    category: "cup" | "botol" | "galon";
    stok_awal_dus: number;
    total_produksi_dus: number;
    total_keluar_dus: number;
    sisa_stok_dus: number;
    penjualan_cash_dus: number;
    penjualan_cash_rp: number;
    penjualan_bon_dus: number;
    penjualan_bon_rp: number;
    penjualan_total_dus: number;
    penjualan_total_rp: number;
    sodaqoh_dus: number;
    sodaqoh_rp: number;
    pribadi_dus: number;
    pribadi_rp: number;
    bonus_dus: number;
    bonus_rp: number;
    retur_dus: number;
    retur_rp: number;
}

const emptyRow = (product: {
    id: string;
    product_name: string;
    size: string | null;
    category: "cup" | "botol" | "galon";
}): LaporanGlobalRow => ({
    product_id: product.id,
    product_name: product.product_name,
    size: product.size,
    category: product.category,
    stok_awal_dus: 0,
    total_produksi_dus: 0,
    total_keluar_dus: 0,
    sisa_stok_dus: 0,
    penjualan_cash_dus: 0,
    penjualan_cash_rp: 0,
    penjualan_bon_dus: 0,
    penjualan_bon_rp: 0,
    penjualan_total_dus: 0,
    penjualan_total_rp: 0,
    sodaqoh_dus: 0,
    sodaqoh_rp: 0,
    pribadi_dus: 0,
    pribadi_rp: 0,
    bonus_dus: 0,
    bonus_rp: 0,
    retur_dus: 0,
    retur_rp: 0,
});

const KELUAR_TYPES = [
    "distribution_out",
    "sale_out",
    "sodaqoh_out",
    "pribadi_out",
    "bonus_out",
    "return_out",
];

export const getLaporanGlobal = async (
    periode: string,
): Promise<{ data: LaporanGlobalRow[] | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [productsRes, movementsRes, stocksRes, trxRes] = await Promise.all([
        supabaseAdmin
            .from("products")
            .select("id, product_name, size, category, unit, isi_per_dus, price")
            .order("category", { ascending: true })
            .order("size", { ascending: true }),
        supabaseAdmin
            .from("stock_movements")
            .select("product_id, movement_type, quantity")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin.from("stocks").select("product_id, stock_quantity"),
        supabaseAdmin
            .from("transaction_details")
            .select(`
        product_id, quantity, subtotal,
        transactions!inner ( payment_method, created_at )
      `)
            .gte("transactions.created_at", startDate)
            .lt("transactions.created_at", endDate),
    ]);

    if (productsRes.error) return { data: null, error: productsRes.error };
    if (movementsRes.error) return { data: null, error: movementsRes.error };
    if (stocksRes.error) return { data: null, error: stocksRes.error };
    if (trxRes.error) return { data: null, error: trxRes.error };

    const products = (productsRes.data ?? []) as {
        id: string;
        product_name: string;
        size: string | null;
        category: "cup" | "botol" | "galon";
        unit: string | null;
        isi_per_dus: number | null;
        price: number;
    }[];

    const isiPerDusMap = new Map(products.map((p) => [p.id, p.isi_per_dus || 0]));
    const unitMap = new Map(products.map((p) => [p.id, p.unit]));
    const priceMap = new Map(products.map((p) => [p.id, Number(p.price) || 0]));

    const rowMap = new Map<string, LaporanGlobalRow>();
    for (const p of products) {
        rowMap.set(p.id, emptyRow(p));
    }
    const getRow = (productId: string) => rowMap.get(productId);
    const toDus = (productId: string, qty: number) =>
        toDusQuantity(qty, unitMap.get(productId), isiPerDusMap.get(productId));
    const estimasiRp = (productId: string, dus: number) =>
        estimasiRpFromDus(
            dus,
            unitMap.get(productId),
            isiPerDusMap.get(productId),
            priceMap.get(productId),
        );

    for (const m of (movementsRes.data ?? []) as any[]) {
        const row = getRow(m.product_id);
        if (!row) continue;
        const dus = toDus(m.product_id, Number(m.quantity));

        if (m.movement_type === "stok_awal") {
            row.stok_awal_dus += dus;
        } else if (m.movement_type === "stock_in") {
            row.total_produksi_dus += dus;
        } else if (m.movement_type === "sodaqoh_out") {
            row.sodaqoh_dus += dus;
        } else if (m.movement_type === "pribadi_out") {
            row.pribadi_dus += dus;
        } else if (m.movement_type === "bonus_out") {
            row.bonus_dus += dus;
        } else if (m.movement_type === "return_out") {
            row.retur_dus += dus;
        }

        if (KELUAR_TYPES.includes(m.movement_type)) {
            row.total_keluar_dus += dus;
        }
    }

    for (const s of (stocksRes.data ?? []) as any[]) {
        const row = getRow(s.product_id);
        if (!row) continue;
        row.sisa_stok_dus += toDus(s.product_id, Number(s.stock_quantity));
    }

    for (const t of (trxRes.data ?? []) as any[]) {
        const row = getRow(t.product_id);
        if (!row) continue;
        const dus = toDus(t.product_id, Number(t.quantity));
        const rp = Number(t.subtotal);
        const isBon = t.transactions?.payment_method === "kasbon";

        if (isBon) {
            row.penjualan_bon_dus += dus;
            row.penjualan_bon_rp += rp;
        } else {
            row.penjualan_cash_dus += dus;
            row.penjualan_cash_rp += rp;
        }
        row.penjualan_total_dus += dus;
        row.penjualan_total_rp += rp;
    }

    for (const row of rowMap.values()) {
        row.sodaqoh_rp = estimasiRp(row.product_id, row.sodaqoh_dus);
        row.pribadi_rp = estimasiRp(row.product_id, row.pribadi_dus);
        row.bonus_rp = estimasiRp(row.product_id, row.bonus_dus);
        row.retur_rp = estimasiRp(row.product_id, row.retur_dus);
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const result = Array.from(rowMap.values()).map((r) => ({
        ...r,
        stok_awal_dus: round2(r.stok_awal_dus),
        total_produksi_dus: round2(r.total_produksi_dus),
        total_keluar_dus: round2(r.total_keluar_dus),
        sisa_stok_dus: round2(r.sisa_stok_dus),
        penjualan_cash_dus: round2(r.penjualan_cash_dus),
        penjualan_bon_dus: round2(r.penjualan_bon_dus),
        penjualan_total_dus: round2(r.penjualan_total_dus),
        sodaqoh_dus: round2(r.sodaqoh_dus),
        pribadi_dus: round2(r.pribadi_dus),
        bonus_dus: round2(r.bonus_dus),
        retur_dus: round2(r.retur_dus),
        sodaqoh_rp: Math.round(r.sodaqoh_rp),
        pribadi_rp: Math.round(r.pribadi_rp),
        bonus_rp: Math.round(r.bonus_rp),
        retur_rp: Math.round(r.retur_rp),
    }));

    return { data: result, error: null };
};
