import { supabaseAdmin } from "../lib/supabaseAdmin";

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export interface DashboardStats {
    salesToday: number;
    salesThisMonth: number;
    totalTransactionsToday: number;
    totalTransactionsMonth: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [todayRes, monthRes] = await Promise.all([
        supabaseAdmin
            .from("transactions")
            .select("total_price")
            .gte("created_at", `${todayStr}T00:00:00`)
            .lte("created_at", `${todayStr}T23:59:59`),
        supabaseAdmin
            .from("transactions")
            .select("total_price")
            .gte("created_at", `${monthStart}T00:00:00`),
    ]);

    const todayTx = todayRes.data ?? [];
    const monthTx = monthRes.data ?? [];

    return {
        salesToday: todayTx.reduce((s, t) => s + (t.total_price ?? 0), 0),
        salesThisMonth: monthTx.reduce((s, t) => s + (t.total_price ?? 0), 0),
        totalTransactionsToday: todayTx.length,
        totalTransactionsMonth: monthTx.length,
    };
};

// ─── GRAFIK HARIAN (7 hari terakhir) ─────────────────────────────────────────

export interface DailySales {
    hari: string;
    penjualan: number;
    date: string;
}

export const getDailySales = async (): Promise<DailySales[]> => {
    const days: DailySales[] = [];
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];

        const { data } = await supabaseAdmin
            .from("transactions")
            .select("total_price")
            .gte("created_at", `${dateStr}T00:00:00`)
            .lte("created_at", `${dateStr}T23:59:59`);

        days.push({
            hari: dayNames[d.getDay()],
            penjualan: (data ?? []).reduce((s, t) => s + (t.total_price ?? 0), 0),
            date: dateStr,
        });
    }
    return days;
};

// ─── GRAFIK BULANAN (6 bulan terakhir) ───────────────────────────────────────

export interface MonthlySales {
    bulan: string;
    penjualan: number;
    year: number;
    month: number;
}

export const getMonthlySales = async (): Promise<MonthlySales[]> => {
    const months: MonthlySales[] = [];
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);

        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
        const nextMonth =
            month === 12
                ? `${year + 1}-01-01`
                : `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const { data } = await supabaseAdmin
            .from("transactions")
            .select("total_price")
            .gte("created_at", `${monthStart}T00:00:00`)
            .lt("created_at", `${nextMonth}T00:00:00`);

        months.push({
            bulan: `${monthNames[month - 1]} ${year}`,
            penjualan: (data ?? []).reduce((s, t) => s + (t.total_price ?? 0), 0),
            year,
            month,
        });
    }
    return months;
};

// ─── TOP PRODUCTS ─────────────────────────────────────────────────────────────

export interface TopProduct {
    product_id: string;
    product_name: string;
    category: string;
    totalSold: number;
    revenue: number;
    percentage: number;
}

export const getTopProducts = async (limit = 5): Promise<TopProduct[]> => {
    const { data, error } = await supabaseAdmin
        .from("transaction_details")
        .select(`
      product_id,
      quantity,
      subtotal,
      products ( product_name, category )
    `);

    if (error || !data) return [];

    const map: Record<
        string,
        { product_name: string; category: string; totalSold: number; revenue: number }
    > = {};

    for (const row of data as any[]) {
        const pid = row.product_id;
        if (!map[pid]) {
            map[pid] = {
                product_name: row.products?.product_name ?? "—",
                category: row.products?.category ?? "—",
                totalSold: 0,
                revenue: 0,
            };
        }
        map[pid].totalSold += row.quantity ?? 0;
        map[pid].revenue += row.subtotal ?? 0;
    }

    const sorted = Object.entries(map)
        .map(([pid, v]) => ({ product_id: pid, ...v, percentage: 0 }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);

    const maxSold = sorted[0]?.totalSold ?? 1;
    return sorted.map((p) => ({
        ...p,
        percentage: Math.round((p.totalSold / maxSold) * 100),
    }));
};

// ─── STOK KRITIS ─────────────────────────────────────────────────────────────

export interface LowStockItem {
    product_id: string;
    product_name: string;
    current: number;
    minimum: number;
}

export const getLowStockItems = async (minimum = 100): Promise<LowStockItem[]> => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`product_id, stock_quantity, products ( product_name )`)
        .is("distributor_id", null)
        .lt("stock_quantity", minimum);

    if (error || !data) return [];

    return (data as any[]).map((s) => ({
        product_id: s.product_id,
        product_name: s.products?.product_name ?? "—",
        current: s.stock_quantity,
        minimum,
    }));
};

// ─── LAPORAN PENJUALAN ────────────────────────────────────────────────────────

export interface SalesReportRow {
    id: string;
    date: string;
    customer: string;
    distributor: string;
    items: string;
    total: number;
    payment: string;
}

export const getSalesReport = async (
    startDate: string,
    endDate: string
): Promise<SalesReportRow[]> => {
    const { data, error } = await supabaseAdmin
        .from("transactions")
        .select(`
      id, created_at, total_price, payment_method,
      customers ( customer_name ),
      distributors ( distributor_name ),
      transaction_details ( quantity, products ( product_name ) )
    `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as any[]).map((trx) => ({
        id: trx.id.slice(0, 8).toUpperCase(),
        date: new Date(trx.created_at).toLocaleDateString("id-ID"),
        customer: trx.customers?.customer_name ?? "Umum",
        distributor: trx.distributors?.distributor_name ?? "Pabrik",
        items: (trx.transaction_details ?? [])
            .map((d: any) => `${d.products?.product_name ?? "?"} (${d.quantity})`)
            .join(", "),
        total: trx.total_price,
        payment: trx.payment_method === "cash" ? "Cash" : "Transfer",
    }));
};

// ─── LAPORAN DISTRIBUSI ───────────────────────────────────────────────────────

export interface DistributionReportRow {
    id: string;
    date: string;
    distributor: string;
    items: string;
    totalQty: number;
    status: string;
}

export const getDistributionReport = async (
    startDate: string,
    endDate: string
): Promise<DistributionReportRow[]> => {
    const { data, error } = await supabaseAdmin
        .from("distributions")
        .select(`
      id, distribution_date, status,
      distributors ( distributor_name ),
      distribution_details ( quantity, products ( product_name ) )
    `)
        .gte("distribution_date", startDate)
        .lte("distribution_date", endDate)
        .order("distribution_date", { ascending: false });

    if (error || !data) return [];

    const statusMap: Record<string, string> = {
        pending: "Pending",
        sent: "Dikirim",
        received: "Diterima",
    };

    return (data as any[]).map((dist) => {
        const details = dist.distribution_details ?? [];
        return {
            id: dist.id.slice(0, 8).toUpperCase(),
            date: new Date(dist.distribution_date).toLocaleDateString("id-ID"),
            distributor: dist.distributors?.distributor_name ?? "—",
            items: details
                .map((d: any) => `${d.products?.product_name ?? "?"} (${d.quantity})`)
                .join(", "),
            totalQty: details.reduce((s: number, d: any) => s + (d.quantity ?? 0), 0),
            status: statusMap[dist.status] ?? dist.status,
        };
    });
};

// ─── LAPORAN STOK ─────────────────────────────────────────────────────────────

export interface StockReportRow {
    product_name: string;
    category: string;
    stockPusat: number;
    stockDistributor: number;
    total: number;
    minimum: number;
    status: string;
}

export const getStockReport = async (minimum = 100): Promise<StockReportRow[]> => {
    const { data, error } = await supabaseAdmin
        .from("stocks")
        .select(`product_id, distributor_id, stock_quantity, products ( product_name, category )`);

    if (error || !data) return [];

    const map: Record<
        string,
        { product_name: string; category: string; pusat: number; distributor: number }
    > = {};

    for (const s of data as any[]) {
        const pid = s.product_id;
        if (!map[pid]) {
            map[pid] = {
                product_name: s.products?.product_name ?? "—",
                category: s.products?.category ?? "—",
                pusat: 0,
                distributor: 0,
            };
        }
        if (s.distributor_id === null) map[pid].pusat += s.stock_quantity;
        else map[pid].distributor += s.stock_quantity;
    }

    return Object.values(map).map((p) => ({
        product_name: p.product_name,
        category: p.category,
        stockPusat: p.pusat,
        stockDistributor: p.distributor,
        total: p.pusat + p.distributor,
        minimum,
        status: p.pusat < minimum ? "Kritis" : "Aman",
    }));
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

export interface AuditLogRow {
    id: string;
    created_at: string;
    activity_type: string;
    description: string;
    user_id: string | null;
    user_name?: string;
}

export const getAuditLogs = async (dateFilter?: string): Promise<AuditLogRow[]> => {
    let query = supabaseAdmin
        .from("activity_logs")
        .select(`id, created_at, activity_type, description, user_id, users ( name, role )`)
        .order("created_at", { ascending: false })
        .limit(200);

    if (dateFilter) {
        query = query
            .gte("created_at", `${dateFilter}T00:00:00`)
            .lte("created_at", `${dateFilter}T23:59:59`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as any[]).map((log) => ({
        id: log.id,
        created_at: log.created_at,
        activity_type: log.activity_type ?? "other",
        description: log.description ?? "—",
        user_id: log.user_id,
        user_name: log.users
            ? `${log.users.name} (${log.users.role === "admin" ? "Admin" : "Distributor"})`
            : "Sistem",
    }));
};
