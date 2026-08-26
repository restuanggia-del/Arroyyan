import { supabaseAdmin } from "../lib/supabaseAdmin";

export const parseDbTimestamp = (value: string): Date => {
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
};

export type NotificationKind =
    | "penjualan"
    | "keuangan"
    | "karyawan_sales"
    | "produk"
    | "sistem"
    | "lainnya";

export interface NotificationItem {
    id: string;
    created_at: string;
    activity_type: string;
    description: string;
    kind: NotificationKind;
}

export const classifyNotification = (activityType: string): NotificationKind => {
    const t = activityType.toLowerCase();

    if (["transaction", "deposit", "kasbon", "return", "distribution"].some((k) => t.includes(k))) {
        return "penjualan";
    }
    if (
        ["bonus", "insentif", "incentive", "fee", "potongan", "setoran", "handling"].some((k) =>
            t.includes(k),
        )
    ) {
        return "keuangan";
    }
    if (["karyawan", "sales"].some((k) => t.includes(k))) {
        return "karyawan_sales";
    }
    if (["product", "material"].some((k) => t.includes(k))) {
        return "produk";
    }
    if (["profile", "password"].some((k) => t.includes(k))) {
        return "sistem";
    }
    return "lainnya";
};

export const getRecentNotifications = async (limit = 30): Promise<{
    data: NotificationItem[] | null;
    error: any;
}> => {
    const { data, error } = await supabaseAdmin
        .from("activity_logs")
        .select("id, created_at, activity_type, description")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) return { data: null, error };

    const items: NotificationItem[] = (data ?? []).map((log: any) => ({
        id: log.id,
        created_at: log.created_at,
        activity_type: log.activity_type ?? "lainnya",
        description: log.description ?? "—",
        kind: classifyNotification(log.activity_type ?? ""),
    }));

    return { data: items, error: null };
};

export const subscribeToNewNotifications = (
    onInsert: (item: NotificationItem) => void,
) => {
    const channel = supabaseAdmin
        .channel("activity-logs-notifications")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "activity_logs" },
            (payload) => {
                const log = payload.new as any;
                onInsert({
                    id: log.id,
                    created_at: log.created_at,
                    activity_type: log.activity_type ?? "lainnya",
                    description: log.description ?? "—",
                    kind: classifyNotification(log.activity_type ?? ""),
                });
            },
        )
        .subscribe();

    return () => {
        supabaseAdmin.removeChannel(channel);
    };
};

const LAST_SEEN_KEY = "arroyyan99_notif_last_seen_at";

export const getLastSeenAt = (): string | null => {
    try {
        return localStorage.getItem(LAST_SEEN_KEY);
    } catch {
        return null;
    }
};

export const markNotificationsSeenNow = () => {
    try {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    } catch {
    }
};

export const countUnread = (items: NotificationItem[]): number => {
    const lastSeen = getLastSeenAt();
    if (!lastSeen) return items.length;
    const lastSeenTime = parseDbTimestamp(lastSeen).getTime();
    return items.filter((n) => parseDbTimestamp(n.created_at).getTime() > lastSeenTime).length;
};
