import { supabase } from '../../utils/supabase/client';

export interface TxItemInput {
    productId: string;
    productName: string;
    hargaPabrik: number;
    hargaJual: number;
    quantity: number;
}

export const createSalesTransaction = async (
    salesId: string,
    items: TxItemInput[],
    paymentMethod: 'cash' | 'transfer' | 'kasbon',
    customerId: string | null,
) => {
    if (paymentMethod === 'kasbon' && !customerId) {
        throw new Error('Transaksi kasbon wajib memilih toko/pelanggan tujuan.');
    }

    const totalPrice = items.reduce((s, i) => s + i.hargaJual * i.quantity, 0);

    for (const item of items) {
        const { data: stock } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.productId)
            .eq('sales_id', salesId)
            .maybeSingle();

        if (!stock || stock.stock_quantity < item.quantity) {
            throw new Error(`Stok tidak mencukupi untuk: ${item.productName}. Tersedia: ${stock?.stock_quantity ?? 0}`);
        }
    }

    const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .insert([{ sales_id: salesId, customer_id: customerId, total_price: totalPrice, payment_method: paymentMethod }])
        .select()
        .single();

    if (trxErr) throw new Error(trxErr.message);

    const { error: detailErr } = await supabase.from('transaction_details').insert(
        items.map((item) => ({
            transaction_id: trx.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.hargaJual,
            harga_pokok: item.hargaPabrik,
            subtotal: item.hargaJual * item.quantity,
        })),
    );
    if (detailErr) throw new Error(detailErr.message);

    for (const item of items) {
        const { data: stock } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.productId)
            .eq('sales_id', salesId)
            .single();

        if (stock) {
            await supabase
                .from('stocks')
                .update({ stock_quantity: stock.stock_quantity - item.quantity })
                .eq('id', stock.id);
        }

        await supabase.from('stock_movements').insert([{
            product_id: item.productId,
            sales_id: salesId,
            movement_type: 'sale_out',
            quantity: item.quantity,
            note: `Penjualan #${trx.id.slice(0, 8)} (sales)`,
        }]);
    }

    await supabase.from('activity_logs').insert([{
        activity_type: 'create_transaction',
        description: `Transaksi #${trx.id.slice(0, 8)} | Mode: sales | Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
    }]);

    return trx;
};

export const getTransactionHistory = async (salesId: string, dateFilter?: string) => {
    let query = supabase
        .from('transactions')
        .select(`
      id, total_price, payment_method, created_at,
      customers ( customer_name, phone ),
      transaction_details ( quantity, price, harga_pokok, subtotal, products ( product_name ) )
    `)
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (dateFilter) {
        query = query.gte('created_at', `${dateFilter}T00:00:00`).lte('created_at', `${dateFilter}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((t: any) => {
        const items = (t.transaction_details ?? []).map((d: any) => ({
            name: d.products?.product_name ?? '—',
            quantity: d.quantity,
            price: d.price,
            hargaPokok: d.harga_pokok,
            subtotal: d.subtotal,
        }));
        const komisi = items.reduce((s: number, i: any) => s + (i.price - i.hargaPokok) * i.quantity, 0);

        return {
            id: t.id.slice(0, 8).toUpperCase(),
            fullId: t.id,
            total: t.total_price,
            paymentMethod: t.payment_method as 'cash' | 'transfer' | 'kasbon',
            createdAt: t.created_at,
            customer: t.customers?.customer_name ?? 'Umum',
            komisi,
            items,
        };
    });
};
