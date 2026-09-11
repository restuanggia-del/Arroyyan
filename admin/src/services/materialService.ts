import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface Material {
    id: string;
    nama_bahan: string;
    satuan: string;
    stock_quantity: number;
    stock_sementara: number;
    is_active: boolean;
    created_at: string;
    isi_per_satuan: number | null;
    minimum_stock: number;
}

export interface MaterialMovement {
    id: string;
    material_id: string;
    movement_type:
    | "masuk"
    | "stok_awal"
    | "keluar"
    | "ke_sementara"
    | "kembali_gudang"
    | "produksi"
    | "stok_awal_sementara"
    | "reject"
    | "reject_bahan"
    | "sampel_out";
    quantity: number;
    note: string | null;
    reason: string | null;
    created_at: string;
    materials: { nama_bahan: string; satuan: string } | null;
}

export const MOVEMENT_TYPE_LABEL: Record<MaterialMovement["movement_type"], string> = {
    masuk: "Stok Masuk (Gudang)",
    stok_awal: "Stok Awal (Input Awal / Opname)",
    keluar: "Stok Keluar (Gudang)",
    ke_sementara: "Pindah ke Sementara",
    kembali_gudang: "Kembali ke Gudang",
    produksi: "Pemakaian Produksi",
    stok_awal_sementara: "Stok Awal Sementara (Pabrik)",
    reject: "Reject Hasil Produksi (Sementara)",
    reject_bahan: "Reject Bahan (Rusak Sebelum Dipakai)",
    sampel_out: "Sampel Produksi",
};

export const REJECT_PRODUKSI_REASON_SUGGESTIONS = [
    "Lid miring",
    "Bocor",
    "Kurang air",
    "Segel tidak rapat",
    "Kemasan penyok/rusak",
    "Lainnya",
];

export const REJECT_BAHAN_REASON_SUGGESTIONS = [
    "Kardus sobek/basah",
    "Lid cacat pabrik",
    "Cup retak",
    "Straw rusak",
    "Lainnya",
];

export const MATERIAL_MINIMUM_STOCK = 10;

export const getMaterialMinimumStock = (m: Pick<Material, "minimum_stock">): number =>
    m.minimum_stock ?? MATERIAL_MINIMUM_STOCK;

export const getMaterials = async () => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: null, error };
    return { data: data as Material[], error: null };
};

export const getActiveMaterials = async () => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .select("*")
        .eq("is_active", true)
        .order("nama_bahan", { ascending: true });

    if (error) return { data: null, error };
    return { data: data as Material[], error: null };
};

export const createMaterial = async (
    material: Pick<Material, "nama_bahan" | "satuan" | "is_active" | "isi_per_satuan" | "minimum_stock">
) => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .insert([{ ...material, stock_quantity: 0 }])
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "create_material",
            description: `Bahan baru ditambahkan: ${material.nama_bahan}`,
        },
    ]);

    return { data: data as Material, error: null };
};

export const updateMaterial = async (
    id: string,
    material: Partial<Pick<Material, "nama_bahan" | "satuan" | "is_active" | "isi_per_satuan" | "minimum_stock">>
) => {
    const { data, error } = await supabaseAdmin
        .from("materials")
        .update(material)
        .eq("id", id)
        .select()
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "update_material",
            description: `Bahan diperbarui: ${material.nama_bahan ?? id}`,
        },
    ]);

    return { data: data as Material, error: null };
};

export const toggleMaterialStatus = async (id: string, isActive: boolean) => {
    const { error } = await supabaseAdmin
        .from("materials")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) return { error };
    return { error: null };
};

export const deleteMaterial = async (id: string, namaBahan: string) => {
    const { error } = await supabaseAdmin.from("materials").delete().eq("id", id);

    if (error) {
        if ((error as any).code === "23503") {
            return {
                error: {
                    message:
                        `"${namaBahan}" sudah punya riwayat pergerakan stok (masuk/keluar/dll), ` +
                        `jadi tidak bisa dihapus permanen. Nonaktifkan saja bahan ini lewat tombol ` +
                        `status di tabel — riwayatnya tetap aman dan bahan otomatis hilang dari ` +
                        `pilihan transaksi baru.`,
                    code: "HAS_MOVEMENTS",
                },
            };
        }
        return { error };
    }

    await supabaseAdmin.from("activity_logs").insert([
        {
            activity_type: "delete_material",
            description: `Bahan dihapus: ${namaBahan}`,
        },
    ]);

    return { error: null };
};

export const getMaterialMovements = async (limit = 50) => {
    const { data, error } = await supabaseAdmin
        .from("material_movements")
        .select(`
      id,
      material_id,
      movement_type,
      quantity,
      note,
      reason,
      created_at,
      materials ( nama_bahan, satuan )
    `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as MaterialMovement[], error: null };
};

export const addMaterialStock = async (
    materialId: string,
    quantity: number,
    note: string,
    movementType: "masuk" | "stok_awal" = "masuk"
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_quantity: existing.stock_quantity + quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: movementType,
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const reduceMaterialStock = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_quantity < quantity) {
        return { error: { message: "Stok bahan tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_quantity: existing.stock_quantity - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "keluar",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const moveToSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_quantity, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_quantity < quantity) {
        return { error: { message: "Stok bahan gudang tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({
            stock_quantity: existing.stock_quantity - quantity,
            stock_sementara: existing.stock_sementara + quantity,
        })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "ke_sementara",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const addSementaraStokAwal = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara + quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "stok_awal_sementara",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const consumeSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "produksi",
            quantity,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const rejectSementara = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi" } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "reject",
            quantity: Math.max(Math.round(quantity), 1),
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const recordSampel = async (
    materialId: string,
    quantity: number,
    note: string
) => {
    if (quantity < 1) {
        return { error: { message: "Jumlah sampel harus minimal 1." } };
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi untuk diambil sebagai sampel." } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "sampel_out",
            quantity: Math.round(quantity),
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const recordRejectBahan = async (
    materialId: string,
    quantity: number,
    reason: string,
    note: string
) => {
    if (quantity < 1) {
        return { error: { message: "Jumlah reject bahan harus minimal 1." } };
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };
    if (existing.stock_sementara < quantity) {
        return { error: { message: "Stok sementara tidak mencukupi." } };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: existing.stock_sementara - quantity })
        .eq("id", materialId);

    if (error) return { error };

    const { error: movErr } = await supabaseAdmin
        .from("material_movements")
        .insert([{
            material_id: materialId,
            movement_type: "reject_bahan",
            quantity: Math.round(quantity),
            reason: reason || null,
            note: note || null,
        }]);

    if (movErr) return { error: movErr };
    return { error: null };
};

export const recordSisaBahan = async (
    materialId: string,
    sisaCount: number,
    note: string
) => {
    if (sisaCount < 0) {
        return { error: { message: "Jumlah sisa tidak boleh negatif." } };
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, stock_sementara")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const stokSaatIni = Number(existing.stock_sementara) || 0;
    const pemakaian = stokSaatIni - sisaCount;

    if (pemakaian < 0) {
        return {
            error: {
                message: `Sisa yang diinput (${sisaCount}) lebih besar dari Stok Sementara saat ini (${stokSaatIni}). Periksa kembali jumlahnya.`,
            },
        };
    }

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: sisaCount })
        .eq("id", materialId);

    if (error) return { error };

    const pemakaianBulat = Math.round(pemakaian);
    if (pemakaianBulat > 0) {
        const autoNote = `Otomatis dari Sisa Bahan (stok sementara ${stokSaatIni} → sisa ${sisaCount})`;
        const { error: movErr } = await supabaseAdmin
            .from("material_movements")
            .insert([{
                material_id: materialId,
                movement_type: "produksi",
                quantity: pemakaianBulat,
                note: note ? `${autoNote} — ${note}` : autoNote,
            }]);

        if (movErr) return { error: movErr };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "sisa_bahan_material",
        description: `Sisa Bahan dicatat: stok sementara ${stokSaatIni} → ${sisaCount} (Pemakaian Produksi otomatis ${pemakaianBulat})`,
    }]);

    return { error: null };
};

export interface RejectItemInput {
    reason: string;
    qtyPcs: number;
}

export const recordPemakaianProduksiGabungan = async (
    materialId: string,
    jumlahSatuan: number,
    rejectItems: RejectItemInput[],
    sampelQtyPcs: number,
    sisaQtyPcs: number,
    note: string
) => {
    if (jumlahSatuan < 1) {
        return { error: { message: "Jumlah pemakaian harus minimal 1." } };
    }
    const rejectQtyPcs = rejectItems.reduce(
        (s, r) => s + (Number(r.qtyPcs) || 0),
        0,
    );
    if (rejectQtyPcs < 0 || sampelQtyPcs < 0 || sisaQtyPcs < 0) {
        return { error: { message: "Jumlah reject/sampel/sisa tidak boleh negatif." } };
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("materials")
        .select("id, nama_bahan, satuan, stock_sementara, isi_per_satuan")
        .eq("id", materialId)
        .single();

    if (fetchErr) return { error: fetchErr };

    const stokSaatIni = Number(existing.stock_sementara) || 0;
    if (jumlahSatuan > stokSaatIni) {
        return {
            error: {
                message: `Jumlah yang diambil (${jumlahSatuan} ${existing.satuan}) melebihi Stok Sementara saat ini (${stokSaatIni} ${existing.satuan}).`,
            },
        };
    }

    const isiPerSatuan = Number(existing.isi_per_satuan) || 0;
    const pcsPerUnit = isiPerSatuan > 0 ? isiPerSatuan : 1;
    const grossPcs = jumlahSatuan * pcsPerUnit;
    const totalAlokasiPcs = rejectQtyPcs + sampelQtyPcs + sisaQtyPcs;

    if (totalAlokasiPcs > grossPcs) {
        return {
            error: {
                message: `Total Reject + Sampel + Sisa Bahan (${totalAlokasiPcs.toLocaleString("id-ID")} pcs) tidak boleh melebihi Jumlah yang diambil (${grossPcs.toLocaleString("id-ID")} pcs).`,
            },
        };
    }

    const netUsagePcs = grossPcs - totalAlokasiPcs;
    const sisaSatuan = sisaQtyPcs / pcsPerUnit;
    const netUsageSatuan = netUsagePcs / pcsPerUnit;

    const pengurangan = jumlahSatuan - sisaSatuan;
    const saldoBaru = stokSaatIni - pengurangan;

    const { error } = await supabaseAdmin
        .from("materials")
        .update({ stock_sementara: saldoBaru })
        .eq("id", materialId);

    if (error) return { error };

    const movements: {
        material_id: string;
        movement_type: "produksi" | "reject" | "sampel_out";
        quantity: number;
        note: string | null;
        reason?: string | null;
    }[] = [];

    const netUsageQty = Math.round(netUsageSatuan);
    if (netUsageQty > 0) {
        movements.push({
            material_id: materialId,
            movement_type: "produksi",
            quantity: netUsageQty,
            note: note || null,
        });
    }

    for (const item of rejectItems) {
        const qtyPcs = Number(item.qtyPcs) || 0;
        if (qtyPcs <= 0) continue;
        const reason = item.reason?.trim() || "Lainnya";
        const qtySatuan = qtyPcs / pcsPerUnit;
        const autoNote =
            isiPerSatuan > 0
                ? `Reject ${qtyPcs.toLocaleString("id-ID")} pcs — ${reason} (dari Pemakaian Produksi)`
                : `Reject — ${reason} (dari Pemakaian Produksi)`;
        movements.push({
            material_id: materialId,
            movement_type: "reject",
            quantity: Math.max(Math.round(qtySatuan), 1),
            reason,
            note: note ? `${autoNote} — ${note}` : autoNote,
        });
    }

    if (sampelQtyPcs > 0) {
        const sampelSatuan = sampelQtyPcs / pcsPerUnit;
        const autoNote =
            isiPerSatuan > 0
                ? `Sampel ${sampelQtyPcs.toLocaleString("id-ID")} pcs (dari Pemakaian Produksi)`
                : `Sampel (dari Pemakaian Produksi)`;
        movements.push({
            material_id: materialId,
            movement_type: "sampel_out",
            quantity: Math.max(Math.round(sampelSatuan), 1),
            note: note ? `${autoNote} — ${note}` : autoNote,
        });
    }

    if (movements.length > 0) {
        const { error: movErr } = await supabaseAdmin
            .from("material_movements")
            .insert(movements);
        if (movErr) return { error: movErr };
    }

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "pemakaian_produksi_material",
        description:
            `Pemakaian Produksi ${existing.nama_bahan}: ambil ${jumlahSatuan} ${existing.satuan} (${grossPcs.toLocaleString("id-ID")} pcs)` +
            (rejectQtyPcs > 0 ? `, reject ${rejectQtyPcs.toLocaleString("id-ID")} pcs` : "") +
            (sampelQtyPcs > 0 ? `, sampel ${sampelQtyPcs.toLocaleString("id-ID")} pcs` : "") +
            (sisaQtyPcs > 0 ? `, sisa ${sisaQtyPcs.toLocaleString("id-ID")} pcs (tetap di Stok Sementara)` : "") +
            ` → bersih terpakai ${netUsageQty.toLocaleString("id-ID")} ${existing.satuan}.`,
    }]);

    return { error: null };
};
