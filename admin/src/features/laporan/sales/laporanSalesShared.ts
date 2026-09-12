export const productLabel = (t: { product_name: string; size: string | null }) =>
    `${t.product_name}${t.size ? ` (${t.size})` : ""}`;
