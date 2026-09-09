export type PanelRole = "admin" | "admin_gudang" | "admin_produk";

export const ROLE_ALLOWED_MENUS: Record<PanelRole, string[] | "all"> = {
    admin: "all",

    admin_gudang: [
        "dashboard",
        "bahan",
        "handling-fee",
        "stok",
        "laporan-bahan",
        "laporan-handling-fee",
        "laporan-stok",
    ],

    admin_produk: [
        "dashboard",
        "stok",
        "insentif",
        "laporan-insentif",
        "laporan-stok",
    ],
};

export const ROLE_LABELS: Record<PanelRole, string> = {
    admin: "Admin",
    admin_gudang: "Admin Gudang",
    admin_produk: "Admin Produk",
};

export const DEFAULT_MENU = "dashboard";

export const isMenuAllowedForRole = (
    role: string | undefined | null,
    menuId: string,
): boolean => {
    if (!role) return false;
    const allowed = ROLE_ALLOWED_MENUS[role as PanelRole];
    if (!allowed) return false;
    if (allowed === "all") return true;
    return allowed.includes(menuId);
};

export const getRoleLabel = (role: string | undefined | null): string => {
    if (!role) return "User";
    return ROLE_LABELS[role as PanelRole] ?? "User";
};
