export const today = () => new Date().toISOString().slice(0, 10);

export const firstOfMonth = () => today().slice(0, 8) + "01";

export const currentPeriode = () => new Date().toISOString().slice(0, 7);

export const formatDate = (d: string | Date) => {
    try {
        const date = typeof d === "string" ? new Date(d) : d;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(d);
    }
};

export const formatTanggalPanjang = (iso: string) => {
    try {
        return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    } catch {
        return iso;
    }
};

export const formatWaktuCetak = () => new Date().toLocaleString("id-ID");
