import { supabaseAdmin } from "../lib/supabaseAdmin";

export type BonusRewardType = "dus_bonus" | "kaos" | "uang";
export type BonusAppliesTo = "umum" | "khusus";

export const REWARD_TYPE_LABEL: Record<BonusRewardType, string> = {
    dus_bonus: "Bonus Dus",
    kaos: "Kaos",
    uang: "Uang",
};

export const APPLIES_TO_LABEL: Record<BonusAppliesTo, string> = {
    umum: "Semua Karyawan",
    khusus: "Bonus Khusus Saja",
};

export interface BonusRule {
    id: string;
    threshold_dus: number;
    reward_type: BonusRewardType;
    reward_value: number;
    applies_to: BonusAppliesTo;
    keterangan: string | null;
    is_active: boolean;
    created_at: string;
}

export interface BonusRecord {
    id: string;
    karyawan_id: string;
    periode: string;
    total_dus_terjual: number;
    bonus_dus: number;
    bonus_kaos: number;
    bonus_target_rp: number;
    catatan: string | null;
    created_at: string;
    karyawan: { nama: string; bonus_khusus: boolean } | null;
}

export interface BonusPreviewRow {
    karyawan_id: string;
    nama: string;
    bonus_khusus: boolean;
    total_dus_terjual: number;
    bonus_dus: number;
    bonus_kaos: number;
    bonus_target_rp: number;
    matched_rules: BonusRule[];
}

const RULE_SELECT = `id, threshold_dus, reward_type, reward_value, applies_to, keterangan, is_active, created_at`;

export const getBonusRules = async () => {
    const { data, error } = await supabaseAdmin
        .from("bonus_rules")
        .select(RULE_SELECT)
        .order("threshold_dus", { ascending: true });

    if (error) return { data: null, error };
    return { data: (data as unknown) as BonusRule[], error: null };
};

export const createBonusRule = async (input: {
    threshold_dus: number;
    reward_type: BonusRewardType;
    reward_value: number;
    applies_to: BonusAppliesTo;
    keterangan?: string | null;
    is_active?: boolean;
}) => {
    const { data, error } = await supabaseAdmin
        .from("bonus_rules")
        .insert([{
            threshold_dus: input.threshold_dus,
            reward_type: input.reward_type,
            reward_value: input.reward_value,
            applies_to: input.applies_to,
            keterangan: input.keterangan || null,
            is_active: input.is_active ?? true,
        }])
        .select(RULE_SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_bonus_rule",
        description: `Aturan bonus baru: ${input.threshold_dus} dus -> ${REWARD_TYPE_LABEL[input.reward_type]} (${APPLIES_TO_LABEL[input.applies_to]})`,
    }]);

    return { data: (data as unknown) as BonusRule, error: null };
};

export const updateBonusRule = async (
    id: string,
    input: Partial<{
        threshold_dus: number;
        reward_type: BonusRewardType;
        reward_value: number;
        applies_to: BonusAppliesTo;
        keterangan: string | null;
        is_active: boolean;
    }>,
) => {
    const { error } = await supabaseAdmin
        .from("bonus_rules")
        .update({
            ...(input.threshold_dus !== undefined && { threshold_dus: input.threshold_dus }),
            ...(input.reward_type !== undefined && { reward_type: input.reward_type }),
            ...(input.reward_value !== undefined && { reward_value: input.reward_value }),
            ...(input.applies_to !== undefined && { applies_to: input.applies_to }),
            ...(input.keterangan !== undefined && { keterangan: input.keterangan || null }),
            ...(input.is_active !== undefined && { is_active: input.is_active }),
        })
        .eq("id", id);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_bonus_rule",
        description: `Aturan bonus diperbarui (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export const deleteBonusRule = async (id: string) => {
    const { error } = await supabaseAdmin.from("bonus_rules").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_bonus_rule",
        description: `Aturan bonus dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

const RECORD_SELECT = `
  id, karyawan_id, periode, total_dus_terjual, bonus_dus, bonus_kaos, bonus_target_rp, catatan, created_at,
  karyawan ( nama, bonus_khusus )
`;

export const getBonusRecords = async (periode?: string) => {
    let query = supabaseAdmin
        .from("bonus_records")
        .select(RECORD_SELECT)
        .order("periode", { ascending: false });

    if (periode) query = query.eq("periode", periode);

    const { data, error } = await query;
    if (error) return { data: null, error };
    return { data: (data as unknown) as BonusRecord[], error: null };
};

export const deleteBonusRecord = async (id: string) => {
    const { error } = await supabaseAdmin.from("bonus_records").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_bonus_record",
        description: `Rekap bonus dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export const calculateBonusPreview = async (
    periode: string,
): Promise<{ data: BonusPreviewRow[] | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    const [trxRes, rulesRes, karyawanRes] = await Promise.all([
        supabaseAdmin
            .from("transaction_details")
            .select(`
        quantity,
        products ( isi_per_dus ),
        transactions!inner ( karyawan_id, created_at )
      `)
            .gte("transactions.created_at", startDate)
            .lt("transactions.created_at", endDate),
        supabaseAdmin
            .from("bonus_rules")
            .select(RULE_SELECT)
            .eq("is_active", true)
            .order("threshold_dus", { ascending: true }),
        supabaseAdmin
            .from("karyawan")
            .select("id, nama, bonus_khusus")
            .eq("is_active", true),
    ]);

    if (trxRes.error) return { data: null, error: trxRes.error };
    if (rulesRes.error) return { data: null, error: rulesRes.error };
    if (karyawanRes.error) return { data: null, error: karyawanRes.error };

    const rules = (rulesRes.data as unknown as BonusRule[]) ?? [];
    const karyawanList = (karyawanRes.data ?? []) as { id: string; nama: string; bonus_khusus: boolean }[];
    const namaMap = new Map(karyawanList.map((k) => [k.id, k]));

    const dusMap = new Map<string, number>();

    for (const row of (trxRes.data ?? []) as any[]) {
        const karyawanId: string | null = row.transactions?.karyawan_id ?? null;
        if (!karyawanId) continue;
        const isiPerDus: number = row.products?.isi_per_dus ?? 0;
        if (!isiPerDus) continue;
        const dus = Number(row.quantity) / isiPerDus;
        dusMap.set(karyawanId, (dusMap.get(karyawanId) ?? 0) + dus);
    }

    const result: BonusPreviewRow[] = [];

    for (const [karyawanId, totalDus] of dusMap.entries()) {
        const k = namaMap.get(karyawanId);
        const nama = k?.nama ?? "(Karyawan tidak aktif)";
        const bonusKhusus = k?.bonus_khusus ?? false;

        const eligibleRules = rules.filter(
            (r) => r.applies_to === "umum" || (r.applies_to === "khusus" && bonusKhusus),
        );

        const bestByType: Partial<Record<BonusRewardType, BonusRule>> = {};
        for (const rule of eligibleRules) {
            if (totalDus < rule.threshold_dus) continue;
            const current = bestByType[rule.reward_type];
            if (!current || rule.threshold_dus > current.threshold_dus) {
                bestByType[rule.reward_type] = rule;
            }
        }

        const matchedRules = Object.values(bestByType).filter(Boolean) as BonusRule[];

        result.push({
            karyawan_id: karyawanId,
            nama,
            bonus_khusus: bonusKhusus,
            total_dus_terjual: Math.round(totalDus * 100) / 100,
            bonus_dus: bestByType.dus_bonus?.reward_value ?? 0,
            bonus_kaos: bestByType.kaos?.reward_value ?? 0,
            bonus_target_rp: bestByType.uang?.reward_value ?? 0,
            matched_rules: matchedRules,
        });
    }

    result.sort((a, b) => b.total_dus_terjual - a.total_dus_terjual);

    return { data: result, error: null };
};

export const saveBonusRecords = async (
    periode: string,
    records: {
        karyawan_id: string;
        total_dus_terjual: number;
        bonus_dus: number;
        bonus_kaos: number;
        bonus_target_rp: number;
        catatan?: string | null;
    }[],
) => {
    if (records.length === 0) {
        return { data: [], error: null };
    }

    const rows = records.map((r) => ({
        karyawan_id: r.karyawan_id,
        periode,
        total_dus_terjual: r.total_dus_terjual,
        bonus_dus: r.bonus_dus,
        bonus_kaos: r.bonus_kaos,
        bonus_target_rp: r.bonus_target_rp,
        catatan: r.catatan || null,
    }));

    const { data, error } = await supabaseAdmin
        .from("bonus_records")
        .upsert(rows, { onConflict: "karyawan_id,periode" })
        .select(RECORD_SELECT);

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "save_bonus_records",
        description: `Rekap bonus periode ${periode} disimpan untuk ${records.length} karyawan`,
    }]);

    return { data: (data as unknown) as BonusRecord[], error: null };
};
