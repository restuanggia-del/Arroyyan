import { supabaseAdmin } from "../lib/supabaseAdmin";

export const CHECKLIST_KEBERSIHAN_ITEMS: string[] = [
    "Bodi dicuci bersih (Bebas Noda/ Lumpur)",
    "Kaca Depan, Samping dan spion bersih",
    "Velg dan Ban Disikat/Dicuci",
    "Wiper bersih dan berfungsi baik (Tidak kotor)",
    "Kolong Spakbor bersih dari lumpur",
    "Bagian lantai dalam box bersih tidak berdebu (Disapu)",
    "Bagian langit-langit dalam box bersih",
    "Bagian dinding dalam box bersih",
    "Aroma dalam box segar (Tidak bau Apek)",
    "Tidak ada barang-barang selain produk",
];

export interface ChecklistOverviewRow {
    id: string;
    salesId: string;
    namaSales: string;
    kendaraan: string;
    tanggal: string;
    paraf: string;
    totalChecked: number;
    totalItems: number;
    keteranganUmum: string;
}

export interface ChecklistMatrixCell {
    isChecked: boolean;
    keterangan: string;
}

export interface ChecklistMatrixRow {
    itemNo: number;
    itemName: string;
    days: Record<number, ChecklistMatrixCell>;
}

const periodeRange = (periode: string) => {
    const [y, m] = periode.split("-").map(Number);
    const start = `${periode}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${periode}-${String(lastDay).padStart(2, "0")}`;
    return { start, end, lastDay };
};

export const getChecklistOverview = async (periode: string) => {
    const { start, end } = periodeRange(periode);

    const { data, error } = await supabaseAdmin
        .from("vehicle_checklists")
        .select(
            `id, sales_id, kendaraan, tanggal, paraf, keterangan_umum,
       sales ( nama_sales ),
       vehicle_checklist_items ( is_checked )`,
        )
        .gte("tanggal", start)
        .lte("tanggal", end)
        .order("tanggal", { ascending: false });

    if (error) return { data: null, error };

    const rows: ChecklistOverviewRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        salesId: r.sales_id,
        namaSales: r.sales?.nama_sales ?? "-",
        kendaraan: r.kendaraan,
        tanggal: r.tanggal,
        paraf: r.paraf ?? "-",
        keteranganUmum: r.keterangan_umum ?? "",
        totalChecked: (r.vehicle_checklist_items ?? []).filter(
            (it: any) => it.is_checked,
        ).length,
        totalItems: (r.vehicle_checklist_items ?? []).length,
    }));

    return { data: rows, error: null };
};

export const getVehiclesForSales = async (salesId: string) => {
    const { data, error } = await supabaseAdmin
        .from("vehicle_checklists")
        .select("kendaraan")
        .eq("sales_id", salesId)
        .order("created_at", { ascending: false })
        .limit(200);

    if (error) return { data: [] as string[], error };

    const set = new Set<string>();
    (data ?? []).forEach((r: any) => set.add(r.kendaraan));
    return { data: Array.from(set), error: null };
};

export const getChecklistMatrix = async (
    salesId: string,
    kendaraan: string,
    periode: string,
) => {
    const { start, end, lastDay } = periodeRange(periode);

    const { data, error } = await supabaseAdmin
        .from("vehicle_checklists")
        .select(
            `tanggal, paraf,
       vehicle_checklist_items ( item_no, item_name, is_checked, keterangan )`,
        )
        .eq("sales_id", salesId)
        .eq("kendaraan", kendaraan)
        .gte("tanggal", start)
        .lte("tanggal", end);

    if (error) {
        return { rows: [] as ChecklistMatrixRow[], parafByDay: {} as Record<number, string>, lastDay, error };
    }

    const rowsMap = new Map<number, ChecklistMatrixRow>();
    CHECKLIST_KEBERSIHAN_ITEMS.forEach((name, idx) => {
        rowsMap.set(idx + 1, { itemNo: idx + 1, itemName: name, days: {} });
    });

    const parafByDay: Record<number, string> = {};

    (data ?? []).forEach((entry: any) => {
        const day = Number(String(entry.tanggal).slice(8, 10));
        parafByDay[day] = entry.paraf ?? "";
        (entry.vehicle_checklist_items ?? []).forEach((it: any) => {
            const row = rowsMap.get(it.item_no);
            if (row) {
                row.days[day] = {
                    isChecked: it.is_checked,
                    keterangan: it.keterangan ?? "",
                };
            }
        });
    });

    return {
        rows: Array.from(rowsMap.values()).sort((a, b) => a.itemNo - b.itemNo),
        parafByDay,
        lastDay,
        error: null,
    };
};
