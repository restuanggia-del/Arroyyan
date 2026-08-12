import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
    getSubscriptionThreshold,
    checkAndUpgradeCustomer,
} from "./subscriptionSettingsService";

export interface TransactionItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
}

export interface Transaction {
    id: string;
    karyawan_id: string | null;
    sales_id: string | null;
    customer_id: string | null;
    total_price: number;
    payment_method: "cash" | "transfer" | "kasbon";
    created_at: string;
    customers?: { customer_name: string; phone: string | null } | null;
    transaction_details?: {
        id: string;
        product_id: string;
        quantity: number;
        price: number;
        harga_pokok: number;
        subtotal: number;
        products?: { product_name: string; category: string } | null;
    }[];
    karyawan?: { nama: string } | null;
    sales?: { nama_sales: string } | null;
}

export const getAllTransactions = async () => {
    const { data, error } = await supabaseAdmin
        .from("transactions")
        .select(`
      id,
      karyawan_id,
      sales_id,
      customer_id,
      total_price,
      payment_method,
      created_at,
      customers ( customer_name, phone ),
      karyawan ( nama ),
      sales ( nama_sales ),
      transaction_details (
        id,
        product_id,
        quantity,
        price,
        harga_pokok,
        subtotal,
        products ( product_name, category )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as Transaction[], error: null };
};

export const createTransaction = async (
    items: TransactionItem[],
    paymentMethod: "cash" | "transfer" | "kasbon",
    customerId: string | null,
    options:
        | { mode: "admin"; karyawanId?: string }
        | { mode: "karyawan"; karyawanId: string }
        | { mode: "sales"; salesId: string }
) => {
    if (paymentMethod === "kasbon" && !customerId) {
        return {
            data: null,
            error: { message: "Transaksi kasbon wajib memilih toko/pelanggan tujuan." },
        };
    }

    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const ownerColumn: "karyawan_id" | "sales_id" | null =
        options.mode === "sales" ? "sales_id" : options.mode === "karyawan" ? "karyawan_id" : null;
    const ownerValue =
        options.mode === "sales" ? options.salesId
            : options.mode === "karyawan" ? options.karyawanId
                : null;

    const stockQuery = (productId: string) => {
        const q = supabaseAdmin.from("stocks").select("id, stock_quantity").eq("product_id", productId);
        if (ownerColumn) return q.eq(ownerColumn, ownerValue as string);
        return q.is("karyawan_id", null).is("sales_id", null);
    };

    for (const item of items) {
        const { data: stock, error: stockErr } = await stockQuery(item.product_id).maybeSingle();

        if (stockErr) return { data: null, error: stockErr };
        if (!stock || stock.stock_quantity < item.quantity) {
            return {
                data: null,
                error: {
                    message: `Stok tidak mencukupi untuk: ${item.product_name}. Tersedia: ${stock?.stock_quantity ?? 0} unit.`,
                },
            };
        }
    }

    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productsErr } = await supabaseAdmin
        .from("products")
        .select("id, price")
        .in("id", productIds);

    if (productsErr) return { data: null, error: productsErr };
    const hargaPokokMap = new Map((products ?? []).map((p) => [p.id, p.price as number]));

    const { data: trx, error: trxErr } = await supabaseAdmin
        .from("transactions")
        .insert([{
            karyawan_id: options.mode === "karyawan" ? options.karyawanId : null,
            sales_id: options.mode === "sales" ? options.salesId : null,
            customer_id: customerId,
            total_price: totalPrice,
            payment_method: paymentMethod,
        }])
        .select()
        .single();

    if (trxErr) return { data: null, error: trxErr };

    const { error: detailErr } = await supabaseAdmin
        .from("transaction_details")
        .insert(
            items.map((item) => ({
                transaction_id: trx.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                harga_pokok: hargaPokokMap.get(item.product_id) ?? item.price,
                subtotal: item.price * item.quantity,
            }))
        );

    if (detailErr) return { data: null, error: detailErr };

    for (const item of items) {
        const { data: stock } = await stockQuery(item.product_id).single();

        if (stock) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: stock.stock_quantity - item.quantity })
                .eq("id", stock.id);
        }

        await supabaseAdmin.from("stock_movements").insert([{
            product_id: item.product_id,
            karyawan_id: options.mode === "karyawan" ? options.karyawanId : null,
            sales_id: options.mode === "sales" ? options.salesId : null,
            movement_type: "sale_out",
            quantity: item.quantity,
            note: `Penjualan #${trx.id.slice(0, 8)} (${options.mode === "admin" ? "pabrik" : options.mode === "sales" ? "sales" : "karyawan"
                })`,
        }]);
    }

    const komisi = items.reduce((sum, item) => {
        const pokok = hargaPokokMap.get(item.product_id) ?? item.price;
        return sum + (item.price - pokok) * item.quantity;
    }, 0);

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_transaction",
        description: `Transaksi #${trx.id.slice(0, 8)} | Mode: ${options.mode} | Total: Rp ${totalPrice.toLocaleString("id-ID")}` +
            (options.mode === "sales" ? ` | Komisi: Rp ${komisi.toLocaleString("id-ID")}` : ""),
    }]);

    if (customerId) {
        const { data: threshold } = await getSubscriptionThreshold();
        if (threshold) {
            await checkAndUpgradeCustomer(customerId, threshold);
        }
    }

    return { data: trx, error: null };
};
