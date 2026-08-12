import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface DistributionItem {
    product_id: string;
    quantity: number;
    product_name?: string;
}

export interface Distribution {
    id: string;
    karyawan_id: string | null;
    sales_id: string | null;
    created_by: string | null;
    distribution_date: string;
    status: "pending" | "sent" | "received";
    created_at: string;
    karyawan?: { nama: string; address: string } | null;
    sales?: { nama_sales: string; address: string } | null;
    distribution_details?: {
        id: string;
        product_id: string;
        quantity: number;
        products?: { product_name: string; category: string } | null;
    }[];
}

export const getAllDistributions = async () => {
    const { data, error } = await supabaseAdmin
        .from("distributions")
        .select(`
      id, karyawan_id, sales_id, created_by, distribution_date, status, created_at,
      karyawan ( nama, address ),
      sales ( nama_sales, address ),
      distribution_details (
        id, product_id, quantity,
        products ( product_name, category )
      )
    `)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as unknown as Distribution[], error: null };
};

export const createDistribution = async (
    salesId: string,
    createdBy: string,
    items: DistributionItem[]
) => {
    for (const item of items) {
        const { data: stock, error: stockErr } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .is("karyawan_id", null)
            .is("sales_id", null)
            .maybeSingle();

        if (stockErr) return { error: stockErr };
        if (!stock || stock.stock_quantity < item.quantity)
            return { error: { message: `Stok pusat tidak mencukupi untuk: ${item.product_name ?? item.product_id}` } };
    }

    const { data: dist, error: distErr } = await supabaseAdmin
        .from("distributions")
        .insert([{
            sales_id: salesId,
            karyawan_id: null,
            created_by: createdBy,
            distribution_date: new Date().toISOString().split("T")[0],
            status: "pending",
        }])
        .select()
        .single();

    if (distErr) return { error: distErr };

    const { error: detailErr } = await supabaseAdmin
        .from("distribution_details")
        .insert(items.map((item) => ({
            distribution_id: dist.id,
            product_id: item.product_id,
            quantity: item.quantity,
        })));

    if (detailErr) return { error: detailErr };

    for (const item of items) {
        const { data: central } = await supabaseAdmin
            .from("stocks")
            .select("id, stock_quantity")
            .eq("product_id", item.product_id)
            .is("karyawan_id", null)
            .is("sales_id", null)
            .single();

        if (central) {
            await supabaseAdmin
                .from("stocks")
                .update({ stock_quantity: central.stock_quantity - item.quantity })
                .eq("id", central.id);
        }

        await supabaseAdmin.from("stock_movements").insert([{
            product_id: item.product_id,
            sales_id: salesId,
            movement_type: "distribution_out",
            quantity: item.quantity,
            note: `Distribusi #${dist.id.slice(0, 8)} — keluar dari stok pusat`,
        }]);
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_distribution",
        description: `Distribusi #${dist.id.slice(0, 8)} ke sales_id: ${salesId}, ${items.length} jenis produk`,
    }]);

    return { data: dist, error: null };
};

export const updateDistributionStatus = async (
    distributionId: string,
    status: "pending" | "sent" | "received"
) => {
    if (status === "received") {
        const { data: dist, error: fetchErr } = await supabaseAdmin
            .from("distributions")
            .select("id, karyawan_id, sales_id, status")
            .eq("id", distributionId)
            .single();

        if (fetchErr) return { error: fetchErr };
        if (!dist) return { error: { message: "Data distribusi tidak ditemukan." } };
        if (dist.status === "received")
            return { error: { message: "Distribusi ini sudah dikonfirmasi sebelumnya." } };

        const { data: details, error: detailErr } = await supabaseAdmin
            .from("distribution_details")
            .select("id, quantity, product_id")
            .eq("distribution_id", distributionId);

        if (detailErr) return { error: detailErr };

        const { error: updateErr } = await supabaseAdmin
            .from("distributions")
            .update({ status: "received" })
            .eq("id", distributionId);

        if (updateErr) return { error: updateErr };

        const ownerFilter = dist.sales_id
            ? { column: "sales_id" as const, value: dist.sales_id }
            : { column: "karyawan_id" as const, value: dist.karyawan_id as string };

        for (const detail of details ?? []) {
            const productId = detail.product_id;
            if (!productId || !detail.quantity) continue;

            const { data: stockRow } = await supabaseAdmin
                .from("stocks")
                .select("id, stock_quantity")
                .eq("product_id", productId)
                .eq(ownerFilter.column, ownerFilter.value)
                .maybeSingle();

            if (stockRow) {
                await supabaseAdmin
                    .from("stocks")
                    .update({ stock_quantity: stockRow.stock_quantity + detail.quantity })
                    .eq("id", stockRow.id);
            } else {
                await supabaseAdmin
                    .from("stocks")
                    .insert([{
                        product_id: productId,
                        [ownerFilter.column]: ownerFilter.value,
                        stock_quantity: detail.quantity,
                    }]);
            }

            await supabaseAdmin.from("stock_movements").insert([{
                product_id: productId,
                [ownerFilter.column]: ownerFilter.value,
                movement_type: "distribution_in",
                quantity: detail.quantity,
                note: `Konfirmasi diterima distribusi #${distributionId.slice(0, 8)} (oleh admin)`,
            }]);
        }

        await supabaseAdmin.from("activity_logs").insert([{
            activity_type: "update_distribution_status",
            description: `Distribusi #${distributionId.slice(0, 8)} dikonfirmasi diterima oleh admin — stok diperbarui`,
        }]);

        return { error: null };
    }

    const { error } = await supabaseAdmin
        .from("distributions")
        .update({ status })
        .eq("id", distributionId);

    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "update_distribution_status",
        description: `Status distribusi #${distributionId.slice(0, 8)} → ${status}`,
    }]);

    return { error: null };
};
