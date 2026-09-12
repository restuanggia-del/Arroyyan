export const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export const formatDus = (n: number) =>
    n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export const formatNumber = (n: number) => n.toLocaleString("id-ID");
