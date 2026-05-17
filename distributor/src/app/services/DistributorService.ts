import { supabase } from '../utils/supabaseClient';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const loginDistributor = async (email: string, password: string) => {
    // Login via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (authError) return { data: null, error: authError };

    // Ambil data user dari tabel users
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, is_approved')
        .eq('auth_user_id', authData.user.id)
        .single();

    if (userError) return { data: null, error: userError };
    if (userData.role !== 'distributor') {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Akun ini bukan akun distributor.' } };
    }
    if (!userData.is_approved) {
        await supabase.auth.signOut();
        return { data: null, error: { message: 'Akun belum disetujui admin. Hubungi administrator.' } };
    }

    // Ambil distributor_id dari tabel distributors
    const { data: distData, error: distError } = await supabase
        .from('distributors')
        .select('id, distributor_name, phone, address')
        .eq('user_id', userData.id)
        .single();

    if (distError) return { data: null, error: distError };

    return {
        data: {
            userId: userData.id,
            distributorId: distData.id,
            name: userData.name,
            email: userData.email,
            distributorName: distData.distributor_name,
            phone: distData.phone,
            address: distData.address,
            accessToken: authData.session?.access_token ?? '',
        },
        error: null,
    };
};

export const logoutDistributor = async () => {
    await supabase.auth.signOut();
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (distributorId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const [todayTx, totalStock, lowStock, topProduct] = await Promise.all([
        // Transaksi hari ini
        supabase
            .from('transactions')
            .select('total_price')
            .eq('distributor_id', distributorId)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`),

        // Total stok distributor
        supabase
            .from('stocks')
            .select('stock_quantity')
            .eq('distributor_id', distributorId),

        // Stok menipis (< 50 unit)
        supabase
            .from('stocks')
            .select('stock_quantity, products(product_name, unit)')
            .eq('distributor_id', distributorId)
            .lt('stock_quantity', 50),

        // Produk terlaris dari transaction_details
        supabase
            .from('transaction_details')
            .select('product_id, quantity, products(product_name)')
            .eq('transactions.distributor_id', distributorId),
    ]);

    const salesToday = (todayTx.data ?? []).reduce(
        (s: number, t: any) => s + (t.total_price ?? 0), 0
    );
    const transactionsToday = (todayTx.data ?? []).length;
    const totalStockQty = (totalStock.data ?? []).reduce(
        (s: number, t: any) => s + (t.stock_quantity ?? 0), 0
    );
    const lowStockItems = (lowStock.data ?? []).map((s: any) => ({
        name: s.products?.product_name ?? '—',
        stock: s.stock_quantity,
        unit: s.products?.unit ?? 'unit',
        minStock: 50,
    }));

    return {
        salesToday,
        transactionsToday,
        totalStock: totalStockQty,
        lowStockCount: lowStockItems.length,
        lowStockProducts: lowStockItems,
    };
};

// ─── PRODUK ───────────────────────────────────────────────────────────────────

export const getProductsWithDistributorStock = async (distributorId: string) => {
    // Produk aktif beserta stok distributor
    const { data: stocks, error } = await supabase
        .from('stocks')
        .select(`
      stock_quantity,
      products (
        id, product_name, category, size, price, unit, is_active
      )
    `)
        .eq('distributor_id', distributorId);

    if (error) return { data: [], error };

    const result = (stocks ?? [])
        .filter((s: any) => s.products?.is_active)
        .map((s: any) => ({
            id: s.products.id,
            name: s.products.product_name,
            category: s.products.category,
            size: s.products.size,
            price: s.products.price,
            unit: s.products.unit,
            stock: s.stock_quantity,
            minStock: 50,
        }));

    return { data: result, error: null };
};

// ─── STOK ─────────────────────────────────────────────────────────────────────

export const getDistributorStock = async (distributorId: string) => {
    const { data, error } = await supabase
        .from('stocks')
        .select(`
      stock_quantity,
      products ( id, product_name, unit, category, is_active )
    `)
        .eq('distributor_id', distributorId);

    if (error) return { data: [], error };

    return {
        data: (data ?? [])
            .filter((s: any) => s.products?.is_active)
            .map((s: any) => ({
                id: s.products.id,
                name: s.products.product_name,
                unit: s.products.unit,
                category: s.products.category,
                stock: s.stock_quantity,
                minStock: 50,
                sku: s.products.id.slice(0, 8).toUpperCase(),
            })),
        error: null,
    };
};

export const getStockHistory = async (distributorId: string) => {
    const { data, error } = await supabase
        .from('stock_movements')
        .select(`
      id, movement_type, quantity, note, created_at,
      products ( product_name )
    `)
        .eq('distributor_id', distributorId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return { data: [], error };

    const typeLabel: Record<string, string> = {
        stock_in: 'Produksi/Restok',
        distribution_in: 'Kiriman dari Pabrik',
        distribution_out: 'Keluar ke Penjualan',
        sale_out: 'Penjualan',
    };

    return {
        data: (data ?? []).map((m: any) => ({
            id: m.id,
            productName: m.products?.product_name ?? '—',
            type: ['stock_in', 'distribution_in'].includes(m.movement_type) ? 'in' : 'out',
            quantity: m.quantity,
            note: typeLabel[m.movement_type] ?? m.movement_type,
            date: m.created_at,
        })),
        error: null,
    };
};

// ─── DISTRIBUSI ───────────────────────────────────────────────────────────────

export const getDistributionsForDistributor = async (distributorId: string) => {
    const { data, error } = await supabase
        .from('distributions')
        .select(`
      id, distribution_date, status, created_at,
      distribution_details (
        quantity,
        products ( product_name, unit )
      )
    `)
        .eq('distributor_id', distributorId)
        .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    return {
        data: (data ?? []).map((d: any) => ({
            id: d.id.slice(0, 8).toUpperCase(),
            fullId: d.id,
            date: d.created_at,
            status: d.status === 'received' ? 'diterima' : d.status,
            items: (d.distribution_details ?? []).map((item: any) => ({
                productName: item.products?.product_name ?? '—',
                unit: item.products?.unit ?? 'unit',
                quantity: item.quantity,
            })),
            confirmedAt: d.status === 'received' ? d.created_at : null,
        })),
        error: null,
    };
};

export const confirmDistributionReceived = async (distributionFullId: string, distributorId: string) => {
    // Update status → received
    const { error: updateErr } = await supabase
        .from('distributions')
        .update({ status: 'received' })
        .eq('id', distributionFullId);

    if (updateErr) return { error: updateErr };

    // Tambah stok distributor untuk setiap item
    const { data: details, error: detailErr } = await supabase
        .from('distribution_details')
        .select('product_id, quantity')
        .eq('distribution_id', distributionFullId);

    if (detailErr) return { error: detailErr };

    for (const item of details ?? []) {
        const { data: existing } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.product_id)
            .eq('distributor_id', distributorId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from('stocks')
                .update({ stock_quantity: existing.stock_quantity + item.quantity })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('stocks')
                .insert([{ product_id: item.product_id, distributor_id: distributorId, stock_quantity: item.quantity }]);
        }

        // Catat movement
        await supabase.from('stock_movements').insert([{
            product_id: item.product_id,
            distributor_id: distributorId,
            movement_type: 'distribution_in',
            quantity: item.quantity,
            note: `Konfirmasi penerimaan distribusi #${distributionFullId.slice(0, 8)}`,
        }]);
    }

    return { error: null };
};

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export interface TxItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export const createTransaction = async (
    distributorId: string,
    items: TxItem[],
    paymentMethod: 'cash' | 'transfer',
    customerId: string | null
) => {
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    // Validasi stok
    for (const item of items) {
        const { data: stock } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.productId)
            .eq('distributor_id', distributorId)
            .maybeSingle();

        if (!stock || stock.stock_quantity < item.quantity) {
            return { data: null, error: { message: `Stok tidak mencukupi untuk: ${item.productName}` } };
        }
    }

    // Insert transaksi
    const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .insert([{
            distributor_id: distributorId,
            customer_id: customerId || null,
            total_price: total,
            payment_method: paymentMethod,
        }])
        .select()
        .single();

    if (trxErr) return { data: null, error: trxErr };

    // Insert detail
    await supabase.from('transaction_details').insert(
        items.map(i => ({
            transaction_id: trx.id,
            product_id: i.productId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
        }))
    );

    // Kurangi stok
    for (const item of items) {
        const { data: stock } = await supabase
            .from('stocks')
            .select('id, stock_quantity')
            .eq('product_id', item.productId)
            .eq('distributor_id', distributorId)
            .single();

        if (stock) {
            await supabase
                .from('stocks')
                .update({ stock_quantity: stock.stock_quantity - item.quantity })
                .eq('id', stock.id);

            await supabase.from('stock_movements').insert([{
                product_id: item.productId,
                distributor_id: distributorId,
                movement_type: 'sale_out',
                quantity: item.quantity,
                note: `Penjualan #${trx.id.slice(0, 8)}`,
            }]);
        }
    }

    return { data: trx, error: null };
};

export const getTransactionHistory = async (distributorId: string, dateFilter?: string) => {
    let query = supabase
        .from('transactions')
        .select(`
      id, total_price, payment_method, created_at,
      customers ( customer_name, phone ),
      transaction_details (
        quantity, price, subtotal,
        products ( product_name )
      )
    `)
        .eq('distributor_id', distributorId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (dateFilter) {
        query = query
            .gte('created_at', `${dateFilter}T00:00:00`)
            .lte('created_at', `${dateFilter}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) return { data: [], error };

    return {
        data: (data ?? []).map((t: any) => ({
            id: t.id.slice(0, 8).toUpperCase(),
            fullId: t.id,
            total: t.total_price,
            paymentMethod: t.payment_method,
            createdAt: t.created_at,
            customer: t.customers?.customer_name ?? 'Umum',
            items: (t.transaction_details ?? []).map((d: any) => ({
                name: d.products?.product_name ?? '—',
                quantity: d.quantity,
                price: d.price,
                subtotal: d.subtotal,
            })),
        })),
        error: null,
    };
};

// ─── PELANGGAN ────────────────────────────────────────────────────────────────

export const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, phone, address, is_subscribed')
        .order('customer_name', { ascending: true });

    if (error) return { data: [], error };
    return {
        data: (data ?? []).map((c: any) => ({
            id: c.id,
            name: c.customer_name,
            phone: c.phone ?? '',
            address: c.address ?? '',
            isSubscribed: c.is_subscribed,
        })),
        error: null,
    };
};
