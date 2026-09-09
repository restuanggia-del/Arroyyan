export type ProductCategory = "cup" | "botol" | "galon";

export const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export const getCategoryLabel = (category: ProductCategory): string => {
    switch (category) {
        case "cup":
            return "Cup";
        case "galon":
            return "Galon";
        case "botol":
        default:
            return "Botol";
    }
};

export const getCategoryEmoji = (category: ProductCategory): string => {
    switch (category) {
        case "cup":
            return "🥤";
        case "galon":
            return "🚰";
        case "botol":
        default:
            return "🍶";
    }
};

export const getCategoryBadgeClass = (category: ProductCategory): string => {
    switch (category) {
        case "cup":
            return "bg-blue-100 text-blue-700";
        case "galon":
            return "bg-cyan-100 text-cyan-700";
        case "botol":
        default:
            return "bg-purple-100 text-purple-700";
    }
};
