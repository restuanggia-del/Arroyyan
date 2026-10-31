export const todayLocal = (): string => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export const formatTanggalPanjang = (date: string): string => {
    const d = new Date(`${date}T00:00:00`);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

export const movementDateField = (
    tanggal?: string | null,
): { created_at?: string } => {
    if (!tanggal || tanggal === todayLocal()) return {};
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const d = new Date(`${tanggal}T${hh}:${mm}:${ss}`);
    if (isNaN(d.getTime())) return {};
    return { created_at: d.toISOString() };
};
