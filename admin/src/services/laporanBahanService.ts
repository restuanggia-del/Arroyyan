import { supabaseAdmin } from "../lib/supabaseAdmin";
import { MATERIAL_MINIMUM_STOCK } from "./materialService";

export type StokStatus = "aman" | "menipis" | "habis";

export interface MaterialStockReportRow {
    id: string;
    nama_bahan: string;
    satuan: string;
    is_active: boolean;
    saldo_saat_ini: number;
    total_masuk: number;
    total_keluar: number;
    status: StokStatus;
    isi_per_satuan: number | null;
    saldo_pcs: number | null;
}

const statusFor = (saldo: number): StokStatus => {
    if (saldo <= 0) return "habis";
    if (saldo <= MATERIAL_MINIMUM_STOCK) return "menipis";
    return "aman";
};

interface MovementAggRow {
    material_id: string;
    movement_type: string;
    quantity: number;
}

const fetchMovementsInRange = async (
    startDate: string,
    endDate: string,
): Promise<{ data: MovementAggRow[] | null; error: any }> => {
    const { data, error } = await supabaseAdmin
        .from("material_movements")
        .select("material_id, movement_type, quantity, created_at")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

    if (error) return { data: null, error };
    return { data: data as MovementAggRow[], error: null };
};

export const getStokGudangReport = async (
    startDate: string,
    endDate: string,
) => {
    const { data: materials, error: matErr } = await supabaseAdmin
        .from("materials")
        .select("id, nama_bahan, satuan, stock_quantity, is_active, isi_per_satuan")
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

        return {
            id: m.id,
            nama_bahan: m.nama_bahan,
            satuan: m.satuan,
            is_active: m.is_active,
            saldo_saat_ini: Number(m.stock_quantity),
            total_masuk,
            total_keluar,
            status: statusFor(Number(m.stock_quantity)),
            isi_per_satuan: isiPerSatuan,
            saldo_pcs: isiPerSatuan
                ? Number(m.stock_quantity) * isiPerSatuan
                : null,
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
        .select("id, nama_bahan, satuan, stock_sementara, is_active, isi_per_satuan")
        .order("nama_bahan", { ascending: true });

    if (matErr) return { data: null, error: matErr };

    const { data: movements, error: movErr } = await fetchMovementsInRange(
        startDate,
        endDate,
    );
    if (movErr) return { data: null, error: movErr };

    const IN_TYPES = new Set(["ke_sementara", "stok_awal_sementara"]);
    const OUT_TYPES = new Set(["produksi", "reject", "kembali_gudang"]);

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

        const isiPerSatuan: number | null = m.isi_per_satuan ?? null;

        return {
            id: m.id,
            nama_bahan: m.nama_bahan,
            satuan: m.satuan,
            is_active: m.is_active,
            saldo_saat_ini: Number(m.stock_sementara),
            total_masuk,
            total_keluar,
            total_reject,
            status: statusFor(Number(m.stock_sementara)),
            isi_per_satuan: isiPerSatuan,
            saldo_pcs: isiPerSatuan
                ? Number(m.stock_sementara) * isiPerSatuan
                : null,
        } as MaterialStockReportRow & { total_reject: number };
    });

    return { data: rows, error: null };
};
