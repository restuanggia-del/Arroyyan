import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Customer {
    id: string;
    customer_name: string;
    phone: string | null;
    address: string | null;
    is_subscribed: boolean;
    created_at: string;
    sales_id: string | null;
    sales?: { id: string; nama_sales: string } | null;
}

const CUSTOMER_SELECT = "*, sales:sales_id ( id, nama_sales )";

export const getAllCustomers = async () => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .select(CUSTOMER_SELECT)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as Customer[], error: null };
};

export const createCustomer = async (
    customer: Omit<Customer, "id" | "created_at" | "sales">
) => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .insert([customer])
        .select(CUSTOMER_SELECT)
        .single();

    if (error) return { data: null, error };
    return { data: data as unknown as Customer, error: null };
};

export const updateCustomer = async (
    id: string,
    customer: Partial<Omit<Customer, "id" | "created_at" | "sales">>
) => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .update(customer)
        .eq("id", id)
        .select(CUSTOMER_SELECT)
        .single();

    if (error) return { data: null, error };
    return { data: data as unknown as Customer, error: null };
};

export const deleteCustomer = async (id: string) => {
    const { error } = await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};
