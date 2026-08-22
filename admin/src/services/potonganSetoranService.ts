import { supabaseAdmin } from "../lib/supabaseAdmin";

export type PotonganKategori = "bbm" | "uang_makan" | "lain_lain";
export type PotonganOwnerType = "karyawan" | "sales";

export const KATEGORI_POTONGAN_LABEL: Record<PotonganKategori, string> = {
    bbm: "BBM",
    uang_makan: "Uang Makan",
    lain_lain: "Lain-lain",
};

export const OWNER_TYPE_LABEL: Record<PotonganOwnerType, string> = {
    karyawan: "Karyawan",
    sales: "Sales",
};

export interface Potongan {
    id: string;
    tanggal: string;
    kategori: PotonganKategori;
    keterangan: string | null;
    jumlah: number;
    karyawan_id: string | null;
    sales_id: string | null;
    created_at: string;
    karyawan: { nama: string } | null;
    sales: { nama_sales: string } | null;
}

export interface SetoranOwner {
    id: string;
    tanggal: string;
    jumlah: number;
    disetorkan_oleh: string;
    diterima_oleh: string | null;
    keterangan: string | null;
    created_at: string;
    karyawan_disetor: { nama: string } | null;
    user_penerima: { name: string } | null;
}

export interface SisaDanaKaryawan {
    karyawan_id: string;
    nama: string;
    total_cash_masuk: number;
    total_potongan: number;
    total_setoran: number;
    sisa_dana: number;
}

const POTONGAN_SELECT = `
  id, tanggal, kategori, keterangan, jumlah, karyawan_id, sales_id, created_at,
  karyawan ( nama ),
  sales ( nama_sales )
`;

export const getPotonganList = async (limit = 200) => {
    const { data, error } = await supabaseAdmin
        .from("potongan")
        .select(POTONGAN_SELECT)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as Potongan[], error: null };
};

export const createPotongan = async (input: {
    tanggal: string;
    kategori: PotonganKategori;
    keterangan?: string | null;
    jumlah: number;
    owner_type: PotonganOwnerType;
    owner_id: string;
}) => {
    const { data, error } = await supabaseAdmin
        .from("potongan")
        .insert([{
            tanggal: input.tanggal,
            kategori: input.kategori,
            keterangan: input.keterangan || null,
            jumlah: input.jumlah,
            karyawan_id: input.owner_type === "karyawan" ? input.owner_id : null,
            sales_id: input.owner_type === "sales" ? input.owner_id : null,
        }])
        .select(POTONGAN_SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_potongan",
        description: `Potongan ${KATEGORI_POTONGAN_LABEL[input.kategori]} (${OWNER_TYPE_LABEL[input.owner_type]}) sebesar Rp ${input.jumlah.toLocaleString("id-ID")} dicatat`,
    }]);

    return { data: (data as unknown) as Potongan, error: null };
};

export const deletePotongan = async (id: string) => {
    const { error } = await supabaseAdmin.from("potongan").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_potongan",
        description: `Data potongan dihapus`,
    }]);

    return { error: null };
};

const SETORAN_SELECT = `
  id, tanggal, jumlah, disetorkan_oleh, diterima_oleh, keterangan, created_at,
  karyawan_disetor:karyawan!setoran_owner_disetorkan_oleh_fkey ( nama ),
  user_penerima:users!setoran_owner_diterima_oleh_fkey ( name )
`;

export const getSetoranList = async (limit = 200) => {
    const { data, error } = await supabaseAdmin
        .from("setoran_owner")
        .select(SETORAN_SELECT)
        .order("tanggal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown) as SetoranOwner[], error: null };
};

export const createSetoran = async (input: {
    tanggal: string;
    jumlah: number;
    disetorkan_oleh: string;
    diterima_oleh?: string | null;
    keterangan?: string | null;
}) => {
    const { data, error } = await supabaseAdmin
        .from("setoran_owner")
        .insert([{
            tanggal: input.tanggal,
            jumlah: input.jumlah,
            disetorkan_oleh: input.disetorkan_oleh,
            diterima_oleh: input.diterima_oleh || null,
            keterangan: input.keterangan || null,
        }])
        .select(SETORAN_SELECT)
        .single();

    if (error) return { data: null, error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "create_setoran",
        description: `Setoran ke owner sebesar Rp ${input.jumlah.toLocaleString("id-ID")} dicatat`,
    }]);

    return { data: (data as unknown) as SetoranOwner, error: null };
};

export const deleteSetoran = async (id: string) => {
    const { error } = await supabaseAdmin.from("setoran_owner").delete().eq("id", id);
    if (error) return { error };

    await supabaseAdmin.from("activity_logs").insert([{
        activity_type: "delete_setoran",
        description: `Data setoran ke owner dihapus`,
    }]);

    return { error: null };
};

export const getSisaDanaPenjualan = async (): Promise<{
    data: SisaDanaKaryawan[] | null;
    error: any;
}> => {
    const [cashTrxRes, kasbonRes, potonganRes, setoranRes, karyawanRes] =
        await Promise.all([
            supabaseAdmin
                .from("transactions")
                .select("karyawan_id, total_price")
                .eq("payment_method", "cash"),
            supabaseAdmin
                .from("kasbon_payments")
                .select("jumlah_cash, jumlah_ke_owner, transactions!inner(karyawan_id)"),
            supabaseAdmin.from("potongan").select("karyawan_id, jumlah").not("karyawan_id", "is", null),
            supabaseAdmin.from("setoran_owner").select("disetorkan_oleh, jumlah"),
            supabaseAdmin.from("karyawan").select("id, nama").eq("is_active", true),
        ]);

    if (cashTrxRes.error) return { data: null, error: cashTrxRes.error };
    if (kasbonRes.error) return { data: null, error: kasbonRes.error };
    if (potonganRes.error) return { data: null, error: potonganRes.error };
    if (setoranRes.error) return { data: null, error: setoranRes.error };
    if (karyawanRes.error) return { data: null, error: karyawanRes.error };

    const cashMap = new Map<string, number>();

    for (const t of (cashTrxRes.data ?? []) as { karyawan_id: string | null; total_price: number }[]) {
        if (!t.karyawan_id) continue;
        cashMap.set(t.karyawan_id, (cashMap.get(t.karyawan_id) ?? 0) + Number(t.total_price));
    }

    for (const k of (kasbonRes.data ?? []) as any[]) {
        const karyawanId: string | undefined = k.transactions?.karyawan_id;
        if (!karyawanId) continue;
        const net = Number(k.jumlah_cash) - Number(k.jumlah_ke_owner);
        cashMap.set(karyawanId, (cashMap.get(karyawanId) ?? 0) + net);
    }

    const potonganMap = new Map<string, number>();
    for (const p of (potonganRes.data ?? []) as { karyawan_id: string; jumlah: number }[]) {
        potonganMap.set(p.karyawan_id, (potonganMap.get(p.karyawan_id) ?? 0) + Number(p.jumlah));
    }

    const setoranMap = new Map<string, number>();
    for (const s of (setoranRes.data ?? []) as { disetorkan_oleh: string; jumlah: number }[]) {
        setoranMap.set(s.disetorkan_oleh, (setoranMap.get(s.disetorkan_oleh) ?? 0) + Number(s.jumlah));
    }

    const karyawanList = (karyawanRes.data ?? []) as { id: string; nama: string }[];
    const namaMap = new Map(karyawanList.map((k) => [k.id, k.nama]));

    const relevantIds = new Set<string>([
        ...karyawanList.map((k) => k.id),
        ...cashMap.keys(),
        ...potonganMap.keys(),
        ...setoranMap.keys(),
    ]);

    const result: SisaDanaKaryawan[] = Array.from(relevantIds).map((id) => {
        const totalCash = cashMap.get(id) ?? 0;
        const totalPotongan = potonganMap.get(id) ?? 0;
        const totalSetoran = setoranMap.get(id) ?? 0;
        return {
            karyawan_id: id,
            nama: namaMap.get(id) ?? "(Karyawan tidak aktif)",
            total_cash_masuk: totalCash,
            total_potongan: totalPotongan,
            total_setoran: totalSetoran,
            sisa_dana: totalCash - totalPotongan - totalSetoran,
        };
    });

    result.sort((a, b) => b.sisa_dana - a.sisa_dana);

    return { data: result, error: null };
};
