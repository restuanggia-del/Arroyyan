import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface SubscriptionThreshold {
    min_total_price: number | null;
    min_total_qty: number | null;
}

export async function getSubscriptionThreshold(): Promise<{
    data: SubscriptionThreshold | null;
    error: unknown;
}> {
    const { data, error } = await supabaseAdmin
        .from("system_settings")
        .select("subscription_min_total_price, subscription_min_total_qty")
        .single();

    if (error) return { data: null, error };

    return {
        data: {
            min_total_price: data?.subscription_min_total_price ?? null,
            min_total_qty: data?.subscription_min_total_qty ?? null,
        },
        error: null,
    };
}

export async function saveSubscriptionThreshold(
    threshold: SubscriptionThreshold
): Promise<{ error: unknown }> {
    const { data: row, error: fetchErr } = await supabaseAdmin
        .from("system_settings")
        .select("id")
        .single();

    if (fetchErr) return { error: fetchErr };

    const { error } = await supabaseAdmin
        .from("system_settings")
        .update({
            subscription_min_total_price: threshold.min_total_price,
            subscription_min_total_qty: threshold.min_total_qty,
        })
        .eq("id", row.id);

    return { error };
}

export async function checkAndUpgradeCustomer(
    customerId: string,
    threshold: SubscriptionThreshold
): Promise<{ upgraded: boolean; error: unknown }> {
    if (!threshold.min_total_price && !threshold.min_total_qty) {
        return { upgraded: false, error: null };
    }

    const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("is_subscribed")
        .eq("id", customerId)
        .single();

    if (existing?.is_subscribed) return { upgraded: false, error: null };

    const { data: txData, error: txError } = await supabaseAdmin
        .from("transactions")
        .select("id, total_price")
        .eq("customer_id", customerId);

    if (txError) return { upgraded: false, error: txError };

    const totalPrice = (txData ?? []).reduce(
        (sum, t) => sum + Number(t.total_price ?? 0),
        0
    );

    let totalQty = 0;
    const txIds = (txData ?? []).map((t) => t.id);

    if (txIds.length > 0) {
        const { data: details, error: detailError } = await supabaseAdmin
            .from("transaction_details")
            .select("quantity")
            .in("transaction_id", txIds);

        if (detailError) return { upgraded: false, error: detailError };

        totalQty = (details ?? []).reduce(
            (sum, d) => sum + Number(d.quantity ?? 0),
            0
        );
    }

    const meetsPrice =
        threshold.min_total_price !== null && totalPrice >= threshold.min_total_price;
    const meetsQty =
        threshold.min_total_qty !== null && totalQty >= threshold.min_total_qty;

    if (!meetsPrice && !meetsQty) return { upgraded: false, error: null };

    const { error: updateError } = await supabaseAdmin
        .from("customers")
        .update({ is_subscribed: true })
        .eq("id", customerId);

    return { upgraded: !updateError, error: updateError ?? null };
}
