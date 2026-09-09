import { supabase } from '../../utils/supabase/client';

export const CHECKLIST_KEBERSIHAN_ITEMS: string[] = [
    'Bodi dicuci bersih (Bebas Noda/ Lumpur)',
    'Kaca Depan, Samping dan spion bersih',
    'Velg dan Ban Disikat/Dicuci',
    'Wiper bersih dan berfungsi baik (Tidak kotor)',
    'Kolong Spakbor bersih dari lumpur',
    'Bagian lantai dalam box bersih tidak berdebu (Disapu)',
    'Bagian langit-langit dalam box bersih',
    'Bagian dinding dalam box bersih',
    'Aroma dalam box segar (Tidak bau Apek)',
    'Tidak ada barang-barang selain produk',
];

export interface ChecklistItemValue {
    itemNo: number;
    itemName: string;
    isChecked: boolean;
    keterangan: string;
}

export interface VehicleChecklist {
    id: string;
    kendaraan: string;
    tanggal: string;
    paraf: string;
    keteranganUmum: string;
    items: ChecklistItemValue[];
    odometerAwal: number | null;
    odometerAkhir: number | null;
    jarakKm: number | null;
}

export const buildEmptyItems = (): ChecklistItemValue[] =>
    CHECKLIST_KEBERSIHAN_ITEMS.map((name, idx) => ({
        itemNo: idx + 1,
        itemName: name,
        isChecked: false,
        keterangan: '',
    }));

const CHECKLIST_SELECT =
    'id, kendaraan, tanggal, paraf, keterangan_umum, odometer_awal, odometer_akhir, vehicle_checklist_items ( id, item_no, item_name, is_checked, keterangan )';

const computeJarak = (awal: number | null, akhir: number | null): number | null => {
    if (awal === null || akhir === null) return null;
    if (akhir < awal) return null;
    return akhir - awal;
};

const mapRow = (row: any): VehicleChecklist => {
    const odometerAwal = row.odometer_awal ?? null;
    const odometerAkhir = row.odometer_akhir ?? null;
    return {
        id: row.id,
        kendaraan: row.kendaraan,
        tanggal: row.tanggal,
        paraf: row.paraf ?? '',
        keteranganUmum: row.keterangan_umum ?? '',
        odometerAwal,
        odometerAkhir,
        jarakKm: computeJarak(odometerAwal, odometerAkhir),
        items: ((row.vehicle_checklist_items ?? []) as any[])
            .slice()
            .sort((a, b) => a.item_no - b.item_no)
            .map((it) => ({
                itemNo: it.item_no,
                itemName: it.item_name,
                isChecked: it.is_checked,
                keterangan: it.keterangan ?? '',
            })),
    };
};

export const getVehiclesUsed = async (salesId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('vehicle_checklists')
        .select('kendaraan, created_at')
        .eq('sales_id', salesId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    (data ?? []).forEach((r: any) => seen.add(r.kendaraan));
    return Array.from(seen);
};

export const getChecklistByDate = async (
    salesId: string,
    kendaraan: string,
    tanggal: string,
): Promise<VehicleChecklist | null> => {
    if (!kendaraan.trim()) return null;

    const { data, error } = await supabase
        .from('vehicle_checklists')
        .select(CHECKLIST_SELECT)
        .eq('sales_id', salesId)
        .eq('kendaraan', kendaraan)
        .eq('tanggal', tanggal)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRow(data);
};

export const getLastOdometerAkhir = async (
    salesId: string,
    kendaraan: string,
    beforeTanggal: string,
): Promise<number | null> => {
    if (!kendaraan.trim()) return null;

    const { data, error } = await supabase
        .from('vehicle_checklists')
        .select('odometer_akhir, tanggal')
        .eq('sales_id', salesId)
        .eq('kendaraan', kendaraan)
        .lt('tanggal', beforeTanggal)
        .not('odometer_akhir', 'is', null)
        .order('tanggal', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.odometer_akhir ?? null;
};

export const getChecklistHistory = async (
    salesId: string,
    periode: string,
): Promise<VehicleChecklist[]> => {
    const [y, m] = periode.split('-').map(Number);
    const start = `${periode}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${periode}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
        .from('vehicle_checklists')
        .select(CHECKLIST_SELECT)
        .eq('sales_id', salesId)
        .gte('tanggal', start)
        .lte('tanggal', end)
        .order('tanggal', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
};

export const saveChecklist = async (
    salesId: string,
    values: {
        kendaraan: string;
        tanggal: string;
        paraf: string;
        keteranganUmum: string;
        items: ChecklistItemValue[];
        odometerAwal: number | null;
        odometerAkhir: number | null;
    },
): Promise<VehicleChecklist> => {
    const existing = await getChecklistByDate(salesId, values.kendaraan, values.tanggal);
    let checklistId: string;

    if (existing) {
        const { error: updErr } = await supabase
            .from('vehicle_checklists')
            .update({
                paraf: values.paraf || null,
                keterangan_umum: values.keteranganUmum || null,
                odometer_awal: values.odometerAwal,
                odometer_akhir: values.odometerAkhir,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        if (updErr) throw new Error(updErr.message);
        checklistId = existing.id;

        const { error: delErr } = await supabase
            .from('vehicle_checklist_items')
            .delete()
            .eq('checklist_id', checklistId);
        if (delErr) throw new Error(delErr.message);
    } else {
        const { data: inserted, error: insErr } = await supabase
            .from('vehicle_checklists')
            .insert([
                {
                    sales_id: salesId,
                    kendaraan: values.kendaraan,
                    tanggal: values.tanggal,
                    paraf: values.paraf || null,
                    keterangan_umum: values.keteranganUmum || null,
                    odometer_awal: values.odometerAwal,
                    odometer_akhir: values.odometerAkhir,
                },
            ])
            .select()
            .single();
        if (insErr) throw new Error(insErr.message);
        checklistId = inserted.id;
    }

    const { error: itemsErr } = await supabase.from('vehicle_checklist_items').insert(
        values.items.map((it) => ({
            checklist_id: checklistId,
            item_no: it.itemNo,
            item_name: it.itemName,
            is_checked: it.isChecked,
            keterangan: it.keterangan || null,
        })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    const saved = await getChecklistByDate(salesId, values.kendaraan, values.tanggal);
    if (!saved) throw new Error('Gagal memuat ulang checklist setelah disimpan.');
    return saved;
};
