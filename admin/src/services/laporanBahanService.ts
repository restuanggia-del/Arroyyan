import { supabaseAdmin } from "../lib/supabaseAdmin";
import { getMaterialMinimumStock } from "./materialService";

export type StokStatus = "aman" | "menipis" | "habis";

export interface MaterialStockReportRow {
    id: string;
    nama_bahan: string;
    satuan: string;
    is_active: boolean;
    saldo_saat_ini: number;
    total_masuk: number;
    total_keluar: number;
    total_reject?: number;
    total_reject_bahan?: number;
    total_sampel?: number;
    status: StokStatus;
    isi_per_satuan: number | null;
    saldo_pcs: number | null;
    minimum_stock: number;
}

export interface ReasonBreakdownRow {
    reason: string;
    total_qty: number;
}

const statusFor = (saldo: number, minimumStock: number): StokStatus => {
    if (saldo <= 0) return "habis";
    if (saldo <= minimumStock) return "menipis";
    return "aman";
};

interface MovementAggRow {
    material_id: string;
    movement_type: string;
    quantity: number;
    reason?: string | null;
}

const fetchMovementsInRange = async (
    startDate: string,
    endDate: string,
): Promise<{ data: MovementAggRow[] | null; error: any }> => {
    const { data, error } = await supabaseAdmin
        .from("material_movements")
        .select("material_id, movement_type, quantity, reason, created_at")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

    if (error) return { data: null, error };
    return { data: data as MovementAggRow[], error: null };
};

export const getRejectReasonBreakdown = async (
    startDate: string,
    endDate: string,
    movementType: "reject" | "reject_bahan" = "reject",
): Promise<{ data: ReasonBreakdownRow[] | null; error: any }> => {
    const { data, error } = await supabaseAdmin
        .from("material_movements")
        .select("reason, quantity")
        .eq("movement_type", movementType)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

    if (error) return { data: null, error };

    const map = new Map<string, number>();
    for (const row of (data as any[]) ?? []) {
        const key = row.reason?.trim() || "Tidak diisi";
        map.set(key, (map.get(key) || 0) + Number(row.quantity || 0));
    }

    const rows: ReasonBreakdownRow[] = Array.from(map.entries())
        .map(([reason, total_qty]) => ({ reason, total_qty }))
        .sort((a, b) => b.total_qty - a.total_qty);

    return { data: rows, error: null };
};

export const getStokGudangReport = async (
    startDate: string,
    endDate: string,
) => {
    const { data: materials, error: matErr } = await supabaseAdmin
        .from("materials")
        .select("id, nama_bahan, satuan, stock_quantity, is_active, isi_per_satuan, minimum_stock")
        .order("nama_bahan", { ascending: true });

    if (matErr) return { data: null, error: matErr };

    const { data: movements, error: movErr } = await fetchMovementsInRange(
        startDate,
        endDate,
    );
    if (movErr) return { data: null, error: movErr };

    const IN_TYPES = new Set(["masuk", "stok_awal", "kembali_gudang"]);
    const OUT_TYPES = new Set(["keluar", "ke_sementara"]);

    const rows: MaterialStockReportRow[] = (materials ?? []).map((m: any) => {
        const relevant = (movements ?? []).filter(
            (mv) => mv.material_id === m.id,
        );
        const total_masuk = relevant
            .filter((mv) => IN_TYPES.has(mv.movement_type))
            .reduce((s, mv) => s + Number(mv.quantity), 0);
        const total_keluar = relevant
            .filter((mv) => OUT_TYPES.has(mv.movement_type))
            .reduce((s, mv) => s + Number(mv.quantity), 0);

        const isiPerSatuan: number | null = m.isi_per_satuan ?? null;
        const minimumStock = getMaterialMinimumStock(m);

        return {
            id: m.id,
            nama_bahan: m.nama_bahan,
            satuan: m.satuan,
            is_active: m.is_active,
            saldo_saat_ini: Number(m.stock_quantity),
            total_masuk,
            total_keluar,
            status: statusFor(Number(m.stock_quantity), minimumStock),
            isi_per_satuan: isiPerSatuan,
            saldo_pcs: isiPerSatuan
                ? Number(m.stock_quantity) * isiPerSatuan
                : null,
            minimum_stock: minimumStock,
        };
    });

    return { data: rows, error: null };
};

export const getStokSementaraReport = async (
    startDate: string,
    endDate: string,
) => {
    const { data: materials, error: matErr } = await supabaseAdmin
        .from("materials")
        .select("id, nama_bahan, satuan, stock_sementara, is_active, isi_per_satuan, minimum_stock")
        .order("nama_bahan", { ascending: true });

    if (matErr) return { data: null, error: matErr };

    const { data: movements, error: movErr } = await fetchMovementsInRange(
        startDate,
        endDate,
    );
    if (movErr) return { data: null, error: movErr };

    const IN_TYPES = new Set(["ke_sementara", "stok_awal_sementara"]);
    const OUT_TYPES = new Set([
        "produksi",
        "reject",
        "reject_bahan",
        "sampel_out",
        "kembali_gudang",
    ]);

    const rows: MaterialStockReportRow[] = (materials ?? []).map((m: any) => {
        const relevant = (movements ?? []).filter(
            (mv) => mv.material_id === m.id,
        );
        const total_masuk = relevant
            .filter((mv) => IN_TYPES.has(mv.movement_type))
            .reduce((s, mv) => s + Number(mv.quantity), 0);
        const total_keluar = relevant
            .filter((mv) => OUT_TYPES.has(mv.movement_type))
            .reduce((s, mv) => s + Number(mv.quantity), 0);
        const total_reject = relevant
            .filter((mv) => mv.movement_type === "reject")
            .reduce((s, mv) => s + Number(mv.quantity), 0);
        const total_reject_bahan = relevant
            .filter((mv) => mv.movement_type === "reject_bahan")
            .reduce((s, mv) => s + Number(mv.quantity), 0);
        const total_sampel = relevant
            .filter((mv) => mv.movement_type === "sampel_out")
            .reduce((s, mv) => s + Number(mv.quantity), 0);

        const isiPerSatuan: number | null = m.isi_per_satuan ?? null;
        const minimumStock = getMaterialMinimumStock(m);

        return {
            id: m.id,
            nama_bahan: m.nama_bahan,
            satuan: m.satuan,
            is_active: m.is_active,
            saldo_saat_ini: Number(m.stock_sementara),
            total_masuk,
            total_keluar,
            total_reject,
            total_reject_bahan,
            total_sampel,
            status: statusFor(Number(m.stock_sementara), minimumStock),
            isi_per_satuan: isiPerSatuan,
            saldo_pcs: isiPerSatuan
                ? Number(m.stock_sementara) * isiPerSatuan
                : null,
            minimum_stock: minimumStock,
        };
    });

    return { data: rows, error: null };
};
