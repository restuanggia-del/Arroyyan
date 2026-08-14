import { supabase } from '../../utils/supabaseClient';

export interface ReturnItemInput {
    productId: string;
    productName?: string;
    quantity: number;
}

export const getReturnsForSales = async (salesId: string) => {
    const { data: returnsData, error } = await supabase
        .from('returns')
        .select('id, distribution_id, status, reason, created_at, reviewed_at')
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!returnsData || returnsData.length === 0) return [];

    const returnIds = returnsData.map((r: any) => r.id);
    const { data: details } = await supabase
        .from('return_details')
        .select('id, return_id, quantity, product_id, products ( product_name, unit )')
        .in('return_id', returnIds);

    const detailMap: Record<string, any[]> = {};
    for (const det of details ?? []) {
        (detailMap[(det as any).return_id] ??= []).push({
            id: det.id,
            productName: (det.products as any)?.product_name ?? '—',
            unit: (det.products as any)?.unit ?? 'unit',
            quantity: det.quantity,
        });
    }

    return returnsData.map((r: any) => ({
        id: r.id,
        shortId: r.id.slice(0, 8).toUpperCase(),
        distributionId: r.distribution_id,
        status: r.status as 'pending' | 'approved' | 'rejected',
        reason: r.reason,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at,
        items: detailMap[r.id] ?? [],
    }));
};

export const createReturn = async (
    salesId: string,
    distributionId: string,
    items: ReturnItemInput[],
    reason: string,
) => {
    if (items.length === 0) throw new Error('Pilih minimal 1 produk untuk diretur.');

    const { data: ret, error: retErr } = await supabase
        .from('returns')
        .insert([{ distribution_id: distributionId, sales_id: salesId, status: 'pending', reason: reason || null }])
        .select()
        .single();

    if (retErr) throw new Error(retErr.message);

    const { error: detailErr } = await supabase
        .from('return_details')
        .insert(items.map((item) => ({ return_id: ret.id, product_id: item.productId, quantity: item.quantity })));

    if (detailErr) throw new Error(detailErr.message);

    await supabase.from('activity_logs').insert([{
        activity_type: 'create_return',
        description: `Sales mengajukan retur #${ret.id.slice(0, 8)} — ${items.length} jenis produk${reason ? ` (Alasan: ${reason})` : ''}`,
    }]);

    return ret;
};
