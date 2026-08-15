import { supabase } from '../../utils/supabase/client';

export interface SalesCustomer {
    id: string;
    name: string;
    phone: string;
    address: string;
    isSubscribed: boolean;
}

export const getCustomers = async (): Promise<SalesCustomer[]> => {
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

export const updateCustomer = async (
    id: string,
    customer: { customer_name: string; phone: string; address: string },
) => {
    const { data, error } = await supabase
        .from('customers')
        .update({
            customer_name: customer.customer_name,
            phone: customer.phone || null,
            address: customer.address || null,
        })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};
