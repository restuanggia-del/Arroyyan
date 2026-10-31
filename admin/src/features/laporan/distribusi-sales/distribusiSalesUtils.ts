import { Distribution } from "../../../services/distributionService";

export const LAPORAN_DISTRIBUSI_SALES_ROLES = ["admin", "admin_gudang"];

export const EMPTY_DESCRIPTION =
    "Tidak ada data pada rentang tanggal/filter yang dipilih.";

export type TabId = "rincian" | "per-sales" | "per-produk";
export type StatusFilter = "all" | "pending" | "sent" | "received";

export const TABS: { id: TabId; label: string }[] = [
    { id: "rincian", label: "Rincian Distribusi" },
    { id: "per-sales", label: "Rekap per Sales" },
    { id: "per-produk", label: "Rekap per Produk" },
];

export const statusLabel: Record<string, string> = {
    pending: "Pending",
    sent: "Dikirim",
    received: "Diterima",
};

export const statusBadge: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700",
    sent: "bg-blue-100 text-blue-700",
    received: "bg-green-100 text-green-700",
};

export interface DistRow {
    id: string;
    shortId: string;
    date: string;
    salesId: string;
    salesName: string;
    status: string;
    items: { name: string; category: string; qty: number }[];
    totalQty: number;
    keterangan: string;
}

export interface SalesSummary {
    salesId: string;
    salesName: string;
    jumlahDistribusi: number;
    totalQty: number;
    diterima: number;
    belumDiterima: number;
}

export interface ProductSummary {
    name: string;
    category: string;
    totalQty: number;
    jumlahDistribusi: number;
}

export const toRow = (d: Distribution): DistRow => {
    const items = (d.distribution_details ?? []).map((x) => ({
        name: x.products?.product_name ?? "Produk tidak diketahui",
        category: x.products?.category ?? "—",
        qty: x.quantity ?? 0,
    }));
    return {
        id: d.id,
        shortId: d.id.slice(0, 8).toUpperCase(),
        date: d.distribution_date,
        salesId: d.sales_id as string,
        salesName: d.sales?.nama_sales ?? "—",
        status: d.status,
        items,
        totalQty: items.reduce((s, i) => s + i.qty, 0),
        keterangan: d.keterangan?.trim() ?? "",
    };
};

export const itemsToText = (items: DistRow["items"]) =>
    items.map((i) => `${i.name} (${i.qty})`).join(", ");

export const buildSummaryBySales = (rows: DistRow[]): SalesSummary[] => {
    const map = new Map<string, SalesSummary>();
    for (const r of rows) {
        const cur = map.get(r.salesId) ?? {
            salesId: r.salesId,
            salesName: r.salesName,
            jumlahDistribusi: 0,
            totalQty: 0,
            diterima: 0,
            belumDiterima: 0,
        };
        cur.jumlahDistribusi += 1;
        cur.totalQty += r.totalQty;
        if (r.status === "received") cur.diterima += r.totalQty;
        else cur.belumDiterima += r.totalQty;
        map.set(r.salesId, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
};

export const buildSummaryByProduct = (rows: DistRow[]): ProductSummary[] => {
    const map = new Map<string, ProductSummary>();
    for (const r of rows) {
        const seenInThisDist = new Set<string>();
        for (const it of r.items) {
            const cur = map.get(it.name) ?? {
                name: it.name,
                category: it.category,
                totalQty: 0,
                jumlahDistribusi: 0,
            };
            cur.totalQty += it.qty;
            if (!seenInThisDist.has(it.name)) {
                cur.jumlahDistribusi += 1;
                seenInThisDist.add(it.name);
            }
            map.set(it.name, cur);
        }
    }
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
};
