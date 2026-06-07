import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface SystemSettingsData {
    id: string;
    company_name: string;
    company_address: string;
    phone: string;
    email: string;
    receipt_header: string;
    receipt_footer: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsData = {
    id: "",
    company_name: "ARROYYAN99",
    company_address: "Bogatama, Tulang Bawang, Lampung",
    phone: "",
    email: "",
    receipt_header: "Air Minum Dalam Kemasan",
    receipt_footer: "Terima kasih atas pembelian Anda!\nSemoga sehat selalu 💧",
};

export async function getSystemSettings(): Promise<{
    data: SystemSettingsData | null;
    error: unknown;
}> {
    const { data, error } = await supabaseAdmin
        .from("system_settings")
        .select("id, company_name, company_address, phone, email, receipt_header, receipt_footer")
        .limit(1)
        .maybeSingle();

    if (error) return { data: null, error };
    if (!data) return { data: DEFAULT_SYSTEM_SETTINGS, error: null };

    return {
        data: {
            id: data.id ?? "",
            company_name: data.company_name ?? DEFAULT_SYSTEM_SETTINGS.company_name,
            company_address: data.company_address ?? DEFAULT_SYSTEM_SETTINGS.company_address,
            phone: data.phone ?? "",
            email: data.email ?? "",
            receipt_header: data.receipt_header ?? DEFAULT_SYSTEM_SETTINGS.receipt_header,
            receipt_footer: data.receipt_footer ?? DEFAULT_SYSTEM_SETTINGS.receipt_footer,
        },
        error: null,
    };
}

export async function saveSystemSettings(
    id: string | null,
    settings: Omit<SystemSettingsData, "id">
): Promise<{ id: string | null; error: unknown }> {
    const payload = {
        company_name: settings.company_name,
        company_address: settings.company_address,
        phone: settings.phone,
        email: settings.email,
        receipt_header: settings.receipt_header,
        receipt_footer: settings.receipt_footer,
    };

    if (id) {
        const { error } = await supabaseAdmin
            .from("system_settings")
            .update(payload)
            .eq("id", id);
        return { id, error };
    }

    const { data, error } = await supabaseAdmin
        .from("system_settings")
        .insert([payload])
        .select("id")
        .single();

    return { id: data?.id ?? null, error };
}
