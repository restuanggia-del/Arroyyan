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
