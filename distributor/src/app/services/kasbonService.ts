import { supabase } from '../../utils/supabase/client';

export interface KasbonPayment {
    id: string;
    transaction_id: string;
    tanggal_bayar: string;
    dus_dibayar: number;
    jumlah_transfer: number;
    jumlah_cash: number;
    jumlah_ke_owner: number;
    sisa_dus: number;
    sisa_rp: number;
    keterangan: string | null;
    created_at: string;
}

export interface KasbonTransaction {
    id: string;
    customer_id: string | null;
    total_price: number;
    created_at: string;
    customers: { customer_name: string; phone: string | null } | null;
    transaction_details: {
        id: string;
        product_id: string;
        quantity: number;
        price: number;
        subtotal: number;
        products: { product_name: string; category: string } | null;
    }[];
    total_dus: number;
    sisa_dus: number;
    sisa_rp: number;
    is_lunas: boolean;
    last_payment_at: string | null;
}

/** All titipan (kasbon) transactions created by this sales rep, with running sisa. */
export const getKasbonTransactions = async (salesId: string): Promise<KasbonTransaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
      id,
      customer_id,
      total_price,
      created_at,
      customers ( customer_name, phone ),
      transaction_details (
        id,
        product_id,
        quantity,
        price,
        subtotal,
        products ( product_name, category )
      )
    `)
        .eq('sales_id', salesId)
        .eq('payment_method', 'kasbon')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const transactions = (data ?? []) as unknown as Omit<
        KasbonTransaction,
        'total_dus' | 'sisa_dus' | 'sisa_rp' | 'is_lunas' | 'last_payment_at'
    >[];
    const ids = transactions.map((t) => t.id);

    let paymentsByTrx: Record<string, KasbonPayment[]> = {};
    if (ids.length > 0) {
        const { data: payments, error: payErr } = await supabase
            .from('kasbon_payments')
            .select('*')
            .in('transaction_id', ids)
            .order('created_at', { ascending: true });

        if (payErr) throw new Error(payErr.message);

        paymentsByTrx = (payments as KasbonPayment[]).reduce(
            (acc, p) => {
                (acc[p.transaction_id] ??= []).push(p);
                return acc;
            },
            {} as Record<string, KasbonPayment[]>,
        );
    }

    return transactions.map((t) => {
        const totalDus = (t.transaction_details ?? []).reduce((s, d) => s + d.quantity, 0);
        const payments = paymentsByTrx[t.id] ?? [];
        const lastPayment = payments[payments.length - 1];

        const sisaDus = lastPayment ? lastPayment.sisa_dus : totalDus;
        const sisaRp = lastPayment ? lastPayment.sisa_rp : t.total_price;

        return {
            ...t,
            total_dus: totalDus,
            sisa_dus: sisaDus,
            sisa_rp: sisaRp,
            is_lunas: sisaRp <= 0 && sisaDus <= 0,
            last_payment_at: lastPayment ? lastPayment.created_at : null,
        };
    });
};

export const getKasbonPaymentHistory = async (transactionId: string): Promise<KasbonPayment[]> => {
    const { data, error } = await supabase
        .from('kasbon_payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as KasbonPayment[];
};

export const addKasbonPayment = async (
    transactionId: string,
    payment: {
        tanggal_bayar: string;
        dus_dibayar: number;
        jumlah_transfer: number;
        jumlah_cash: number;
        jumlah_ke_owner: number;
        keterangan?: string | null;
    },
): Promise<KasbonPayment> => {
    const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .select(`
      id,
      total_price,
      transaction_details ( quantity )
    `)
        .eq('id', transactionId)
        .single();

    if (trxErr) throw new Error(trxErr.message);

    const totalDus = (trx.transaction_details as { quantity: number }[]).reduce(
        (s, d) => s + d.quantity,
        0,
    );

    const { data: lastPaymentRows, error: lastErr } = await supabase
        .from('kasbon_payments')
        .select('sisa_dus, sisa_rp')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (lastErr) throw new Error(lastErr.message);

    const prevSisaDus = lastPaymentRows?.[0]?.sisa_dus ?? totalDus;
    const prevSisaRp = lastPaymentRows?.[0]?.sisa_rp ?? trx.total_price;

    const newSisaDus = prevSisaDus - payment.dus_dibayar;
    const newSisaRp = prevSisaRp - (payment.jumlah_transfer + payment.jumlah_cash);

    const { data, error } = await supabase
        .from('kasbon_payments')
        .insert([{
            transaction_id: transactionId,
            tanggal_bayar: payment.tanggal_bayar,
            dus_dibayar: payment.dus_dibayar,
            jumlah_transfer: payment.jumlah_transfer,
            jumlah_cash: payment.jumlah_cash,
            jumlah_ke_owner: payment.jumlah_ke_owner,
            sisa_dus: newSisaDus,
            sisa_rp: newSisaRp,
            keterangan: payment.keterangan || null,
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    await supabase.from('activity_logs').insert([{
        activity_type: 'kasbon_payment',
        description: `Pembayaran titipan #${transactionId.slice(0, 8)} — ${payment.dus_dibayar} dus, Rp ${(
            payment.jumlah_transfer + payment.jumlah_cash
        ).toLocaleString('id-ID')}`,
    }]);

    return data as KasbonPayment;
};
