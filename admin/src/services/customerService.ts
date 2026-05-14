import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Customer {
    id: string;
    customer_name: string;
    phone: string | null;
    address: string | null;
    is_subscribed: boolean;
    created_at: string;
}

export const getAllCustomers = async () => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Customer[], error: null };
};

export const createCustomer = async (
    customer: Omit<Customer, "id" | "created_at">
) => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .insert([customer])
        .select()
        .single();

    if (error) return { data: null, error };
    return { data: data as Customer, error: null };
};

export const updateCustomer = async (
    id: string,
    customer: Partial<Omit<Customer, "id" | "created_at">>
) => {
    const { data, error } = await supabaseAdmin
        .from("customers")
        .update(customer)
        .eq("id", id)
        .select()
        .single();

    if (error) return { data: null, error };
    return { data: data as Customer, error: null };
};

export const deleteCustomer = async (id: string) => {
    const { error } = await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};
