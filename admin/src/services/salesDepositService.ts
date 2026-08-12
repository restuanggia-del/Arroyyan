import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface SalesDeposit {
    id: string;
    sales_id: string;
    tanggal: string;
    jumlah_cash: number;
    jumlah_transfer: number;
    diterima_oleh: string | null;
    keterangan: string | null;
    created_at: string;
    sales?: { nama_sales: string } | null;
}

export const getSalesDeposits = async (salesId?: string) => {
    let query = supabaseAdmin
        .from("sales_deposits")
        .select(`id, sales_id, tanggal, jumlah_cash, jumlah_transfer,
      diterima_oleh, keterangan, created_at, sales ( nama_sales )`)
        .order("created_at", { ascending: false });

    if (salesId) query = query.eq("sales_id", salesId);

    const { data, error } = await query;
    if (error) return { data: null, error };
    return { data: data as unknown as SalesDeposit[], error: null };
};

export const createSalesDeposit = async (input: {
    sales_id: string;
    tanggal?: string;
    jumlah_cash: number;
    jumlah_transfer: number;
    diterima_oleh: string;
    keterangan?: string | null;
}) => {
    const { data, error } = await supabaseAdmin
        .from("sales_deposits")
        .insert([{
            sales_id: input.sales_id,
            tanggal: input.tanggal ?? new Date().toISOString().split("T")[0],
            jumlah_cash: input.jumlah_cash,
            jumlah_transfer: input.jumlah_transfer,
            diterima_oleh: input.diterima_oleh,
            keterangan: input.keterangan || null,
        }])
        .select()
        .single();

    if (error) return { data: null, error };

    const total = input.jumlah_cash + input.jumlah_transfer;
    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_sales_deposit",
        description: `Setoran sales #${data.id.slice(0, 8)} — Rp ${total.toLocaleString("id-ID")}`,
    }]);

    return { data: data as SalesDeposit, error: null };
};
