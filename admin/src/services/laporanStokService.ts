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

export interface KartuStokRow {
    created_at: string;
    uraian: string;
    masuk: number;
    keluar: number;
    sisa: number;
}

export interface KartuStokProduk {
    product_id: string;
    product_name: string;
    category: "cup" | "botol" | "galon";
    size: string | null;
    unit: string;
    isi_per_dus: number | null;
    stok_awal: number;
    rows: KartuStokRow[];
    stok_akhir: number;
}

interface StockMovementLedgerRow {
    product_id: string;
    movement_type: string;
    quantity: number;
    note: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
    sales: { nama_sales: string } | null;
}

const describeMovement = (mv: StockMovementLedgerRow): string => {
    const note = mv.note?.trim();
    if (note) return note;

    const who = mv.sales?.nama_sales || mv.karyawan?.nama;
    switch (mv.movement_type) {
        case "stok_awal":
            return "Stok Awal";
        case "stock_in":
            return "Produksi";
        case "distribution_out":
            return who ? `Distribusi ke ${who}` : "Distribusi Keluar";
        case "distribution_in":
            return who ? `Retur dari ${who}` : "Distribusi Masuk";
        case "sale_out":
            return "Penjualan Langsung";
        case "sodaqoh_out":
            return "Sodaqoh";
        case "pribadi_out":
            return "Pribadi";
        case "bonus_out":
            return "Bonus";
        case "return_out":
            return "Retur";
        case "koreksi_tambah":
            return "Koreksi Tambah";
        case "koreksi_kurang":
            return "Koreksi Kurang";
        default:
            return mv.movement_type;
    }
};

export const getKartuStokSemuaProduk = async (
    startDate: string,
    endDate: string,
) => {
    const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, product_name, category, size, unit, isi_per_dus")
        .eq("is_active", true)
        .order("product_name", { ascending: true });

    if (productsError) {
        console.error(
            "[laporanStokService] getKartuStokSemuaProduk products error:",
            productsError,
        );
        return { data: null, error: productsError };
    }

    const { data: movements, error: movError } = await supabaseAdmin
        .from("stock_movements")
        .select(
            `
      product_id, movement_type, quantity, note, created_at,
      karyawan ( nama ),
      sales ( nama_sales )
    `,
        )
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: true });

    if (movError) {
        console.error(
            "[laporanStokService] getKartuStokSemuaProduk movements error:",
            movError,
        );
        return { data: null, error: movError };
    }

    const byProduct = new Map<string, StockMovementLedgerRow[]>();
    for (const mv of (movements as unknown as StockMovementLedgerRow[]) ?? []) {
        if (!byProduct.has(mv.product_id)) byProduct.set(mv.product_id, []);
        byProduct.get(mv.product_id)!.push(mv);
    }

    const startBoundary = `${startDate}T00:00:00`;

    const result: KartuStokProduk[] = ((products as any[]) ?? []).map((p) => {
        const movs = byProduct.get(p.id) ?? [];
        let running = 0;
        let stokAwal = 0;
        const rows: KartuStokRow[] = [];

        for (const mv of movs) {
            const qty = Number(mv.quantity) || 0;
            const isIn = IN_TYPES.has(mv.movement_type);
            running += isIn ? qty : -qty;

            if (mv.created_at < startBoundary) {
                stokAwal = running;
            } else {
                rows.push({
                    created_at: mv.created_at,
                    uraian: describeMovement(mv),
                    masuk: isIn ? qty : 0,
                    keluar: isIn ? 0 : qty,
                    sisa: running,
                });
            }
        }

        return {
            product_id: p.id,
            product_name: p.product_name ?? "—",
            category: p.category,
            size: p.size ?? null,
            unit: p.unit ?? "unit",
            isi_per_dus: p.isi_per_dus ?? null,
            stok_awal: stokAwal,
            rows,
            stok_akhir: running,
        };
    });

    return { data: result, error: null };
};
