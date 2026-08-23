import { supabaseAdmin } from "../lib/supabaseAdmin";

export type BonusRewardType = "dus_bonus" | "kaos" | "uang";
export type BonusAppliesTo = "umum" | "khusus";
export type BonusRuleMode = "ratio" | "threshold";
export type BonusTargetType = "karyawan" | "sales" | "semua";
export type BonusOwnerType = "karyawan" | "sales";

export const REWARD_TYPE_LABEL: Record<BonusRewardType, string> = {
    dus_bonus: "Bonus Dus",
    kaos: "Kaos",
    uang: "Uang",
};

export const APPLIES_TO_LABEL: Record<BonusAppliesTo, string> = {
    umum: "Semua Karyawan",
    khusus: "Bonus Khusus Saja",
};

export const RULE_MODE_LABEL: Record<BonusRuleMode, string> = {
    ratio: "Rasio (berulang tiap kelipatan)",
    threshold: "Threshold (sekali capai)",
};

export const TARGET_TYPE_LABEL: Record<BonusTargetType, string> = {
    karyawan: "Khusus Karyawan",
    sales: "Khusus Sales",
    semua: "Karyawan & Sales",
};

export const OWNER_TYPE_LABEL: Record<BonusOwnerType, string> = {
    karyawan: "Karyawan",
    sales: "Sales",
};

export interface BonusRule {
    id: string;
    threshold_dus: number;
    reward_type: BonusRewardType;
    reward_value: number;
    applies_to: BonusAppliesTo;
    rule_mode: BonusRuleMode;
    target_type: BonusTargetType;
    keterangan: string | null;
    is_active: boolean;
    created_at: string;
}

export interface BonusRecord {
    id: string;
    karyawan_id: string | null;
    sales_id: string | null;
    periode: string;
    total_dus_terjual: number;
    bonus_dus: number;
    bonus_kaos: number;
    bonus_target_rp: number;
    catatan: string | null;
    created_at: string;
    karyawan: { nama: string; bonus_khusus: boolean } | null;
    sales: { nama_sales: string } | null;
}

export interface BonusPreviewRow {
    owner_type: BonusOwnerType;
    owner_id: string;
    nama: string;
    bonus_khusus: boolean;
    total_dus_terjual: number;
    bonus_dus: number;
    bonus_kaos: number;
    bonus_target_rp: number;
    matched_rules: BonusRule[];
}

const RULE_SELECT = `id, threshold_dus, reward_type, reward_value, applies_to, rule_mode, target_type, keterangan, is_active, created_at`;

export const getBonusRules = async () => {
    const { data, error } = await supabaseAdmin
        .from("bonus_rules")
        .select(RULE_SELECT)
        .order("rule_mode", { ascending: true })
        .order("threshold_dus", { ascending: true });

    if (error) return { data: null, error };
    return { data: (data as unknown) as BonusRule[], error: null };
};

export const createBonusRule = async (input: {
    threshold_dus: number;
    reward_type: BonusRewardType;
    reward_value: number;
    applies_to: BonusAppliesTo;
    rule_mode: BonusRuleMode;
    target_type: BonusTargetType;
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
            rule_mode: input.rule_mode,
            target_type: input.target_type,
            keterangan: input.keterangan || null,
            is_active: input.is_active ?? true,
        }])
        .select(RULE_SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_bonus_rule",
        description: `Aturan bonus baru (${RULE_MODE_LABEL[input.rule_mode]}): ${input.threshold_dus} dus -> ${REWARD_TYPE_LABEL[input.reward_type]} (${TARGET_TYPE_LABEL[input.target_type]})`,
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
        rule_mode: BonusRuleMode;
        target_type: BonusTargetType;
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
            ...(input.rule_mode !== undefined && { rule_mode: input.rule_mode }),
            ...(input.target_type !== undefined && { target_type: input.target_type }),
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
  id, karyawan_id, sales_id, periode, total_dus_terjual, bonus_dus, bonus_kaos, bonus_target_rp, catatan, created_at,
  karyawan ( nama, bonus_khusus ),
  sales ( nama_sales )
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

export const getBonusRecordsByPeriodeRange = async (startPeriode: string, endPeriode: string) => {
    const { data, error } = await supabaseAdmin
        .from("bonus_records")
        .select(RECORD_SELECT)
        .gte("periode", startPeriode)
        .lte("periode", endPeriode)
        .order("periode", { ascending: false });

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

    const [trxRes, rulesRes, karyawanRes, salesRes] = await Promise.all([
        supabaseAdmin
            .from("transaction_details")
            .select(`
        quantity,
        products ( isi_per_dus ),
        transactions!inner ( karyawan_id, sales_id, created_at )
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
        supabaseAdmin
            .from("sales")
            .select("id, nama_sales")
            .eq("is_active", true),
    ]);

    if (trxRes.error) return { data: null, error: trxRes.error };
    if (rulesRes.error) return { data: null, error: rulesRes.error };
    if (karyawanRes.error) return { data: null, error: karyawanRes.error };
    if (salesRes.error) return { data: null, error: salesRes.error };

    const rules = (rulesRes.data as unknown as BonusRule[]) ?? [];
    const karyawanList = (karyawanRes.data ?? []) as { id: string; nama: string; bonus_khusus: boolean }[];
    const salesList = (salesRes.data ?? []) as { id: string; nama_sales: string }[];
    const karyawanMap = new Map(karyawanList.map((k) => [k.id, k]));
    const salesMap = new Map(salesList.map((s) => [s.id, s]));

    const dusMapKaryawan = new Map<string, number>();
    const dusMapSales = new Map<string, number>();

    for (const row of (trxRes.data ?? []) as any[]) {
        const karyawanId: string | null = row.transactions?.karyawan_id ?? null;
        const salesId: string | null = row.transactions?.sales_id ?? null;
        const isiPerDus: number = row.products?.isi_per_dus ?? 0;
        if (!isiPerDus) continue;
        const dus = Number(row.quantity) / isiPerDus;

        if (karyawanId) {
            dusMapKaryawan.set(karyawanId, (dusMapKaryawan.get(karyawanId) ?? 0) + dus);
        } else if (salesId) {
            dusMapSales.set(salesId, (dusMapSales.get(salesId) ?? 0) + dus);
        }
    }

    const rulesFor = (ownerType: BonusOwnerType) =>
        rules.filter((r) => r.target_type === ownerType || r.target_type === "semua");

    const computeRewards = (eligibleRules: BonusRule[], totalDus: number) => {
        const sums: Record<BonusRewardType, number> = { dus_bonus: 0, kaos: 0, uang: 0 };
        const matchedRules: BonusRule[] = [];

        for (const rule of eligibleRules.filter((r) => r.rule_mode === "ratio")) {
            if (!rule.threshold_dus) continue;
            const units = Math.floor(totalDus / rule.threshold_dus);
            if (units <= 0) continue;
            sums[rule.reward_type] += units * rule.reward_value;
            matchedRules.push(rule);
        }

        const bestByType: Partial<Record<BonusRewardType, BonusRule>> = {};
        for (const rule of eligibleRules.filter((r) => r.rule_mode === "threshold")) {
            if (totalDus < rule.threshold_dus) continue;
            const current = bestByType[rule.reward_type];
            if (!current || rule.threshold_dus > current.threshold_dus) {
                bestByType[rule.reward_type] = rule;
            }
        }
        for (const rule of Object.values(bestByType)) {
            if (!rule) continue;
            sums[rule.reward_type] += rule.reward_value;
            matchedRules.push(rule);
        }

        return { sums, matchedRules };
    };

    const result: BonusPreviewRow[] = [];

    const karyawanRules = rulesFor("karyawan");
    for (const [karyawanId, totalDus] of dusMapKaryawan.entries()) {
        const k = karyawanMap.get(karyawanId);
        const nama = k?.nama ?? "(Karyawan tidak aktif)";
        const bonusKhusus = k?.bonus_khusus ?? false;

        const eligibleRules = karyawanRules.filter(
            (r) => r.applies_to === "umum" || (r.applies_to === "khusus" && bonusKhusus),
        );
        const { sums, matchedRules } = computeRewards(eligibleRules, totalDus);

        result.push({
            owner_type: "karyawan",
            owner_id: karyawanId,
            nama,
            bonus_khusus: bonusKhusus,
            total_dus_terjual: Math.round(totalDus * 100) / 100,
            bonus_dus: sums.dus_bonus,
            bonus_kaos: sums.kaos,
            bonus_target_rp: sums.uang,
            matched_rules: matchedRules,
        });
    }

    const salesRules = rulesFor("sales");
    for (const [salesId, totalDus] of dusMapSales.entries()) {
        const s = salesMap.get(salesId);
        const nama = s?.nama_sales ?? "(Sales tidak aktif)";

        const { sums, matchedRules } = computeRewards(salesRules, totalDus);

        result.push({
            owner_type: "sales",
            owner_id: salesId,
            nama,
            bonus_khusus: false,
            total_dus_terjual: Math.round(totalDus * 100) / 100,
            bonus_dus: sums.dus_bonus,
            bonus_kaos: sums.kaos,
            bonus_target_rp: sums.uang,
            matched_rules: matchedRules,
        });
    }

    result.sort((a, b) => b.total_dus_terjual - a.total_dus_terjual);

    return { data: result, error: null };
};

export const saveBonusRecords = async (
    periode: string,
    records: {
        owner_type: BonusOwnerType;
        owner_id: string;
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

    const karyawanRows = records
        .filter((r) => r.owner_type === "karyawan")
        .map((r) => ({
            karyawan_id: r.owner_id,
            sales_id: null,
            periode,
            total_dus_terjual: r.total_dus_terjual,
            bonus_dus: r.bonus_dus,
            bonus_kaos: r.bonus_kaos,
            bonus_target_rp: r.bonus_target_rp,
            catatan: r.catatan || null,
        }));

    const salesRows = records
        .filter((r) => r.owner_type === "sales")
        .map((r) => ({
            karyawan_id: null,
            sales_id: r.owner_id,
            periode,
            total_dus_terjual: r.total_dus_terjual,
            bonus_dus: r.bonus_dus,
            bonus_kaos: r.bonus_kaos,
            bonus_target_rp: r.bonus_target_rp,
            catatan: r.catatan || null,
        }));

    const results: BonusRecord[] = [];

    if (karyawanRows.length > 0) {
        const { data, error } = await supabaseAdmin
            .from("bonus_records")
            .upsert(karyawanRows, { onConflict: "karyawan_id,periode" })
            .select(RECORD_SELECT);
        if (error) return { data: null, error };
        results.push(...((data as unknown) as BonusRecord[]));
    }

    if (salesRows.length > 0) {
        const { data, error } = await supabaseAdmin
            .from("bonus_records")
            .upsert(salesRows, { onConflict: "sales_id,periode" })
            .select(RECORD_SELECT);
        if (error) return { data: null, error };
        results.push(...((data as unknown) as BonusRecord[]));
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "save_bonus_records",
        description: `Rekap bonus periode ${periode} disimpan untuk ${karyawanRows.length} karyawan & ${salesRows.length} sales`,
    }]);

    return { data: results, error: null };
};
