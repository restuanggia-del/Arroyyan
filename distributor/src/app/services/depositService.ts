import { supabase } from '../../utils/supabase/client';

export const getSalesDepositHistory = async (salesId: string) => {
    const { data, error } = await supabase
        .from('sales_deposits')
        .select('id, tanggal, jumlah_cash, jumlah_transfer, keterangan, created_at')
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) throw new Error(error.message);
    return data ?? [];
};

export const createSalesDeposit = async (
    salesId: string,
    jumlahCash: number,
    jumlahTransfer: number,
    keterangan: string,
) => {
    const { data, error } = await supabase
        .from('sales_deposits')
        .insert([{
            sales_id: salesId,
            jumlah_cash: jumlahCash,
            jumlah_transfer: jumlahTransfer,
            keterangan: keterangan || null,
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert([{
        activity_type: 'create_sales_deposit',
        description: `Sales menyetor Rp ${(jumlahCash + jumlahTransfer).toLocaleString('id-ID')} ke admin`,
    }]);

    return data;
};
