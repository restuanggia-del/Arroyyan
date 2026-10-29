import { supabase } from '../../utils/supabase/client';
import { localPeriodeString } from '../lib/dateUtils';

export type BonusRewardType = 'dus_bonus' | 'kaos' | 'uang';
export type BonusRuleMode = 'ratio' | 'threshold';

export interface SalesBonusRule {
    id: string;
    threshold_dus: number;
    reward_type: BonusRewardType;
    reward_value: number;
    rule_mode: BonusRuleMode;
    target_type: 'karyawan' | 'sales' | 'semua';
    keterangan: string | null;
}

export interface BonusMilestone {
    key: string;
    rule: SalesBonusRule;
    mode: BonusRuleMode;
    targetDus: number;
    rewardLabel: string;
    achieved: boolean;
    superseded: boolean;
    count: number;
    remainingDus: number;
}

export interface BonusProgress {
    periode: string;
    periodeLabel: string;
    totalDus: number;
    hasRules: boolean;
    milestones: BonusMilestone[];
    achieved: BonusMilestone[];
    totals: Record<BonusRewardType, number>;
    next: BonusMilestone | null;
}

const fmtNum = (n: number) =>
    Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const formatRupiah = (n: number) =>
    'Rp ' + Math.round(n).toLocaleString('id-ID');

export const formatRewardValue = (type: BonusRewardType, value: number): string => {
    if (type === 'dus_bonus') return `${fmtNum(value)} dus bonus`;
    if (type === 'kaos') return `${fmtNum(value)} kaos`;
    return formatRupiah(value);
};

export const REWARD_TITLE: Record<BonusRewardType, string> = {
    dus_bonus: 'Bonus Dus',
    kaos: 'Kaos',
    uang: 'Uang',
};

export const computeBonusProgress = (
    rules: SalesBonusRule[],
    totalDusRaw: number,
    periode: string,
): BonusProgress => {
    const totalDus = Math.round(totalDusRaw * 100) / 100;
    const [y, m] = periode.split('-').map(Number);
    const periodeLabel = new Date(y, (m || 1) - 1, 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
    });

    const sorted = [...rules].sort((a, b) => a.threshold_dus - b.threshold_dus);

    const bestByType: Partial<Record<BonusRewardType, SalesBonusRule>> = {};
    for (const r of sorted) {
        if (r.rule_mode !== 'threshold' || totalDus < r.threshold_dus) continue;
        const cur = bestByType[r.reward_type];
        if (!cur || r.threshold_dus > cur.threshold_dus) bestByType[r.reward_type] = r;
    }

    const milestones: BonusMilestone[] = [];
    const totals: Record<BonusRewardType, number> = { dus_bonus: 0, kaos: 0, uang: 0 };

    for (const r of sorted) {
        if (r.rule_mode === 'ratio') {
            if (!r.threshold_dus) continue;
            const count = Math.floor(totalDus / r.threshold_dus);
            const achieved = count > 0;
            const targetDus = (count + 1) * r.threshold_dus;
            if (achieved) totals[r.reward_type] += count * r.reward_value;
            milestones.push({
                key: `ra:${r.id}:${count}`,
                rule: r,
                mode: 'ratio',
                targetDus,
                rewardLabel: formatRewardValue(r.reward_type, r.reward_value),
                achieved,
                superseded: false,
                count,
                remainingDus: Math.max(0, Math.round((targetDus - totalDus) * 100) / 100),
            });
        } else {
            const achieved = totalDus >= r.threshold_dus;
            const isWinner = bestByType[r.reward_type]?.id === r.id;
            if (achieved && isWinner) totals[r.reward_type] += r.reward_value;
            milestones.push({
                key: `th:${r.id}`,
                rule: r,
                mode: 'threshold',
                targetDus: r.threshold_dus,
                rewardLabel: formatRewardValue(r.reward_type, r.reward_value),
                achieved,
                superseded: achieved && !isWinner,
                count: achieved ? 1 : 0,
                remainingDus: achieved
                    ? 0
                    : Math.round((r.threshold_dus - totalDus) * 100) / 100,
            });
        }
    }

    const achievedList = milestones.filter((x) => x.achieved && !x.superseded);

    let next: BonusMilestone | null = null;
    for (const ms of milestones) {
        const upcoming = ms.mode === 'ratio' || !ms.achieved;
        if (!upcoming) continue;
        if (!next || ms.remainingDus < next.remainingDus) next = ms;
    }

    return {
        periode,
        periodeLabel,
        totalDus,
        hasRules: rules.length > 0,
        milestones,
        achieved: achievedList,
        totals,
        next,
    };
};

const monthRangeUtc = (periode: string) => {
    // Sama dengan rekap di admin: batas bulan memakai UTC
    const [y, m] = periode.split('-').map(Number);
    const toDb = (d: Date) => d.toISOString().slice(0, 23);
    return {
        start: toDb(new Date(Date.UTC(y, m - 1, 1))),
        end: toDb(new Date(Date.UTC(y, m, 1))),
    };
};

export const getBonusProgress = async (
    salesId: string,
    periode: string = localPeriodeString(),
): Promise<BonusProgress> => {
    const { start, end } = monthRangeUtc(periode);

    const [rulesRes, trxRes] = await Promise.all([
        supabase
            .from('bonus_rules')
            .select('id, threshold_dus, reward_type, reward_value, rule_mode, target_type, keterangan')
            .eq('is_active', true)
            .in('target_type', ['sales', 'semua']),
        supabase
            .from('transactions')
            .select('transaction_details ( quantity, products ( unit, isi_per_dus ) )')
            .eq('sales_id', salesId)
            .is('karyawan_id', null)
            .gte('created_at', start)
            .lt('created_at', end),
    ]);

    if (rulesRes.error) throw new Error(rulesRes.error.message);
    if (trxRes.error) throw new Error(trxRes.error.message);

    let totalDus = 0;
    for (const t of (trxRes.data ?? []) as any[]) {
        for (const d of (t.transaction_details ?? []) as any[]) {
            const qty = Number(d.quantity) || 0;
            const unit = String(d.products?.unit ?? '').trim().toLowerCase();
            const isi = Number(d.products?.isi_per_dus) || 0;
            const dus = unit === 'dus' ? qty : isi > 0 ? qty / isi : 0;
            if (dus > 0) totalDus += dus;
        }
    }

    const rules = ((rulesRes.data ?? []) as any[]).map((r) => ({
        ...r,
        threshold_dus: Number(r.threshold_dus),
        reward_value: Number(r.reward_value),
    })) as SalesBonusRule[];

    return computeBonusProgress(rules, totalDus, periode);
};

const seenKey = (salesId: string, periode: string) => `bonus_seen_${salesId}_${periode}`;

export const getSeenBonusKeys = (salesId: string, periode: string): string[] => {
    try {
        const raw = localStorage.getItem(seenKey(salesId, periode));
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
};

export const markBonusKeysSeen = (salesId: string, periode: string, keys: string[]) => {
    try {
        const merged = Array.from(new Set([...getSeenBonusKeys(salesId, periode), ...keys]));
        localStorage.setItem(seenKey(salesId, periode), JSON.stringify(merged));
    } catch {
    }
};

export const BONUS_REFRESH_EVENT = 'sales-transaction-created';
