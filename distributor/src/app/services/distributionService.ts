import { supabase } from '../../utils/supabase/client';

export const getDistributionsForSales = async (salesId: string) => {
    const { data, error } = await supabase
        .from('distributions')
        .select(`
      id, distribution_date, status, created_at,
      distribution_details ( id, product_id, quantity, products ( product_name, unit ) )
    `)
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((d: any) => ({
        id: d.id,
        shortId: d.id.slice(0, 8).toUpperCase(),
        date: d.created_at,
        status: d.status as 'pending' | 'sent' | 'received',
        items: (d.distribution_details ?? []).map((item: any) => ({
            productId: item.product_id,
            productName: item.products?.product_name ?? '—',
            unit: item.products?.unit ?? 'unit',
            quantity: item.quantity,
        })),
    }));
};

export const confirmDistributionReceived = async (distributionId: string, salesId: string) => {
    const { data: dist, error: fetchErr } = await supabase
        .from('distributions')
        .select('id, sales_id, status')
        .eq('id', distributionId)
        .single();

    if (fetchErr || !dist) throw new Error('Data distribusi tidak ditemukan.');
    if (dist.sales_id !== salesId) throw new Error('Distribusi ini bukan milik Anda.');
    if (dist.status === 'received') throw new Error('Distribusi ini sudah dikonfirmasi sebelumnya.');

    const { data: details, error: detailErr } = await supabase
        .from('distribution_details')
        .select('product_id, quantity')
        .eq('distribution_id', distributionId);

    if (detailErr) throw new Error(detailErr.message);

    const { error: updateErr } = await supabase
        .from('distributions')
        .update({ status: 'received' })
        .eq('id', distributionId);

    if (updateErr) throw new Error(updateErr.message);

    for (const item of details ?? []) {
        const { data: existing } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.product_id)
            .eq('sales_id', salesId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('stocks')
                .update({ stock_quantity: existing.stock_quantity + item.quantity })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('stocks')
                .insert([{ product_id: item.product_id, sales_id: salesId, stock_quantity: item.quantity }]);
        }

        await supabase.from('stock_movements').insert([{
            product_id: item.product_id,
            sales_id: salesId,
            movement_type: 'distribution_in',
            quantity: item.quantity,
            note: `Konfirmasi penerimaan distribusi #${distributionId.slice(0, 8)}`,
        }]);
    }

    await supabase.from('activity_logs').insert([{
        activity_type: 'confirm_distribution',
        description: `Sales mengonfirmasi penerimaan distribusi #${distributionId.slice(0, 8)} — stok telah diperbarui`,
    }]);
};
