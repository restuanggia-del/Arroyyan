import { supabase } from '../../utils/supabaseClient';

export const getKomisiSummary = async (salesId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('transaction_details ( quantity, price, harga_pokok )')
        .eq('sales_id', salesId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (error) throw new Error(error.message);

    let totalDus = 0;
    let totalOmzetPabrik = 0;
    let totalOmzetJual = 0;
    let totalKomisi = 0;

    for (const t of (data ?? []) as any[]) {
        for (const d of (t.transaction_details ?? []) as any[]) {
            totalDus += d.quantity;
            totalOmzetPabrik += d.harga_pokok * d.quantity;
            totalOmzetJual += d.price * d.quantity;
            totalKomisi += (d.price - d.harga_pokok) * d.quantity;
        }
    }

    return { totalDus, totalOmzetPabrik, totalOmzetJual, totalKomisi };
};
