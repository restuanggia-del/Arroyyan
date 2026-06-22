import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface ReturnDetail {
    id: string;
    product_id: string;
    quantity: number;
    products?: { product_name: string; category: string; unit: string } | null;
}

export interface ReturnRow {
    id: string;
    distribution_id: string;
    distributor_id: string;
    status: "pending" | "approved" | "rejected";
    reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    distributors?: { distributor_name: string; address: string } | null;
    return_details?: ReturnDetail[];
}

export const getAllReturns = async () => {
    const { data: returnsData, error } = await supabaseAdmin
        .from("returns")
        .select(`
      id, distribution_id, distributor_id, status, reason, reviewed_by, reviewed_at, created_at,
      distributors ( distributor_name, address )
    `)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    if (!returnsData || returnsData.length === 0) return { data: [], error: null };

    const returnIds = returnsData.map((r: any) => r.id);
    const { data: details } = await supabaseAdmin
        .from("return_details")
        .select("id, return_id, product_id, quantity, products(product_name, category, unit)")
        .in("return_id", returnIds);

    const detailMap: Record<string, ReturnDetail[]> = {};
    for (const det of details ?? []) {
        if (!detailMap[det.return_id]) detailMap[det.return_id] = [];
        detailMap[det.return_id].push({
            id: det.id,
            product_id: det.product_id,
            quantity: det.quantity,
            products: det.products as any,
        });
    }

    const merged = returnsData.map((r: any) => ({
        ...r,
        return_details: detailMap[r.id] ?? [],
    }));

    return { data: merged as ReturnRow[], error: null };
};

export const reviewReturn = async (
    returnId: string,
    decision: "approved" | "rejected",
    reviewedBy: string
) => {
    const { data: ret, error: fetchErr } = await supabaseAdmin
        .from("returns")
        .select("id, distributor_id, status")
        .eq("id", returnId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (!ret) return { error: { message: "Data return tidak ditemukan." } };
    if (ret.status !== "pending")
        return { error: { message: "Return ini sudah ditinjau sebelumnya." } };

    const { error: updateErr } = await supabaseAdmin
        .from("returns")
        .update({
            status: decision,
            reviewed_by: reviewedBy,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", returnId);

    if (updateErr) return { error: updateErr };

    if (decision === "approved") {
        const { data: details, error: detailErr } = await supabaseAdmin
            .from("return_details")
            .select("product_id, quantity")
            .eq("return_id", returnId);

        if (detailErr) return { error: detailErr };

        for (const detail of details ?? []) {
            const { data: stockRow } = await supabaseAdmin
                .from("stocks")
                .select("id, stock_quantity")
                .eq("product_id", detail.product_id)
                .eq("distributor_id", ret.distributor_id)
                .maybeSingle();

            if (stockRow) {
                const newQty = Math.max(0, stockRow.stock_quantity - detail.quantity);
                await supabaseAdmin
                    .from("stocks")
                    .update({ stock_quantity: newQty })
                    .eq("id", stockRow.id);
            }

            await supabaseAdmin.from("stock_movements").insert([{
                product_id: detail.product_id,
                distributor_id: ret.distributor_id,
                movement_type: "return_out",
                quantity: detail.quantity,
                note: `Return disetujui #${returnId.slice(0, 8)} — barang rusak dikembalikan`,
            }]);
        }
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "review_return",
        description: `Admin ${decision === "approved" ? "menyetujui" : "menolak"} return #${returnId.slice(0, 8)}${decision === "approved" ? " — stok distributor diperbarui" : ""
            }`,
    }]);

    return { error: null };
};
