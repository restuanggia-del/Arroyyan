export interface BaseDetail {
    quantity: number | string;
    harga_pokok?: number | string | null;
    subtotal?: number | string | null;
}

export const BASE_DETAIL_SELECT = "transaction_details ( quantity, harga_pokok )";

export const effectiveSubtotal = (isSalesTrx: boolean, d: BaseDetail): number => {
    if (isSalesTrx && d.harga_pokok !== null && d.harga_pokok !== undefined) {
        return Number(d.harga_pokok) * Number(d.quantity);
    }
    return Number(d.subtotal ?? 0);
};

export const effectiveTotal = (t: {
    sales_id?: string | null;
    total_price?: number | string | null;
    transaction_details?: BaseDetail[] | null;
}): number => {
    const details = t.transaction_details ?? [];
    if (
        t.sales_id &&
        details.length > 0 &&
        details.every((d) => d.harga_pokok !== null && d.harga_pokok !== undefined)
    ) {
        return details.reduce(
            (s, d) => s + Number(d.harga_pokok) * Number(d.quantity),
            0,
        );
    }
    return Number(t.total_price ?? 0);
};
