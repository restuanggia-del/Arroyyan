import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export const loginDistributor = async (
  email: string,
  password: string
): Promise<{ user: DistributorUser; distributorId: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const authUser = data.user;
  if (!authUser) throw new Error('Login gagal, coba lagi.');

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name, email, role, is_approved')
    .eq('auth_user_id', authUser.id)
    .single();

  let finalUserData = userData;
  if (userError || !userData) {
    const { data: adminData, error: adminErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_approved')
      .eq('auth_user_id', authUser.id)
      .single();
    if (adminErr || !adminData)
      throw new Error('Gagal mendapatkan data user. Pastikan akun sudah terdaftar.');
    finalUserData = adminData;
  }

  if (!finalUserData) throw new Error('Data user tidak ditemukan.');
  if (finalUserData.role !== 'distributor') throw new Error('Akun ini bukan akun distributor.');
  if (!finalUserData.is_approved)
    throw new Error('Akun belum disetujui admin. Silakan hubungi administrator.');

  const { data: distData, error: distError } = await supabase
    .from('distributors')
    .select('id, distributor_name, phone, address')
    .eq('user_id', finalUserData.id)
    .single();

  let finalDistData = distData;
  if (distError || !distData) {
    const { data: adminDistData, error: adminDistErr } = await supabaseAdmin
      .from('distributors')
      .select('id, distributor_name, phone, address')
      .eq('user_id', finalUserData.id)
      .single();
    if (adminDistErr || !adminDistData)
      throw new Error('Data distributor tidak ditemukan.');
    finalDistData = adminDistData;
  }

  const user: DistributorUser = {
    ...finalUserData,
    distributor_id: finalDistData!.id,
    distributor_name: finalDistData!.distributor_name,
    phone: finalDistData!.phone,
    address: finalDistData!.address,
  };

  localStorage.setItem('distributor_user', JSON.stringify(user));
  localStorage.setItem('distributor_id', finalDistData!.id);
  return { user, distributorId: finalDistData!.id };
};

export const checkSession = async (): Promise<DistributorUser | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    localStorage.removeItem('distributor_user');
    localStorage.removeItem('distributor_id');
    return null;
  }

  const cached = localStorage.getItem('distributor_user');
  if (cached) {
    try { return JSON.parse(cached) as DistributorUser; } catch { /* lanjut */ }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, role, is_approved')
    .eq('auth_user_id', session.user.id)
    .single();

  const finalUser = userData ?? (await supabaseAdmin
    .from('users')
    .select('id, name, email, role, is_approved')
    .eq('auth_user_id', session.user.id)
    .single()).data;

  if (!finalUser || finalUser.role !== 'distributor' || !finalUser.is_approved) return null;

  const { data: distData } = await supabase
    .from('distributors')
    .select('id, distributor_name, phone, address')
    .eq('user_id', finalUser.id)
    .single();

  const finalDist = distData ?? (await supabaseAdmin
    .from('distributors')
    .select('id, distributor_name, phone, address')
    .eq('user_id', finalUser.id)
    .single()).data;

  if (!finalDist) return null;

  const user: DistributorUser = {
    ...finalUser,
    distributor_id: finalDist.id,
    distributor_name: finalDist.distributor_name,
    phone: finalDist.phone,
    address: finalDist.address,
  };

  localStorage.setItem('distributor_user', JSON.stringify(user));
  localStorage.setItem('distributor_id', finalDist.id);
  return user;
};

export const logoutDistributor = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('distributor_user');
  localStorage.removeItem('distributor_id');
};

const MIN_STOCK = 50;

export const getDashboardStats = async (distributorId: string) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [todayTx, stockRes, topProductRes] = await Promise.all([
    supabaseAdmin
      .from('transactions')
      .select('total_price')
      .eq('distributor_id', distributorId)
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`),
    supabaseAdmin
      .from('stocks')
      .select('stock_quantity, products(product_name, unit, category)')
      .eq('distributor_id', distributorId),
    supabaseAdmin
      .from('transaction_details')
      .select(`product_id, quantity, products(product_name), transactions!inner(distributor_id)`)
      .eq('transactions.distributor_id', distributorId),
  ]);

  const todayData = todayTx.data ?? [];
  const totalSalesToday = todayData.reduce((s: number, t: any) => s + (t.total_price ?? 0), 0);
  const allStockRows = stockRes.data ?? [];
  const totalStock = allStockRows.reduce((s: number, item: any) => s + (item.stock_quantity ?? 0), 0);
  const lowStockProducts = allStockRows
    .filter((s: any) => s.stock_quantity < MIN_STOCK)
    .map((s: any) => ({
      name: s.products?.product_name ?? '—',
      stock: s.stock_quantity,
      unit: s.products?.unit ?? 'pcs',
      minStock: MIN_STOCK,
    }));

  const productMap: Record<string, { name: string; totalSold: number }> = {};
  for (const row of (topProductRes.data ?? []) as any[]) {
    const pid = row.product_id;
    if (!productMap[pid])
      productMap[pid] = { name: row.products?.product_name ?? '—', totalSold: 0 };
    productMap[pid].totalSold += row.quantity ?? 0;
  }
  const topProduct = Object.values(productMap).sort((a, b) => b.totalSold - a.totalSold)[0] ?? null;

  return {
    totalSalesToday,
    totalTransactionsToday: todayData.length,
    totalStock,
    lowStockCount: lowStockProducts.length,
    topProduct,
    lowStockProducts,
    hasStock: allStockRows.length > 0,
    minStock: MIN_STOCK,
  };
};

export const getProductsWithDistributorStock = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select(`product_id, stock_quantity, products(id, product_name, category, size, price, unit, is_active)`)
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

export const createTransaction = async (
  distributorId: string,
  items: { productId: string; productName: string; price: number; quantity: number }[],
  paymentMethod: 'cash' | 'transfer',
  customerId: string | null
) => {
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

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

  const { data: trx, error: trxErr } = await supabaseAdmin
    .from('transactions')
    .insert([{ distributor_id: distributorId, customer_id: customerId, total_price: totalPrice, payment_method: paymentMethod }])
    .select()
    .single();
  if (trxErr) throw new Error(trxErr.message);

  await supabaseAdmin.from('transaction_details').insert(
    items.map((item) => ({
      transaction_id: trx.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }))
  );

  for (const item of items) {
    const { data: stock } = await supabaseAdmin
      .from('stocks').select('id, stock_quantity')
      .eq('product_id', item.productId).eq('distributor_id', distributorId).single();
    if (stock)
      await supabaseAdmin.from('stocks').update({ stock_quantity: stock.stock_quantity - item.quantity }).eq('id', stock.id);
    await supabaseAdmin.from('stock_movements').insert([{
      product_id: item.productId, distributor_id: distributorId,
      movement_type: 'sale_out', quantity: item.quantity,
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
    .select(`id, total_price, payment_method, created_at,
      customers(customer_name, phone),
      transaction_details(quantity, price, subtotal, products(product_name))`)
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getCustomers = async () => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, customer_name, phone, address, is_subscribed, created_at')
    .order('customer_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createCustomer = async (customer: { customer_name: string; phone: string; address: string }) => {
  const { data, error } = await supabaseAdmin.from('customers').insert([customer]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getDistributorStock = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stocks')
    .select(`id, stock_quantity, products(id, product_name, category, size, unit)`)
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
    minStock: MIN_STOCK,
  }));
};

export const getStockMovements = async (distributorId: string) => {
  const { data, error } = await supabaseAdmin
    .from('stock_movements')
    .select(`id, movement_type, quantity, note, created_at, products(product_name)`)
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getDistributions = async (distributorId: string) => {
  const { data: dists, error } = await supabaseAdmin
    .from('distributions')
    .select('id, distribution_date, status, created_at')
    .eq('distributor_id', distributorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!dists || dists.length === 0) return [];

  const distIds = dists.map((d: any) => d.id);
  const { data: details } = await supabaseAdmin
    .from('distribution_details')
    .select('id, distribution_id, quantity, product_id, products(product_name, unit)')
    .in('distribution_id', distIds);

  const detailMap: Record<string, any[]> = {};
  for (const det of details ?? []) {
    if (!detailMap[det.distribution_id]) detailMap[det.distribution_id] = [];
    detailMap[det.distribution_id].push({
      id: det.id,
      productName: (det.products as any)?.product_name ?? '—',
      unit: (det.products as any)?.unit ?? 'pcs',
      quantity: det.quantity,
    });
  }

  return dists.map((d: any) => ({
    id: d.id,
    date: d.distribution_date,
    status: d.status,
    created_at: d.created_at,
    items: detailMap[d.id] ?? [],
  }));
};

export const confirmDistributionReceived = async (distributionId: string) => {
  const { data: dist, error: fetchErr } = await supabaseAdmin
    .from('distributions')
    .select('id, distributor_id, status')
    .eq('id', distributionId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!dist) throw new Error('Data distribusi tidak ditemukan.');
  if (dist.status === 'received')
    throw new Error('Distribusi ini sudah dikonfirmasi sebelumnya.');

  const { data: details, error: detailErr } = await supabaseAdmin
    .from('distribution_details')
    .select('id, quantity, product_id')
    .eq('distribution_id', distributionId);

  if (detailErr) throw new Error(detailErr.message);

  const { error: updateErr } = await supabaseAdmin
    .from('distributions')
    .update({ status: 'received' })
    .eq('id', distributionId);

  if (updateErr) throw new Error(updateErr.message);

  for (const detail of details ?? []) {
    const productId = detail.product_id;
    if (!productId || !detail.quantity) continue;

    const { data: stockRow } = await supabaseAdmin
      .from('stocks')
      .select('id, stock_quantity')
      .eq('product_id', productId)
      .eq('distributor_id', dist.distributor_id)
      .maybeSingle();

    if (stockRow) {
      await supabaseAdmin
        .from('stocks')
        .update({ stock_quantity: stockRow.stock_quantity + detail.quantity })
        .eq('id', stockRow.id);
    } else {
      await supabaseAdmin
        .from('stocks')
        .insert([{ product_id: productId, distributor_id: dist.distributor_id, stock_quantity: detail.quantity }]);
    }

    await supabaseAdmin.from('stock_movements').insert([{
      product_id: productId,
      distributor_id: dist.distributor_id,
      movement_type: 'distribution_in',
      quantity: detail.quantity,
      note: `Konfirmasi penerimaan distribusi #${distributionId.slice(0, 8)}`,
    }]);
  }

  await supabaseAdmin.from('activity_logs').insert([{
    activity_type: 'confirm_distribution',
    description: `Distributor mengkonfirmasi penerimaan distribusi #${distributionId.slice(0, 8)} — stok telah diperbarui`,
  }]);
};
