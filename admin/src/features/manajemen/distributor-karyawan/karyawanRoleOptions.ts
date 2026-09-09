import { KaryawanRole } from "../../../services/karyawanService";

export const ROLE_OPTIONS: { value: KaryawanRole; label: string }[] = [
    { value: "produksi", label: "Produksi" },
    { value: "handling", label: "Handling" },
    { value: "jual_antar", label: "Jual/Antar" },
    { value: "qc", label: "QC (Quality Control)" },
    { value: "admin", label: "Admin" },
];

export const roleLabel = (r: KaryawanRole) =>
    ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;
