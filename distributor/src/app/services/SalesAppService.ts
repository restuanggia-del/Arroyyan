import { supabase } from '../../utils/supabaseClient';

export interface SalesUser {
    userId: string;
    salesId: string;
    name: string;
    email: string;
    namaSales: string;
    phone: string | null;
    address: string | null;
}

const CACHE_KEY = 'sales_user';

export const loginSales = async (
    email: string,
    password: string,
): Promise<{ data: SalesUser | null; error: { message: string } | null }> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (authError || !authData.user) {
        return { data: null, error: { message: 'Email atau password salah.' } };
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, is_approved')
        .eq('auth_user_id', authData.user.id)
        .single();

    if (userError || !userData) {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Gagal mendapatkan data akun. Hubungi administrator.' } };
    }
    if (userData.role !== 'sales') {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Akun ini bukan akun sales.' } };
    }
    if (!userData.is_approved) {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Akun belum disetujui admin. Hubungi administrator.' } };
    }

    const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, nama_sales, phone, address, is_active')
        .eq('user_id', userData.id)
        .single();

    if (salesError || !salesData) {
        await supabase.auth.signOut();
        return {
            data: null,
            error: { message: 'Akun ini belum terhubung ke data sales. Hubungi administrator.' },
        };
    }
    if (!salesData.is_active) {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Akun sales Anda sedang dinonaktifkan.' } };
    }

    const user: SalesUser = {
        userId: userData.id,
        salesId: salesData.id,
        name: userData.name,
        email: userData.email,
        namaSales: salesData.nama_sales,
        phone: salesData.phone,
        address: salesData.address,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    return { data: user, error: null };
};

export const checkSession = async (): Promise<SalesUser | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            return JSON.parse(cached) as SalesUser;
        } catch {
        }
    }

    const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role, is_approved')
        .eq('auth_user_id', session.user.id)
        .single();

    if (!userData || userData.role !== 'sales' || !userData.is_approved) return null;

    const { data: salesData } = await supabase
        .from('sales')
        .select('id, nama_sales, phone, address, is_active')
        .eq('user_id', userData.id)
        .single();

    if (!salesData || !salesData.is_active) return null;

    const user: SalesUser = {
        userId: userData.id,
        salesId: salesData.id,
        name: userData.name,
        email: userData.email,
        namaSales: salesData.nama_sales,
        phone: salesData.phone,
        address: salesData.address,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    return user;
};

export const logoutSales = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(CACHE_KEY);
};

export const updateSalesProfile = async (
    salesId: string,
    userId: string,
    data: { nama_sales: string; phone: string; address: string },
) => {
    const { error: salesErr } = await supabase
        .from('sales')
        .update({
            nama_sales: data.nama_sales,
            phone: data.phone || null,
            address: data.address || null,
        })
        .eq('id', salesId);
    if (salesErr) return { error: salesErr };

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ ...parsed, namaSales: data.nama_sales, phone: data.phone, address: data.address }),
            );
        } catch {
        }
    }

    return { error: null };
};

const MIN_STOCK = 20;

export const getDashboardStats = async (salesId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const [todayTx, stockRes, depositRes] = await Promise.all([
        supabase
            .from('transactions')
            .select('total_price, transaction_details(quantity, price, harga_pokok)')
            .eq('sales_id', salesId)
            .gte('created_at', `${todayStr}T00:00:00`)
            .lte('created_at', `${todayStr}T23:59:59`),
        supabase
            .from('stocks')
            .select('stock_quantity, products(product_name, unit)')
            .eq('sales_id', salesId),
        supabase
            .from('sales_deposits')
            .select('jumlah_cash, jumlah_transfer')
            .eq('sales_id', salesId)
            .gte('tanggal', todayStr),
    ]);

    const todayData = (todayTx.data ?? []) as any[];
    const totalSalesToday = todayData.reduce((s, t) => s + (t.total_price ?? 0), 0);
    const komisiToday = todayData.reduce((s, t) => {
        const details = (t.transaction_details ?? []) as any[];
        return s + details.reduce((ds, d) => ds + (d.price - d.harga_pokok) * d.quantity, 0);
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

    const belumDisetorToday = totalSalesToday - ((depositRes.data ?? []) as any[]).reduce(
        (s, d) => s + Number(d.jumlah_cash) + Number(d.jumlah_transfer),
        0,
    );

    return {
        totalSalesToday,
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

export interface SalesProduct {
    id: string;
    name: string;
    category: string;
    size: string;
    hargaPabrik: number;
    unit: string;
    stock: number;
    minStock: number;
}

export const getProductsWithSalesStock = async (salesId: string): Promise<SalesProduct[]> => {
    const { data, error } = await supabase
        .from('stocks')
        .select(`
      stock_quantity,
      products ( id, product_name, category, size, price, unit, is_active )
    `)
        .eq('sales_id', salesId);

    if (error) throw new Error(error.message);

    return (data ?? [])
        .filter((s: any) => s.products?.is_active)
        .map((s: any) => ({
            id: s.products.id,
            name: s.products.product_name,
            category: s.products.category,
            size: s.products.size ?? '',
            hargaPabrik: s.products.price,
            unit: s.products.unit,
            stock: s.stock_quantity,
            minStock: MIN_STOCK,
        }));
};

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

export const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, phone, address, is_subscribed')
        .order('customer_name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.customer_name,
        phone: c.phone ?? '',
        address: c.address ?? '',
        isSubscribed: c.is_subscribed,
    }));
};

export const createCustomer = async (customer: { customer_name: string; phone: string; address: string }) => {
    const { data, error } = await supabase.from('customers').insert([customer]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

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
