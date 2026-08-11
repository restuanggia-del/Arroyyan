import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
    calculateInsentifProduksiPerKaryawan,
    calculateFeePenjualanPerKaryawan,
    DEFAULT_RATE_FEE_PENJUALAN,
} from "./insentifService";
import { calculateBonusPreview } from "./bonusService";

export interface IncentiveReceipt {
    id: string;
    periode: string;
    karyawan_id: string;
    total_produksi: number;
    total_fee_penjualan: number;
    total_handling: number;
    total_fee_rekapan: number;
    total_bonus_target: number;
    jumlah_total: number;
    status_tanda_terima: "belum" | "sudah";
    tanggal_terima: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
}

const SELECT = `
  id, periode, karyawan_id, total_produksi, total_fee_penjualan, total_handling,
  total_fee_rekapan, total_bonus_target, jumlah_total, status_tanda_terima, tanggal_terima, created_at,
  karyawan ( nama )
`;

export const getIncentiveReceipts = async (periode: string) => {
    const { data, error } = await supabaseAdmin
        .from("incentive_receipts")
        .select(SELECT)
        .eq("periode", periode)
        .order("jumlah_total", { ascending: false });

    if (error) return { data: null, error };
    return { data: (data as unknown) as IncentiveReceipt[], error: null };
};

export interface ReceiptTotal {
    karyawan_id: string;
    nama: string;
    total_produksi: number;
    total_fee_penjualan: number;
    total_handling: number;
    total_fee_rekapan: number;
    total_bonus_target: number;
    jumlah_total: number;
    produksi_is_live: boolean;
    fee_penjualan_is_live: boolean;
    bonus_target_is_live: boolean;
}

export const calculateReceiptTotals = async (
    periode: string,
): Promise<{ data: ReceiptTotal[] | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return { data: null, error: { message: "Format periode tidak valid, gunakan YYYY-MM." } };
    }
    const startDate = `${periode}-01`;
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

    const [
        karyawanRes,
        paymentsRes,
        handlingRes,
        feeRekapanRes,
        bonusRes,
        liveProduksiRes,
        liveFeePenjualanRes,
        liveBonusRes,
    ] = await Promise.all([
        supabaseAdmin.from("karyawan").select("id, nama"),
        supabaseAdmin
            .from("incentive_payments")
            .select("karyawan_id, jenis, jumlah_dibayar")
            .in("jenis", ["insentif_produksi", "fee_penjualan"])
            .eq("periode", periode),
        supabaseAdmin
            .from("handling_fee_workers")
            .select("karyawan_id, fee_per_orang, handling_fee_records!inner ( tanggal )")
            .gte("handling_fee_records.tanggal", startDate)
            .lt("handling_fee_records.tanggal", endDate),
        supabaseAdmin.from("fee_rekapan_manual").select("karyawan_id, jumlah").eq("periode", periode),
        supabaseAdmin
            .from("bonus_records")
            .select("karyawan_id, bonus_target_rp")
            .eq("periode", periode),
        calculateInsentifProduksiPerKaryawan(periode),
        calculateFeePenjualanPerKaryawan(periode, DEFAULT_RATE_FEE_PENJUALAN),
        calculateBonusPreview(periode),
    ]);

    if (karyawanRes.error) return { data: null, error: karyawanRes.error };
    if (paymentsRes.error) return { data: null, error: paymentsRes.error };
    if (handlingRes.error) return { data: null, error: handlingRes.error };
    if (feeRekapanRes.error) return { data: null, error: feeRekapanRes.error };
    if (bonusRes.error) return { data: null, error: bonusRes.error };
    if (liveProduksiRes.error) return { data: null, error: liveProduksiRes.error };
    if (liveFeePenjualanRes.error) return { data: null, error: liveFeePenjualanRes.error };
    if (liveBonusRes.error) return { data: null, error: liveBonusRes.error };

    const namaMap = new Map(
        ((karyawanRes.data ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]),
    );

    const map = new Map<string, ReceiptTotal>();
    const getRow = (karyawanId: string): ReceiptTotal => {
        const existing = map.get(karyawanId);
        if (existing) return existing;
        const fresh: ReceiptTotal = {
            karyawan_id: karyawanId,
            nama: namaMap.get(karyawanId) ?? "(Karyawan tidak aktif)",
            total_produksi: 0,
            total_fee_penjualan: 0,
            total_handling: 0,
            total_fee_rekapan: 0,
            total_bonus_target: 0,
            jumlah_total: 0,
            produksi_is_live: false,
            fee_penjualan_is_live: false,
            bonus_target_is_live: false,
        };
        map.set(karyawanId, fresh);
        return fresh;
    };

    const savedProduksi = new Set<string>();
    const savedFeePenjualan = new Set<string>();
    for (const p of (paymentsRes.data ?? []) as any[]) {
        const row = getRow(p.karyawan_id);
        if (p.jenis === "insentif_produksi") {
            row.total_produksi += Number(p.jumlah_dibayar);
            savedProduksi.add(p.karyawan_id);
        } else if (p.jenis === "fee_penjualan") {
            row.total_fee_penjualan += Number(p.jumlah_dibayar);
            savedFeePenjualan.add(p.karyawan_id);
        }
    }

    const savedBonus = new Set<string>();
    for (const b of (bonusRes.data ?? []) as any[]) {
        const row = getRow(b.karyawan_id);
        row.total_bonus_target += Number(b.bonus_target_rp);
        savedBonus.add(b.karyawan_id);
    }

    for (const r of (liveProduksiRes.data ?? []) as any[]) {
        if (savedProduksi.has(r.karyawan_id)) continue;
        const row = getRow(r.karyawan_id);
        row.total_produksi += Number(r.jumlah_dihitung);
        row.produksi_is_live = true;
    }

    for (const r of (liveFeePenjualanRes.data ?? []) as any[]) {
        if (savedFeePenjualan.has(r.karyawan_id)) continue;
        const row = getRow(r.karyawan_id);
        row.total_fee_penjualan += Number(r.jumlah_dihitung);
        row.fee_penjualan_is_live = true;
    }

    for (const r of (liveBonusRes.data ?? []) as any[]) {
        if (savedBonus.has(r.karyawan_id)) continue;
        if (!r.bonus_target_rp) continue;
        const row = getRow(r.karyawan_id);
        row.total_bonus_target += Number(r.bonus_target_rp);
        row.bonus_target_is_live = true;
    }

    for (const h of (handlingRes.data ?? []) as any[]) {
        const row = getRow(h.karyawan_id);
        row.total_handling += Number(h.fee_per_orang);
    }

    for (const f of (feeRekapanRes.data ?? []) as any[]) {
        const row = getRow(f.karyawan_id);
        row.total_fee_rekapan += Number(f.jumlah);
    }

    const result = Array.from(map.values()).map((r) => ({
        ...r,
        jumlah_total:
            r.total_produksi +
            r.total_fee_penjualan +
            r.total_handling +
            r.total_fee_rekapan +
            r.total_bonus_target,
    }));

    result.sort((a, b) => b.jumlah_total - a.jumlah_total);

    return { data: result, error: null };
};

export const generateReceipts = async (periode: string) => {
    const { data: totals, error } = await calculateReceiptTotals(periode);
    if (error) return { data: null, error };

    const rows = (totals ?? [])
        .filter((r) => r.jumlah_total > 0)
        .map((r) => ({
            periode,
            karyawan_id: r.karyawan_id,
            total_produksi: r.total_produksi,
            total_fee_penjualan: r.total_fee_penjualan,
            total_handling: r.total_handling,
            total_fee_rekapan: r.total_fee_rekapan,
            total_bonus_target: r.total_bonus_target,
            jumlah_total: r.jumlah_total,
        }));

    if (rows.length === 0) return { data: [], error: null };

    const { data, error: upsertError } = await supabaseAdmin
        .from("incentive_receipts")
        .upsert(rows, { onConflict: "periode,karyawan_id" })
        .select(SELECT);

    if (upsertError) return { data: null, error: upsertError };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "generate_incentive_receipts",
        description: `Rekap tanda terima insentif periode ${periode} dihitung ulang untuk ${rows.length} karyawan`,
    }]);

    return { data: (data as unknown) as IncentiveReceipt[], error: null };
};

export const markReceiptStatus = async (
    id: string,
    status: "belum" | "sudah",
    tanggalTerima?: string | null,
) => {
    const { error } = await supabaseAdmin
        .from("incentive_receipts")
        .update({
            status_tanda_terima: status,
            tanggal_terima: status === "sudah" ? (tanggalTerima ?? new Date().toISOString().slice(0, 10)) : null,
        })
        .eq("id", id);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_incentive_receipt_status",
        description: `Status tanda terima insentif diubah jadi "${status}" (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};

export const deleteIncentiveReceipt = async (id: string) => {
    const { error } = await supabaseAdmin.from("incentive_receipts").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_incentive_receipt",
        description: `Rekap tanda terima insentif dihapus (id: ${id.slice(0, 8)})`,
    }]);

    return { error: null };
};
