const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

export const parseDbDate = (value: string | Date): Date => {
    if (value instanceof Date) return value;
    const s = value.trim();

    if (DATE_ONLY.test(s)) return new Date(`${s}T00:00:00`);

    let iso = s.replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");

    if (!HAS_ZONE.test(iso)) iso += "Z";
    return new Date(iso);
};

const pad = (n: number) => String(n).padStart(2, "0");

export const localDateString = (d: Date = new Date()): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const localPeriodeString = (d: Date = new Date()): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const localDayRangeUtc = (dateStr: string) => {
    const toDb = (d: Date) => d.toISOString().slice(0, 23);
    return {
        start: toDb(new Date(`${dateStr}T00:00:00`)),
        end: toDb(new Date(`${dateStr}T23:59:59.999`)),
    };
};
