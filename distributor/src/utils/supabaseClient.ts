import { createClient } from '@supabase/supabase-js';

// ─── KONFIGURASI ──────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── TIPE ─────────────────────────────────────────────────────────────────────
export interface DistributorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_approved: boolean;
  distributor_id: string;
  distributor_name: string;
  phone: string | null;
  address: string | null;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

/**
 * Login distributor — return { user, distributorId }
 * Konsisten dengan App.tsx: handleLogin(userData, distId)
 */
export const loginDistributor = async (
  email: string,
  password: string
): Promise<{ user: DistributorUser; distributorId: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const authUser = data.user;

  // Ambil data dari tabel users
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, is_approved')
    .eq('auth_user_id', authUser.id)
    .single();

  if (userError || !userData) throw new Error('Gagal mendapatkan data user');
  if (userData.role !== 'distributor') throw new Error('Akun ini bukan akun distributor');
  if (!userData.is_approved)
    throw new Error('Akun belum disetujui admin. Silakan hubungi administrator.');

  // Ambil data distributor
  const { data: distData, error: distError } = await supabaseAdmin
    .from('distributors')
    .select('id, distributor_name, phone, address')
    .eq('user_id', userData.id)
    .single();

  if (distError || !distData) throw new Error('Data distributor tidak ditemukan');

  const user: DistributorUser = {
    ...userData,
    distributor_id: distData.id,
    distributor_name: distData.distributor_name,
    phone: distData.phone,
    address: distData.address,
  };

  // Simpan ke localStorage untuk persistensi
  localStorage.setItem('distributor_user', JSON.stringify(user));
  localStorage.setItem('distributor_id', distData.id);

  return { user, distributorId: distData.id };
};

/**
 * Cek session yang sudah ada (dipanggil saat App mount)
 * Return user jika masih login, null jika tidak
 */
export const checkSession = async (): Promise<DistributorUser | null> => {
  // Cek Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    localStorage.removeItem('distributor_user');
    localStorage.removeItem('distributor_id');
    return null;
  }

  // Ambil dari localStorage sebagai cache
  const cached = localStorage.getItem('distributor_user');
  if (cached) {
    try {
      return JSON.parse(cached) as DistributorUser;
    } catch {
      // jika rusak, ambil ulang dari DB
    }
  }

  // Ambil ulang dari DB jika cache tidak ada
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, is_approved')
    .eq('auth_user_id', session.user.id)
    .single();

  if (!userData || userData.role !== 'distributor' || !userData.is_approved) return null;

  const { data: distData } = await supabaseAdmin
    .from('distributors')
    .select('id, distributor_name, phone, address')
    .eq('user_id', userData.id)
    .single();

  if (!distData) return null;

  const user: DistributorUser = {
    ...userData,
    distributor_id: distData.id,
    distributor_name: distData.distributor_name,
    phone: distData.phone,
    address: distData.address,
  };

  localStorage.setItem('distributor_user', JSON.stringify(user));
  localStorage.setItem('distributor_id', distData.id);

  return user;
};

export const logoutDistributor = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('distributor_user');
  localStorage.removeItem('distributor_id');
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (distributorId: string) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [todayTx, stockRes, topProductRes, lowStockRes] = await Promise.all([
    supabaseAdmin
      .from('transactions')
      .select('total_price')
      .eq('distributor_id', distributorId)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`),

    supabaseAdmin
      .from('stocks')
      .select('stock_quantity, products(product_name, category)')
      .eq('distributor_id', distributorId),

    supabaseAdmin
      .from('transaction_details')
      .select(`
        product_id, quantity,
        products(product_name),
        transactions!inner(distributor_id)
      `)
      .eq('transactions.distributor_id', distributorId),

    supabaseAdmin
      .from('stocks')
      .select('stock_quantity, products(product_name, unit)')
      .eq('distributor_id', distributorId)
      .lt('stock_quantity', 50),
  ]);

  const todayData = todayTx.data ?? [];
  const totalSalesToday = todayData.reduce(
    (s: number, t: any) => s + (t.total_price ?? 0), 0
  );

  const stockData = stockRes.data ?? [];
  const totalStock = stockData.reduce(
    (s: number, item: any) => s + (item.stock_quantity ?? 0), 0
  );

  const productMap: Record<string, { name: string; totalSold: number }> = {};
  for (const row of (topProductRes.data ?? []) as any[]) {
    const pid = row.product_id;
    if (!productMap[pid])
      productMap[pid] = { name: row.products?.product_name ?? '—', totalSold: 0 };
    productMap[pid].totalSold += row.quantity ?? 0;
  }
  const topProduct =
    Object.values(productMap).sort((a, b) => b.totalSold - a.totalSold)[0] ?? null;

  const lowStockProducts = (lowStockRes.data ?? []).map((s: any) => ({
    name: s.products?.product_name ?? '—',
    stock: s.stock_quantity,
    unit: s.products?.unit ?? 'unit',
    minStock: 50,
  }));

  return {
    totalSalesToday,
    totalTransactionsToday: todayData.length,
    totalStock,
    lowStockCount: lowStockProducts.length,
    topProduct,
    lowStockProducts,
  };
};

// ─── PRODUK ───────────────────────────────────────────────────────────────────

export const getProductsWithDistributorStock = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select(`
      product_id, stock_quantity,
      products(id, product_name, category, size, price, unit, is_active)
    `)
    .eq('distributor_id', distributorId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((s: any) => s.products?.is_active)
    .map((s: any) => ({
      id: s.products?.id ?? s.product_id,
      name: s.products?.product_name ?? '—',
      category: s.products?.category ?? '—',
      size: s.products?.size ?? '',
      price: s.products?.price ?? 0,
      unit: s.products?.unit ?? 'pcs',
      stock: s.stock_quantity ?? 0,
    }));
};

// ─── TRANSAKSI ────────────────────────────────────────────────────────────────

export const createTransaction = async (
  distributorId: string,
  items: { productId: string; productName: string; price: number; quantity: number }[],
  paymentMethod: 'cash' | 'transfer',
  customerId: string | null
) => {
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Validasi stok semua item dulu
  for (const item of items) {
    const { data: stock } = await supabaseAdmin
      .from('stocks')
      .select('id, stock_quantity')
      .eq('product_id', item.productId)
      .eq('distributor_id', distributorId)
      .maybeSingle();

    if (!stock || stock.stock_quantity < item.quantity)
      throw new Error(`Stok tidak mencukupi untuk: ${item.productName}. Tersedia: ${stock?.stock_quantity ?? 0}`);
  }

  // Insert transaksi
  const { data: trx, error: trxErr } = await supabaseAdmin
    .from('transactions')
    .insert([{
      distributor_id: distributorId,
      customer_id: customerId,
      total_price: totalPrice,
      payment_method: paymentMethod,
    }])
    .select()
    .single();

  if (trxErr) throw new Error(trxErr.message);

  // Insert detail transaksi
  await supabaseAdmin.from('transaction_details').insert(
    items.map((item) => ({
      transaction_id: trx.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }))
  );

  // Kurangi stok & catat movement
  for (const item of items) {
    const { data: stock } = await supabaseAdmin
      .from('stocks')
      .select('id, stock_quantity')
      .eq('product_id', item.productId)
      .eq('distributor_id', distributorId)
      .single();

    if (stock) {
      await supabaseAdmin
        .from('stocks')
        .update({ stock_quantity: stock.stock_quantity - item.quantity })
        .eq('id', stock.id);
    }

    await supabaseAdmin.from('stock_movements').insert([{
      product_id: item.productId,
      distributor_id: distributorId,
      movement_type: 'sale_out',
      quantity: item.quantity,
      note: `Penjualan #${trx.id.slice(0, 8)} (distributor)`,
    }]);
  }

  await supabaseAdmin.from('activity_logs').insert([{
    activity_type: 'create_transaction',
    description: `Transaksi #${trx.id.slice(0, 8)} | Mode: distributor | Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
  }]);

  return trx;
};

export const getTransactionHistory = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      id, total_price, payment_method, created_at,
      customers(customer_name, phone),
      transaction_details(quantity, price, subtotal, products(product_name))
    `)
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ─── PELANGGAN ────────────────────────────────────────────────────────────────

export const getCustomers = async () => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, customer_name, phone, address, is_subscribed, created_at')
    .order('customer_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createCustomer = async (customer: {
  customer_name: string;
  phone: string;
  address: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert([customer])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin.from('activity_logs').insert([{
    activity_type: 'create_customer',
    description: `Pelanggan baru: ${customer.customer_name}`,
  }]);

  return data;
};

// ─── STOK ─────────────────────────────────────────────────────────────────────

export const getDistributorStock = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select(`
      id, stock_quantity,
      products(id, product_name, category, size, unit)
    `)
    .eq('distributor_id', distributorId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((s: any) => ({
    id: s.id,
    product_id: s.products?.id,
    name: s.products?.product_name ?? '—',
    category: s.products?.category ?? '—',
    size: s.products?.size ?? '',
    unit: s.products?.unit ?? 'pcs',
    stock: s.stock_quantity,
    minStock: 50,
  }));
};

export const getStockMovements = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stock_movements')
    .select(`
      id, movement_type, quantity, note, created_at,
      products(product_name)
    `)
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
};

// ─── DISTRIBUSI ───────────────────────────────────────────────────────────────

export const getDistributions = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('distributions')
    .select(`
      id, distribution_date, status, created_at,
      distribution_details(
        id, quantity,
        products(product_name, unit)
      )
    `)
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((d: any) => ({
    id: d.id,
    date: d.distribution_date,
    status: d.status,
    created_at: d.created_at,
    items: (d.distribution_details ?? []).map((det: any) => ({
      id: det.id,
      productName: det.products?.product_name ?? '—',
      unit: det.products?.unit ?? 'pcs',
      quantity: det.quantity,
    })),
  }));
};

export const confirmDistributionReceived = async (distributionId: string) => {
  const { error } = await supabaseAdmin
    .from('distributions')
    .update({ status: 'received' })
    .eq('id', distributionId);

  if (error) throw new Error(error.message);

  await supabaseAdmin.from('activity_logs').insert([{
    activity_type: 'confirm_distribution',
    description: `Distributor mengkonfirmasi penerimaan distribusi #${distributionId.slice(0, 8)}`,
  }]);
};
