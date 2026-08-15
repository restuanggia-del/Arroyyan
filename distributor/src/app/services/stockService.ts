import { supabase } from '../../utils/supabase/client';

export const getStockMovements = async (salesId: string) => {
    const { data, error } = await supabase
        .from('stock_movements')
        .select('id, movement_type, quantity, note, created_at, products ( product_name )')
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);

    const typeLabel: Record<string, string> = {
        distribution_in: 'Kiriman dari Pabrik',
        sale_out: 'Penjualan',
        return_out: 'Retur ke Pabrik',
    };

    return (data ?? []).map((m: any) => ({
        id: m.id,
        productName: m.products?.product_name ?? '—',
        type: m.movement_type === 'distribution_in' ? 'in' : 'out',
        quantity: m.quantity,
        note: typeLabel[m.movement_type] ?? m.movement_type,
        date: m.created_at,
    }));
};
