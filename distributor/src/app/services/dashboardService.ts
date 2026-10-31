import { supabase } from '../../utils/supabase/client';
import { MIN_STOCK } from './productService';
import { localDayRangeUtc, localDateString } from '../lib/dateUtils';

export const getDashboardStats = async (salesId: string) => {
    const { start: todayStart, end: todayEnd } = localDayRangeUtc(localDateString());

    const [todayTx, stockRes, depositRes] = await Promise.all([
        supabase
            .from('transactions')
            .select('total_price, transaction_details(quantity, price, harga_pokok)')
            .eq('sales_id', salesId)
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd),
        supabase
            .from('stocks')
            .select('stock_quantity, products(product_name, unit)')
            .eq('sales_id', salesId),
        supabase
            .from('sales_deposits')
            .select('jumlah_cash, jumlah_transfer')
            .eq('sales_id', salesId)
            .gte('tanggal', localDateString()),
    ]);

    const todayData = (todayTx.data ?? []) as any[];
    const totalSalesToday = todayData.reduce((s, t) => s + (t.total_price ?? 0), 0);
    const komisiToday = todayData.reduce((s, t) => {
        const details = (t.transaction_details ?? []) as any[];
        return s + details.reduce((ds, d) => ds + (d.price - d.harga_pokok) * d.quantity, 0);
    }, 0);

    const totalPabrikToday = todayData.reduce((s, t) => {
        const details = (t.transaction_details ?? []) as any[];
        return s + details.reduce((ds, d) => ds + Number(d.harga_pokok ?? 0) * d.quantity, 0);
    }, 0);

    const stockRows = (stockRes.data ?? []) as any[];
    const totalStock = stockRows.reduce((s, r) => s + (r.stock_quantity ?? 0), 0);
    const lowStockProducts = stockRows
        .filter((s) => s.stock_quantity < MIN_STOCK)
        .map((s) => ({
            name: s.products?.product_name ?? '—',
            stock: s.stock_quantity,
            unit: s.products?.unit ?? 'unit',
            minStock: MIN_STOCK,
        }));

    const belumDisetorToday = totalPabrikToday - ((depositRes.data ?? []) as any[]).reduce(
        (s, d) => s + Number(d.jumlah_cash) + Number(d.jumlah_transfer),
        0,
    );

    return {
        totalSalesToday,
        totalPabrikToday,
        totalTransactionsToday: todayData.length,
        komisiToday,
        totalStock,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        belumDisetorToday: Math.max(0, belumDisetorToday),
        hasStock: stockRows.length > 0,
        minStock: MIN_STOCK,
    };
};
