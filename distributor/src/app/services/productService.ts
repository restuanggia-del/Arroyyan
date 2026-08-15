import { supabase } from '../../utils/supabase/client';

export const MIN_STOCK = 20;

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
