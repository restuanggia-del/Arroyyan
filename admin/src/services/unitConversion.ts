export const isDusUnit = (unit: string | null | undefined): boolean =>
    (unit || "").trim().toLowerCase() === "dus";

export const toDusQuantity = (
    quantity: number,
    unit: string | null | undefined,
    isiPerDus: number | null | undefined,
): number => {
    if (isDusUnit(unit)) return quantity;
    const isi = isiPerDus || 0;
    return isi > 0 ? quantity / isi : 0;
};

export const estimasiRpFromDus = (
    dus: number,
    unit: string | null | undefined,
    isiPerDus: number | null | undefined,
    price: number | null | undefined,
): number => {
    const hargaPerDus = isDusUnit(unit)
        ? price || 0
        : (isiPerDus || 0) * (price || 0);
    return dus * hargaPerDus;
};
