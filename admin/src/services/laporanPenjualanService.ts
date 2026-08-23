import { supabaseAdmin } from "../lib/supabaseAdmin";
import { PotonganKategori, KATEGORI_POTONGAN_LABEL } from "./potonganSetoranService";

export interface SalesColumn {
    actor_id: string;
    nama: string;
    tipe: "sales" | "karyawan";
}

export interface ProdukHarianRow {
    tanggal: string;
    stok_awal_dus: number;
    produksi_dus: number;
    distribusi: Record<string, number>;
    bonus_dus: number;
    retur_dus: number;
    sodaqoh_dus: number;
    pribadi_dus: number;
    total_keluar_dus: number;
    terjual_dus: number;
    sisa_stock_dus: number;
    jumlah_rp: number;
    dibayar_rp: number;
    bon_rp: number;
}

export interface ProdukHarianTable {
    product_id: string;
    product_name: string;
    size: string | null;
    rows: ProdukHarianRow[];
    total: ProdukHarianRow;
}

export interface PotonganItemRow {
    id: string;
    tanggal: string;
    keterangan: string | null;
    jumlah: number;
    nama_karyawan: string;
}

export interface PotonganDetail {
    bbm: PotonganItemRow[];
    uang_makan: PotonganItemRow[];
    lain_lain: PotonganItemRow[];
    total_bbm: number;
    total_uang_makan: number;
    total_lain_lain: number;
    total: number;
}

export interface TransferItemRow {
    tanggal: string;
    keterangan: string;
    jumlah: number;
}

export interface SetoranItemRow {
    tanggal: string;
    nama_karyawan: string;
    keterangan: string | null;
    jumlah: number;
}

export interface TitipanItemRow {
    tanggal: string;
    keterangan: string;
    dus: number;
    rp: number;
}

export interface TitipanPerSales {
    actor_id: string;
    nama: string;
    items: TitipanItemRow[];
    total_dus: number;
    total_rp: number;
}

export interface KomisiSalesRow {
    sales_id: string;
    nama_sales: string;
    total_dus_terjual: number;
    total_omzet_pabrik: number;
    total_omzet_jual: number;
    total_komisi: number;
}

export interface SetoranSalesRow {
    tanggal: string;
    nama_sales: string;
    jumlah_cash: number;
    jumlah_transfer: number;
    keterangan: string | null;
}

export interface LaporanPenjualanResult {
    periode: string;
    sales_columns: SalesColumn[];
    produk: ProdukHarianTable[];
    potongan: PotonganDetail;
    transfer: { items: TransferItemRow[]; total: number };
    setoran_owner: { items: SetoranItemRow[]; total: number };
    titipan: {
        per_sales: TitipanPerSales[];
        total_dus: number;
        total_rp: number;
    };
    komisi_sales: {
        rows: KomisiSalesRow[];
        total_komisi: number;
    };
    setoran_sales: {
        items: SetoranSalesRow[];
        total_cash: number;
        total_transfer: number;
    };
    ringkasan: {
        total_penjualan_rp: number;
        total_potongan_semua: number;
        sisa_penjualan_rp: number;
        dibulatkan_rp: number;
    };
}

const KELUAR_TYPES = [
    "distribution_out",
    "sale_out",
    "sodaqoh_out",
    "pribadi_out",
    "bonus_out",
    "return_out",
];

const emptyRow = (tanggal: string): ProdukHarianRow => ({
    tanggal,
    stok_awal_dus: 0,
    produksi_dus: 0,
    distribusi: {},
    bonus_dus: 0,
    retur_dus: 0,
    sodaqoh_dus: 0,
    pribadi_dus: 0,
    total_keluar_dus: 0,
    terjual_dus: 0,
    sisa_stock_dus: 0,
    jumlah_rp: 0,
    dibayar_rp: 0,
    bon_rp: 0,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

export const getLaporanPenjualan = async (
    periode: string,
): Promise<{ data: LaporanPenjualanResult | null; error: any }> => {
    const [year, month] = periode.split("-").map(Number);
    if (!year || !month) {
        return {
            data: null,
            error: { message: "Format periode tidak valid, gunakan YYYY-MM." },
        };
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();
    const startDateOnly = startDate.slice(0, 10);
    const endDateOnly = endDate.slice(0, 10);

    const [
        productsRes,
        salesRes,
        salesEntityRes,
        movementsRes,
        stocksRes,
        trxDetailRes,
        potonganRes,
        transferTrxRes,
        kasbonPaymentsRes,
        setoranRes,
        kasbonTrxRes,
        salesDepositsRes,
        salesTrxDetailRes,
    ] = await Promise.all([
        supabaseAdmin
            .from("products")
            .select("id, product_name, size, category, isi_per_dus, price")
            .order("category", { ascending: true })
            .order("size", { ascending: true }),
        supabaseAdmin
            .from("karyawan")
            .select("id, nama, is_active, karyawan_roles ( role )")
            .eq("is_active", true),
        supabaseAdmin
            .from("sales")
            .select("id, nama_sales, is_active")
            .eq("is_active", true),
        supabaseAdmin
            .from("stock_movements")
            .select("product_id, karyawan_id, sales_id, movement_type, quantity, created_at")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin.from("stocks").select("product_id, stock_quantity"),
        supabaseAdmin
            .from("transaction_details")
            .select(`
        product_id, quantity, subtotal,
        transactions!inner ( payment_method, created_at )
      `)
            .gte("transactions.created_at", startDate)
            .lt("transactions.created_at", endDate),
        supabaseAdmin
            .from("potongan")
            .select("id, tanggal, kategori, keterangan, jumlah, karyawan ( nama )")
            .gte("tanggal", startDateOnly)
            .lt("tanggal", endDateOnly)
            .order("tanggal", { ascending: true }),
        supabaseAdmin
            .from("transactions")
            .select("total_price, created_at, karyawan ( nama ), sales ( nama_sales )")
            .eq("payment_method", "transfer")
            .gte("created_at", startDate)
            .lt("created_at", endDate),
        supabaseAdmin
            .from("kasbon_payments")
            .select(`
        tanggal_bayar, jumlah_transfer, keterangan,
        transactions!inner ( karyawan ( nama ), sales ( nama_sales ), customers ( customer_name ) )
      `)
            .gt("jumlah_transfer", 0)
            .gte("tanggal_bayar", startDateOnly)
            .lt("tanggal_bayar", endDateOnly),
        supabaseAdmin
            .from("setoran_owner")
            .select("tanggal, jumlah, keterangan, karyawan ( nama )")
            .gte("tanggal", startDateOnly)
            .lt("tanggal", endDateOnly)
            .order("tanggal", { ascending: true }),
        supabaseAdmin
            .from("transactions")
            .select(`
        id, karyawan_id, sales_id, total_price, created_at,
        karyawan ( nama ),
        sales ( nama_sales ),
        transaction_details ( quantity, products ( size, isi_per_dus ) )
      `)
            .eq("payment_method", "kasbon")
            .gte("created_at", startDate)
            .lt("created_at", endDate)
            .order("created_at", { ascending: true }),
        supabaseAdmin
            .from("sales_deposits")
            .select("tanggal, jumlah_cash, jumlah_transfer, keterangan, sales ( nama_sales )")
            .gte("tanggal", startDateOnly)
            .lt("tanggal", endDateOnly)
            .order("tanggal", { ascending: true }),
        supabaseAdmin
            .from("transactions")
            .select(`
        sales_id, sales ( nama_sales ),
        transaction_details ( quantity, price, harga_pokok, products ( isi_per_dus ) )
      `)
            .not("sales_id", "is", null)
            .gte("created_at", startDate)
            .lt("created_at", endDate),
    ]);

    for (const res of [
        productsRes,
        salesRes,
        salesEntityRes,
        movementsRes,
        stocksRes,
        trxDetailRes,
        potonganRes,
        transferTrxRes,
        kasbonPaymentsRes,
        setoranRes,
        kasbonTrxRes,
        salesDepositsRes,
        salesTrxDetailRes,
    ]) {
        if ((res as any).error) return { data: null, error: (res as any).error };
    }

    const products = (productsRes.data ?? []) as {
        id: string;
        product_name: string;
        size: string | null;
        category: "cup" | "botol" | "galon";
        isi_per_dus: number | null;
        price: number;
    }[];

    const karyawanJualAntarColumns: SalesColumn[] = ((salesRes.data ?? []) as any[])
        .filter((k) => (k.karyawan_roles ?? []).some((r: any) => r.role === "jual_antar"))
        .map((k) => ({ actor_id: k.id, nama: k.nama, tipe: "karyawan" as const }));

    const salesEntityColumns: SalesColumn[] = ((salesEntityRes.data ?? []) as any[])
        .map((s) => ({ actor_id: s.id, nama: s.nama_sales, tipe: "sales" as const }));

    const salesColumns: SalesColumn[] = [...salesEntityColumns, ...karyawanJualAntarColumns]
        .sort((a, b) => a.nama.localeCompare(b.nama));

    const isiPerDusMap = new Map(products.map((p) => [p.id, p.isi_per_dus || 0]));
    const toDus = (productId: string, qty: number) => {
        const isi = isiPerDusMap.get(productId) || 0;
        return isi ? qty / isi : 0;
    };

    const dayMaps = new Map<string, Map<string, ProdukHarianRow>>();
    const getDay = (productId: string, tanggal: string) => {
        if (!dayMaps.has(productId)) dayMaps.set(productId, new Map());
        const m = dayMaps.get(productId)!;
        if (!m.has(tanggal)) m.set(tanggal, emptyRow(tanggal));
        return m.get(tanggal)!;
    };

    for (const m of (movementsRes.data ?? []) as any[]) {
        const tanggal: string = (m.created_at as string).slice(0, 10);
        const dus = toDus(m.product_id, Number(m.quantity));
        const row = getDay(m.product_id, tanggal);

        if (m.movement_type === "stok_awal") {
            row.stok_awal_dus += dus;
        } else if (m.movement_type === "stock_in") {
            row.produksi_dus += dus;
        } else if (m.movement_type === "distribution_out" && (m.sales_id || m.karyawan_id)) {
            const actorId = m.sales_id ?? m.karyawan_id;
            row.distribusi[actorId] = (row.distribusi[actorId] ?? 0) + dus;
        } else if (m.movement_type === "sodaqoh_out") {
            row.sodaqoh_dus += dus;
        } else if (m.movement_type === "pribadi_out") {
            row.pribadi_dus += dus;
        } else if (m.movement_type === "bonus_out") {
            row.bonus_dus += dus;
        } else if (m.movement_type === "return_out") {
            row.retur_dus += dus;
        }

        if (KELUAR_TYPES.includes(m.movement_type)) {
            row.total_keluar_dus += dus;
        }
    }

    for (const t of (trxDetailRes.data ?? []) as any[]) {
        const tanggal: string = (t.transactions.created_at as string).slice(0, 10);
        const dus = toDus(t.product_id, Number(t.quantity));
        const rp = Number(t.subtotal);
        const isBon = t.transactions?.payment_method === "kasbon";
        const row = getDay(t.product_id, tanggal);

        row.terjual_dus += dus;
        row.jumlah_rp += rp;
        if (isBon) row.bon_rp += rp;
        else row.dibayar_rp += rp;
    }

    const liveStockMap = new Map<string, number>();
    for (const s of (stocksRes.data ?? []) as any[]) {
        liveStockMap.set(
            s.product_id,
            (liveStockMap.get(s.product_id) ?? 0) + toDus(s.product_id, Number(s.stock_quantity)),
        );
    }

    const produk: ProdukHarianTable[] = products.map((p) => {
        const dayMap = dayMaps.get(p.id) ?? new Map<string, ProdukHarianRow>();
        const tanggalList = Array.from(dayMap.keys()).sort();

        let running = 0;
        const rows: ProdukHarianRow[] = tanggalList.map((tanggal) => {
            const r = dayMap.get(tanggal)!;
            running += r.stok_awal_dus + r.produksi_dus - r.total_keluar_dus;
            return {
                ...r,
                distribusi: { ...r.distribusi },
                stok_awal_dus: round2(r.stok_awal_dus),
                produksi_dus: round2(r.produksi_dus),
                bonus_dus: round2(r.bonus_dus),
                retur_dus: round2(r.retur_dus),
                sodaqoh_dus: round2(r.sodaqoh_dus),
                pribadi_dus: round2(r.pribadi_dus),
                total_keluar_dus: round2(r.total_keluar_dus),
                terjual_dus: round2(r.terjual_dus),
                sisa_stock_dus: round2(running),
                jumlah_rp: Math.round(r.jumlah_rp),
                dibayar_rp: Math.round(r.dibayar_rp),
                bon_rp: Math.round(r.bon_rp),
            };
        });

        const total: ProdukHarianRow = rows.reduce(
            (acc, r) => {
                acc.stok_awal_dus += r.stok_awal_dus;
                acc.produksi_dus += r.produksi_dus;
                for (const [kid, dus] of Object.entries(r.distribusi)) {
                    acc.distribusi[kid] = (acc.distribusi[kid] ?? 0) + dus;
                }
                acc.bonus_dus += r.bonus_dus;
                acc.retur_dus += r.retur_dus;
                acc.sodaqoh_dus += r.sodaqoh_dus;
                acc.pribadi_dus += r.pribadi_dus;
                acc.total_keluar_dus += r.total_keluar_dus;
                acc.terjual_dus += r.terjual_dus;
                acc.jumlah_rp += r.jumlah_rp;
                acc.dibayar_rp += r.dibayar_rp;
                acc.bon_rp += r.bon_rp;
                return acc;
            },
            emptyRow("TOTAL"),
        );

        total.sisa_stock_dus = round2(liveStockMap.get(p.id) ?? 0);
        for (const k of Object.keys(total.distribusi)) {
            total.distribusi[k] = round2(total.distribusi[k]);
        }

        return {
            product_id: p.id,
            product_name: p.product_name,
            size: p.size,
            rows,
            total,
        };
    });

    const potonganRows = (potonganRes.data ?? []) as any[];
    const mapPotongan = (kategori: PotonganKategori): PotonganItemRow[] =>
        potonganRows
            .filter((p) => p.kategori === kategori)
            .map((p) => ({
                id: p.id,
                tanggal: p.tanggal,
                keterangan: p.keterangan,
                jumlah: Number(p.jumlah),
                nama_karyawan: p.karyawan?.nama ?? "—",
            }));

    const bbm = mapPotongan("bbm");
    const uangMakan = mapPotongan("uang_makan");
    const lainLain = mapPotongan("lain_lain");
    const sumJumlah = (rows: PotonganItemRow[]) => rows.reduce((s, r) => s + r.jumlah, 0);

    const potongan: PotonganDetail = {
        bbm,
        uang_makan: uangMakan,
        lain_lain: lainLain,
        total_bbm: sumJumlah(bbm),
        total_uang_makan: sumJumlah(uangMakan),
        total_lain_lain: sumJumlah(lainLain),
        total: sumJumlah(bbm) + sumJumlah(uangMakan) + sumJumlah(lainLain),
    };

    const transferItems: TransferItemRow[] = [];
    for (const t of (transferTrxRes.data ?? []) as any[]) {
        const namaActor = t.sales?.nama_sales ?? t.karyawan?.nama;
        transferItems.push({
            tanggal: (t.created_at as string).slice(0, 10),
            keterangan: `Penjualan transfer${namaActor ? " — " + namaActor : ""}`,
            jumlah: Number(t.total_price),
        });
    }
    for (const kp of (kasbonPaymentsRes.data ?? []) as any[]) {
        const namaSales =
            kp.transactions?.sales?.nama_sales ?? kp.transactions?.karyawan?.nama;
        const namaToko = kp.transactions?.customers?.customer_name;
        transferItems.push({
            tanggal: kp.tanggal_bayar,
            keterangan:
                kp.keterangan ||
                `Pembayaran titipan${namaSales ? " " + namaSales : ""}${namaToko ? " ke " + namaToko : ""}`,
            jumlah: Number(kp.jumlah_transfer),
        });
    }
    transferItems.sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
    const totalTransfer = transferItems.reduce((s, r) => s + r.jumlah, 0);

    const setoranItems: SetoranItemRow[] = ((setoranRes.data ?? []) as any[]).map((s) => ({
        tanggal: s.tanggal,
        nama_karyawan: s.karyawan?.nama ?? "—",
        keterangan: s.keterangan,
        jumlah: Number(s.jumlah),
    }));
    const totalSetoran = setoranItems.reduce((s, r) => s + r.jumlah, 0);

    const sizeLabelMap = new Map(products.map((p) => [p.id, p.size ?? p.product_name]));
    const titipanBySales = new Map<string, TitipanPerSales>();
    for (const t of (kasbonTrxRes.data ?? []) as any[]) {
        const actorId = t.sales_id ?? t.karyawan_id;
        if (!actorId) continue;
        const nama =
            t.sales?.nama_sales ?? t.karyawan?.nama ?? "(Sales tidak aktif)";
        if (!titipanBySales.has(actorId)) {
            titipanBySales.set(actorId, {
                actor_id: actorId,
                nama,
                items: [],
                total_dus: 0,
                total_rp: 0,
            });
        }
        const bucket = titipanBySales.get(actorId)!;

        const details = (t.transaction_details ?? []) as any[];
        const totalDus = details.reduce((s, d) => {
            const isi = d.products?.isi_per_dus || 0;
            return s + (isi ? Number(d.quantity) / isi : 0);
        }, 0);
        const sizes = Array.from(
            new Set(details.map((d) => sizeLabelMap.get(d.products?.id) ?? d.products?.size ?? "")),
        );
        const labelFromDetails = Array.from(
            new Set(details.map((d) => d.products?.size).filter(Boolean)),
        ).join(", ");

        bucket.items.push({
            tanggal: (t.created_at as string).slice(0, 10),
            keterangan: labelFromDetails || sizes.join(", ") || "—",
            dus: round2(totalDus),
            rp: Number(t.total_price),
        });
        bucket.total_dus += totalDus;
        bucket.total_rp += Number(t.total_price);
    }
    const titipanPerSales = Array.from(titipanBySales.values())
        .map((b) => ({
            ...b,
            total_dus: round2(b.total_dus),
            items: b.items.sort((a, c) => (a.tanggal < c.tanggal ? -1 : 1)),
        }))
        .sort((a, b) => a.nama.localeCompare(b.nama));
    const totalTitipanDus = titipanPerSales.reduce((s, r) => s + r.total_dus, 0);
    const totalTitipanRp = titipanPerSales.reduce((s, r) => s + r.total_rp, 0);

    const totalPenjualanRp = produk.reduce((s, p) => s + p.total.jumlah_rp, 0);
    const totalPotonganSemua =
        potongan.total + totalTransfer + totalSetoran + totalTitipanRp;
    const sisaPenjualanRp = totalPenjualanRp - totalPotonganSemua;
    const dibulatkanRp = Math.round(sisaPenjualanRp / 1000) * 1000;

    const komisiBySales = new Map<string, KomisiSalesRow>();
    for (const t of (salesTrxDetailRes.data ?? []) as any[]) {
        const salesId = t.sales_id as string;
        const namaSales = t.sales?.nama_sales ?? "—";
        if (!komisiBySales.has(salesId)) {
            komisiBySales.set(salesId, {
                sales_id: salesId,
                nama_sales: namaSales,
                total_dus_terjual: 0,
                total_omzet_pabrik: 0,
                total_omzet_jual: 0,
                total_komisi: 0,
            });
        }
        const row = komisiBySales.get(salesId)!;
        for (const d of (t.transaction_details ?? []) as any[]) {
            const isi = d.products?.isi_per_dus || 0;
            const dus = isi ? Number(d.quantity) / isi : 0;
            row.total_dus_terjual += dus;
            row.total_omzet_pabrik += Number(d.harga_pokok) * Number(d.quantity);
            row.total_omzet_jual += Number(d.price) * Number(d.quantity);
            row.total_komisi += (Number(d.price) - Number(d.harga_pokok)) * Number(d.quantity);
        }
    }
    const komisiRows = Array.from(komisiBySales.values())
        .map((r) => ({ ...r, total_dus_terjual: round2(r.total_dus_terjual) }))
        .sort((a, b) => a.nama_sales.localeCompare(b.nama_sales));
    const totalKomisi = komisiRows.reduce((s, r) => s + r.total_komisi, 0);

    const setoranSalesItems: SetoranSalesRow[] = ((salesDepositsRes.data ?? []) as any[]).map(
        (s) => ({
            tanggal: s.tanggal,
            nama_sales: s.sales?.nama_sales ?? "—",
            jumlah_cash: Number(s.jumlah_cash),
            jumlah_transfer: Number(s.jumlah_transfer),
            keterangan: s.keterangan,
        }),
    );
    const totalSetoranCash = setoranSalesItems.reduce((s, r) => s + r.jumlah_cash, 0);
    const totalSetoranTransfer = setoranSalesItems.reduce((s, r) => s + r.jumlah_transfer, 0);

    return {
        data: {
            periode,
            sales_columns: salesColumns,
            produk,
            potongan,
            transfer: { items: transferItems, total: totalTransfer },
            setoran_owner: { items: setoranItems, total: totalSetoran },
            titipan: {
                per_sales: titipanPerSales,
                total_dus: round2(totalTitipanDus),
                total_rp: totalTitipanRp,
            },
            komisi_sales: {
                rows: komisiRows,
                total_komisi: totalKomisi,
            },
            setoran_sales: {
                items: setoranSalesItems,
                total_cash: totalSetoranCash,
                total_transfer: totalSetoranTransfer,
            },
            ringkasan: {
                total_penjualan_rp: totalPenjualanRp,
                total_potongan_semua: totalPotonganSemua,
                sisa_penjualan_rp: sisaPenjualanRp,
                dibulatkan_rp: dibulatkanRp,
            },
        },
        error: null,
    };
};
