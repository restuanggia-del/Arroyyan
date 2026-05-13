import { supabaseAdmin } from "../lib/supabaseAdmin";

// ─── INTERFACES ─────────────────────────────────────────────────────────────

export interface TransactionItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
}

export interface Transaction {
    id: string;
    distributor_id: string;
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
        products?: { product_name: string } | null;
    }[];
}

// ─── GET ─────────────────────────────────────────────────────────────────────

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
      transaction_details (
        id,
        product_id,
        quantity,
        price,
        subtotal,
        products ( product_name )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: (data as unknown) as Transaction[], error: null };
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
// distributorId: UUID dari tabel distributors (bukan users)
// customerId: UUID dari tabel customers (boleh null)

export const createTransaction = async (
    distributorId: string,
    customerId: string | null,
    items: TransactionItem[],
    paymentMethod: "cash" | "transfer"
) => {
    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // 1. Validasi stok distributor untuk setiap produk
    for (const item of items) {
        const { data: stock, error: stockErr } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .eq("distributor_id", distributorId)
            .maybeSingle();

        if (stockErr) return { error: stockErr };
        if (!stock || stock.stock_quantity < item.quantity) {
            return {
                error: {
                    message: `Stok distributor tidak mencukupi untuk: ${item.product_name}`,
                },
            };
        }
    }

    // 2. Insert header transaksi
    const { data: trx, error: trxErr } = await supabaseAdmin
        .from("transactions")
        .insert([{
            distributor_id: distributorId,
            customer_id: customerId,
            total_price: totalPrice,
            payment_method: paymentMethod,
        }])
        .select()
        .single();

    if (trxErr) return { data: null, error: trxErr };

    // 3. Insert detail transaksi
    const { error: detailErr } = await supabaseAdmin
        .from("transaction_details")
        .insert(items.map((item) => ({
            transaction_id: trx.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
        })));

    if (detailErr) return { data: null, error: detailErr };

    // 4. Kurangi stok distributor per produk
    for (const item of items) {
        const { data: stock } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .eq("distributor_id", distributorId)
            .single();

        if (stock) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: stock.stock_quantity - item.quantity })
                .eq("id", stock.id);
        }

        // Catat di stock_movements
        await supabaseAdmin.from("stock_movements").insert([{
            product_id: item.product_id,
            distributor_id: distributorId,
            movement_type: "sale_out",
            quantity: item.quantity,
            note: `Penjualan #${trx.id.slice(0, 8)}`,
        }]);
    }

    // 5. Activity log
    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_transaction",
        description: `Transaksi baru #${trx.id.slice(0, 8)}, total: Rp ${totalPrice.toLocaleString("id-ID")}`,
    }]);

    return { data: trx, error: null };
};
