import { supabaseAdmin } from "../lib/supabaseAdmin";

// ─── INTERFACES ─────────────────────────────────────────────────────────────

export interface DistributionItem {
    product_id: string;
    quantity: number;
    product_name?: string;
}

export interface Distribution {
    id: string;
    distributor_id: string;
    created_by: string | null;
    distribution_date: string;
    status: "pending" | "sent" | "received";
    created_at: string;
    distributors?: { distributor_name: string; address: string } | null;
    distribution_details?: {
        id: string;
        product_id: string;
        quantity: number;
        products?: { product_name: string; category: string } | null;
    }[];
}

// ─── GET ALL ─────────────────────────────────────────────────────────────────

export const getAllDistributions = async () => {
    const { data, error } = await supabaseAdmin
        .from("distributions")
        .select(`
      id,
      distributor_id,
      created_by,
      distribution_date,
      status,
      created_at,
      distributors ( distributor_name, address ),
      distribution_details (
        id,
        product_id,
        quantity,
        products ( product_name, category )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[distributionService] getAllDistributions error:", error);
        return { data: null, error };
    }
    return { data: (data as unknown) as Distribution[], error: null };
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
// Support multiple produk dalam satu pengiriman

export const createDistribution = async (
    distributorId: string,
    createdBy: string,
    items: DistributionItem[]
) => {
    // 1. Validasi stok pusat untuk setiap produk
    for (const item of items) {
        const { data: stock, error: stockErr } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .is("distributor_id", null)
            .maybeSingle();

        if (stockErr) return { error: stockErr };
        if (!stock || stock.stock_quantity < item.quantity) {
            return {
                error: {
                    message: `Stok pusat tidak mencukupi untuk: ${item.product_name ?? item.product_id}`,
                },
            };
        }
    }

    // 2. Insert header distribusi
    const { data: dist, error: distErr } = await supabaseAdmin
        .from("distributions")
        .insert([{
            distributor_id: distributorId,
            created_by: createdBy,
            distribution_date: new Date().toISOString().split("T")[0],
            status: "pending",
        }])
        .select()
        .single();

    if (distErr) return { error: distErr };

    // 3. Insert detail produk
    const { error: detailErr } = await supabaseAdmin
        .from("distribution_details")
        .insert(items.map((item) => ({
            distribution_id: dist.id,
            product_id: item.product_id,
            quantity: item.quantity,
        })));

    if (detailErr) return { error: detailErr };

    // 4. Update stok otomatis per produk
    for (const item of items) {
        // Kurangi stok pusat
        const { data: central } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .is("distributor_id", null)
            .single();

        if (central) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: central.stock_quantity - item.quantity })
                .eq("id", central.id);
        }

        // Tambah/buat stok distributor
        const { data: distStock } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .eq("distributor_id", distributorId)
            .maybeSingle();

        if (distStock) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: distStock.stock_quantity + item.quantity })
                .eq("id", distStock.id);
        } else {
            await supabaseAdmin
                .from("stocks")
                .insert([{
                    product_id: item.product_id,
                    distributor_id: distributorId,
                    stock_quantity: item.quantity,
                }]);
        }

        // Catat di stock_movements
        await supabaseAdmin.from("stock_movements").insert([{
            product_id: item.product_id,
            distributor_id: distributorId,
            movement_type: "distribution_out",
            quantity: item.quantity,
            note: `Distribusi #${dist.id.slice(0, 8)}`,
        }]);
    }

    // 5. Activity log
    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_distribution",
        description: `Distribusi baru ke distributor_id: ${distributorId}, ${items.length} jenis produk`,
    }]);

    return { data: dist, error: null };
};

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────

export const updateDistributionStatus = async (
    distributionId: string,
    status: "pending" | "sent" | "received"
) => {
    const { error } = await supabaseAdmin
        .from("distributions")
        .update({ status })
        .eq("id", distributionId);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_distribution_status",
        description: `Status distribusi ${distributionId} → ${status}`,
    }]);

    return { error: null };
};
