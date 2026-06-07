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
    distributor_id: string | null;
    customer_id: string | null;
    total_price: number;
    payment_method: "cash" | "transfer";
    created_at: string;
    customers?: { customer_name: string; phone: string | null } | null;
    transaction_details?: {
        id: string;
        product_id: string;
        quantity: number;
        price: number;
        subtotal: number;
        products?: { product_name: string; category: string } | null;
    }[];
    distributors?: { distributor_name: string } | null;
}

export const getAllTransactions = async () => {
    const { data, error } = await supabaseAdmin
        .from("transactions")
        .select(`
      id,
      distributor_id,
      customer_id,
      total_price,
      payment_method,
      created_at,
      customers ( customer_name, phone ),
      distributors ( distributor_name ),
      transaction_details (
        id,
        product_id,
        quantity,
        price,
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
    paymentMethod: "cash" | "transfer",
    customerId: string | null,
    options:
        | { mode: "admin" }
        | { mode: "distributor"; distributorId: string }
) => {
    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    for (const item of items) {
        const query = supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id);

        if (options.mode === "admin") {
            query.is("distributor_id", null);
        } else {
            query.eq("distributor_id", options.distributorId);
        }

        const { data: stock, error: stockErr } = await query.maybeSingle();

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

    const { data: trx, error: trxErr } = await supabaseAdmin
        .from("transactions")
        .insert([{
            distributor_id: options.mode === "distributor" ? options.distributorId : null,
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
                subtotal: item.price * item.quantity,
            }))
        );

    if (detailErr) return { data: null, error: detailErr };

    for (const item of items) {
        const query = supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id);

        if (options.mode === "admin") {
            query.is("distributor_id", null);
        } else {
            query.eq("distributor_id", options.distributorId);
        }

        const { data: stock } = await query.single();

        if (stock) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: stock.stock_quantity - item.quantity })
                .eq("id", stock.id);
        }

        await supabaseAdmin.from("stock_movements").insert([{
            product_id: item.product_id,
            distributor_id:
                options.mode === "distributor" ? options.distributorId : null,
            movement_type: "sale_out",
            quantity: item.quantity,
            note: `Penjualan #${trx.id.slice(0, 8)} (${options.mode === "admin" ? "pabrik" : "distributor"
                })`,
        }]);
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_transaction",
        description: `Transaksi #${trx.id.slice(0, 8)} | Mode: ${options.mode} | Total: Rp ${totalPrice.toLocaleString("id-ID")}`,
    }]);

    if (customerId) {
        const { data: threshold } = await getSubscriptionThreshold();
        if (threshold) {
            await checkAndUpgradeCustomer(customerId, threshold);
        }
    }

    return { data: trx, error: null };
};