import { supabaseAdmin } from "../lib/supabaseAdmin";
import { addCentralStock } from "./stockService";

export interface RejectItemInput {
    reason: string;
    qtyPcs: number;
}

export interface ProduksiBahanRowInput {
    materialId: string;
    rejectItems: RejectItemInput[];
    sampelPcs: number;
    rejectBahanPcs: number;
    rejectBahanReason: string;
    sisaPcs: number;
}

export interface ProduksiHarianInput {
    tanggal: string;
    productId: string | null;
    jumlahDus: number;
    catatan: string;
    bahanRows: ProduksiBahanRowInput[];
}

export interface ProduksiHarianBahanDetail {
    id: string;
    material_id: string | null;
    material_name_snapshot: string;
    satuan_snapshot: string;
    jumlah_awal_pcs: number;
    reject_pcs: number;
    reject_detail: RejectItemInput[];
    sampel_pcs: number;
    reject_bahan_pcs: number;
    reject_bahan_reason: string | null;
    sisa_pcs: number;
    pemakaian_bersih_pcs: number;
}

export interface ProduksiHarianSession {
    id: string;
    tanggal: string;
    product_id: string | null;
    product_name_snapshot: string | null;
    jumlah_dus: number;
    jumlah_pcs: number;
    note: string | null;
    created_at: string;
    bahan: ProduksiHarianBahanDetail[];
}

export const recordProduksiHarian = async (input: ProduksiHarianInput) => {
    const activeRows = input.bahanRows.filter((r) => !!r.materialId);
    const hasHasilProduksi = !!input.productId && input.jumlahDus > 0;

    if (!hasHasilProduksi && activeRows.length === 0) {
        return {
            error: {
                message:
                    "Isi minimal Hasil Produksi atau salah satu baris Bahan yang Dipakai.",
            },
        };
    }

    const materialIds = Array.from(new Set(activeRows.map((r) => r.materialId)));
    let materialMap = new Map<string, any>();

    if (materialIds.length > 0) {
        const { data: materialsData, error: matErr } = await supabaseAdmin
            .from("materials")
            .select("id, nama_bahan, satuan, stock_sementara, isi_per_satuan")
            .in("id", materialIds);
        if (matErr) return { error: matErr };
        materialMap = new Map((materialsData ?? []).map((m: any) => [m.id, m]));
    }

    const stockUpdates: { id: string; stock_sementara: number }[] = [];
    const movements: {
        material_id: string;
        movement_type: "produksi" | "reject" | "reject_bahan" | "sampel_out";
        quantity: number;
        reason?: string | null;
        note: string | null;
    }[] = [];
    const bahanDetailRows: Omit<ProduksiHarianBahanDetail, "id">[] = [];

    for (const row of activeRows) {
        const mat = materialMap.get(row.materialId);
        if (!mat) {
            return { error: { message: "Salah satu bahan tidak ditemukan." } };
        }

        const isiPerSatuan = Number(mat.isi_per_satuan) || 0;
        const pcsPerUnit = isiPerSatuan > 0 ? isiPerSatuan : 1;
        const awalSatuan = Number(mat.stock_sementara) || 0;
        const awalPcs = awalSatuan * pcsPerUnit;

        const rejectItems = (row.rejectItems || []).filter(
            (r) => (Number(r.qtyPcs) || 0) > 0,
        );
        const rejectPcs = rejectItems.reduce(
            (s, r) => s + (Number(r.qtyPcs) || 0),
            0,
        );
        const sampelPcs = Number(row.sampelPcs) || 0;
        const rejectBahanPcs = Number(row.rejectBahanPcs) || 0;
        const sisaPcs = Number(row.sisaPcs) || 0;

        if (rejectPcs < 0 || sampelPcs < 0 || rejectBahanPcs < 0 || sisaPcs < 0) {
            return {
                error: {
                    message: `Jumlah pada ${mat.nama_bahan} tidak boleh negatif.`,
                },
            };
        }
        if (sisaPcs > awalPcs) {
            return {
                error: {
                    message: `Sisa Bahan ${mat.nama_bahan} (${sisaPcs.toLocaleString("id-ID")} pcs) tidak boleh melebihi Stok Sementara saat ini (${awalPcs.toLocaleString("id-ID")} pcs).`,
                },
            };
        }

        const totalOutPcs = awalPcs - sisaPcs;
        const alokasiPcs = rejectPcs + sampelPcs + rejectBahanPcs;
        if (alokasiPcs > totalOutPcs) {
            return {
                error: {
                    message: `Total Reject + Sampel + Reject Bahan pada ${mat.nama_bahan} (${alokasiPcs.toLocaleString("id-ID")} pcs) melebihi jumlah yang keluar dari ruang produksi (${totalOutPcs.toLocaleString("id-ID")} pcs).`,
                },
            };
        }

        const netUsagePcs = totalOutPcs - alokasiPcs;
        const netUsageSatuan = netUsagePcs / pcsPerUnit;
        const sisaSatuan = sisaPcs / pcsPerUnit;

        stockUpdates.push({ id: mat.id, stock_sementara: sisaSatuan });

        const netUsageQty = Math.round(netUsageSatuan);
        if (netUsageQty > 0) {
            movements.push({
                material_id: mat.id,
                movement_type: "produksi",
                quantity: netUsageQty,
                note: input.catatan
                    ? `Pemakaian Produksi Harian (${input.tanggal}) — ${input.catatan}`
                    : `Pemakaian Produksi Harian (${input.tanggal})`,
            });
        }

        for (const item of rejectItems) {
            const qtyPcs = Number(item.qtyPcs) || 0;
            const reason = item.reason?.trim() || "Lainnya";
            const qtySatuan = Math.max(Math.round(qtyPcs / pcsPerUnit), 1);
            movements.push({
                material_id: mat.id,
                movement_type: "reject",
                quantity: qtySatuan,
                reason,
                note: `Reject ${qtyPcs.toLocaleString("id-ID")} pcs — ${reason} (Produksi Harian ${input.tanggal})`,
            });
        }

        if (sampelPcs > 0) {
            const qtySatuan = Math.max(Math.round(sampelPcs / pcsPerUnit), 1);
            movements.push({
                material_id: mat.id,
                movement_type: "sampel_out",
                quantity: qtySatuan,
                note: `Sampel ${sampelPcs.toLocaleString("id-ID")} pcs (Produksi Harian ${input.tanggal})`,
            });
        }

        if (rejectBahanPcs > 0) {
            const reason = row.rejectBahanReason?.trim() || "Lainnya";
            const qtySatuan = Math.max(Math.round(rejectBahanPcs / pcsPerUnit), 1);
            movements.push({
                material_id: mat.id,
                movement_type: "reject_bahan",
                quantity: qtySatuan,
                reason,
                note: `Reject Bahan ${rejectBahanPcs.toLocaleString("id-ID")} pcs — ${reason} (Produksi Harian ${input.tanggal})`,
            });
        }

        bahanDetailRows.push({
            material_id: mat.id,
            material_name_snapshot: mat.nama_bahan,
            satuan_snapshot: mat.satuan,
            jumlah_awal_pcs: awalPcs,
            reject_pcs: rejectPcs,
            reject_detail: rejectItems.map((r) => ({
                reason: r.reason?.trim() || "Lainnya",
                qtyPcs: Number(r.qtyPcs) || 0,
            })),
            sampel_pcs: sampelPcs,
            reject_bahan_pcs: rejectBahanPcs,
            reject_bahan_reason: rejectBahanPcs > 0 ? (row.rejectBahanReason?.trim() || "Lainnya") : null,
            sisa_pcs: sisaPcs,
            pemakaian_bersih_pcs: Math.max(netUsagePcs, 0),
        });
    }

    for (const u of stockUpdates) {
        const { error } = await supabaseAdmin
            .from("materials")
            .update({ stock_sementara: u.stock_sementara })
            .eq("id", u.id);
        if (error) return { error };
    }

    if (movements.length > 0) {
        const { error } = await supabaseAdmin
            .from("material_movements")
            .insert(movements);
        if (error) return { error };
    }

    let productName: string | null = null;
    let jumlahPcs = 0;
    if (hasHasilProduksi) {
        const { data: product, error: prodErr } = await supabaseAdmin
            .from("products")
            .select("id, product_name, isi_per_dus")
            .eq("id", input.productId as string)
            .single();
        if (prodErr) return { error: prodErr };

        productName = product.product_name;
        jumlahPcs = (Number(product.isi_per_dus) || 0) * input.jumlahDus;

        const { error: stockErr } = await addCentralStock(
            input.productId as string,
            input.jumlahDus,
            "stock_in",
            input.catatan
                ? `Hasil Produksi Harian (${input.tanggal}) — ${input.catatan}`
                : `Hasil Produksi Harian (${input.tanggal})`,
        );
        if (stockErr) return { error: stockErr };
    }

    const { data: session, error: sessErr } = await supabaseAdmin
        .from("produksi_harian_sessions")
        .insert([{
            tanggal: input.tanggal,
            product_id: input.productId,
            product_name_snapshot: productName,
            jumlah_dus: input.jumlahDus || 0,
            jumlah_pcs: jumlahPcs,
            note: input.catatan || null,
        }])
        .select()
        .single();

    if (sessErr) return { error: sessErr };

    if (bahanDetailRows.length > 0) {
        const { error: bahanErr } = await supabaseAdmin
            .from("produksi_harian_bahan")
            .insert(
                bahanDetailRows.map((r) => ({ ...r, session_id: session.id })),
            );
        if (bahanErr) return { error: bahanErr };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "produksi_harian",
        description:
            `Produksi Harian ${input.tanggal}` +
            (productName
                ? `: Hasil Produksi ${productName} ${input.jumlahDus.toLocaleString("id-ID")} dus (${jumlahPcs.toLocaleString("id-ID")} pcs)`
                : "") +
            (bahanDetailRows.length > 0
                ? `, ${bahanDetailRows.length} bahan dicatat pemakaiannya`
                : ""),
    }]);

    return { error: null, data: session };
};

export const getProduksiHarianSessions = async (
    startDate: string,
    endDate: string,
): Promise<{ data: ProduksiHarianSession[] | null; error: any }> => {
    const { data: sessions, error: sessErr } = await supabaseAdmin
        .from("produksi_harian_sessions")
        .select("*")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false });

    if (sessErr) return { data: null, error: sessErr };
    if (!sessions || sessions.length === 0) return { data: [], error: null };

    const sessionIds = sessions.map((s: any) => s.id);
    const { data: bahanRows, error: bahanErr } = await supabaseAdmin
        .from("produksi_harian_bahan")
        .select("*")
        .in("session_id", sessionIds);

    if (bahanErr) return { data: null, error: bahanErr };

    const result: ProduksiHarianSession[] = sessions.map((s: any) => ({
        id: s.id,
        tanggal: s.tanggal,
        product_id: s.product_id,
        product_name_snapshot: s.product_name_snapshot,
        jumlah_dus: Number(s.jumlah_dus) || 0,
        jumlah_pcs: Number(s.jumlah_pcs) || 0,
        note: s.note,
        created_at: s.created_at,
        bahan: (bahanRows ?? [])
            .filter((b: any) => b.session_id === s.id)
            .map((b: any) => ({
                id: b.id,
                material_id: b.material_id,
                material_name_snapshot: b.material_name_snapshot,
                satuan_snapshot: b.satuan_snapshot,
                jumlah_awal_pcs: Number(b.jumlah_awal_pcs) || 0,
                reject_pcs: Number(b.reject_pcs) || 0,
                reject_detail: Array.isArray(b.reject_detail)
                    ? b.reject_detail
                    : [],
                sampel_pcs: Number(b.sampel_pcs) || 0,
                reject_bahan_pcs: Number(b.reject_bahan_pcs) || 0,
                reject_bahan_reason: b.reject_bahan_reason,
                sisa_pcs: Number(b.sisa_pcs) || 0,
                pemakaian_bersih_pcs: Number(b.pemakaian_bersih_pcs) || 0,
            })),
    }));

    return { data: result, error: null };
};
