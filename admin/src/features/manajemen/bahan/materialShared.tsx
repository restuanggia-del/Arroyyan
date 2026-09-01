import {
  TrendingUp,
  TrendingDown,
  ArrowRightCircle,
  ArrowLeftCircle,
  Factory,
  ArrowRight,
  ClipboardList,
  Ban,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import {
  Material,
  MaterialMovement,
  MOVEMENT_TYPE_LABEL,
  MATERIAL_MINIMUM_STOCK,
} from "../../../services/materialService";
import { MaterialTxType } from "./MaterialTransactionModal";

export const formatDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const MOVEMENT_VISUAL: Record<
  MaterialMovement["movement_type"],
  { icon: React.ReactNode; bg: string; text: string; sign: "+" | "-" | "" }
> = {
  masuk: {
    icon: <TrendingUp className="w-5 h-5" />,
    bg: "bg-green-100",
    text: "text-green-600",
    sign: "+",
  },
  stok_awal: {
    icon: <ClipboardList className="w-5 h-5" />,
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    sign: "+",
  },
  keluar: {
    icon: <TrendingDown className="w-5 h-5" />,
    bg: "bg-red-100",
    text: "text-red-600",
    sign: "-",
  },
  ke_sementara: {
    icon: <ArrowRightCircle className="w-5 h-5" />,
    bg: "bg-blue-100",
    text: "text-blue-600",
    sign: "",
  },
  kembali_gudang: {
    icon: <ArrowLeftCircle className="w-5 h-5" />,
    bg: "bg-amber-100",
    text: "text-amber-600",
    sign: "",
  },
  produksi: {
    icon: <Factory className="w-5 h-5" />,
    bg: "bg-purple-100",
    text: "text-purple-600",
    sign: "-",
  },
  stok_awal_sementara: {
    icon: <ClipboardList className="w-5 h-5" />,
    bg: "bg-amber-100",
    text: "text-amber-600",
    sign: "+",
  },
  reject: {
    icon: <Ban className="w-5 h-5" />,
    bg: "bg-red-100",
    text: "text-red-600",
    sign: "-",
  },
};

export const GUDANG_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "masuk",
  "stok_awal",
  "keluar",
  "ke_sementara",
  "kembali_gudang",
];

export const SEMENTARA_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "ke_sementara",
  "kembali_gudang",
  "produksi",
  "stok_awal_sementara",
  "reject",
];

export interface TabProps {
  materials: Material[];
  movements: MaterialMovement[];
  loading: boolean;
  error: string | null;
  actionLoading: string | null;
  onAddMaterial: () => void;
  onEditMaterial: (m: Material) => void;
  onDeleteMaterial: (m: Material) => void;
  onToggleStatus: (m: Material) => void;
  onAddTransaction: (type: MaterialTxType) => void;
}

export type MaterialStockStatus = "aman" | "menipis" | "habis";

export const getMaterialStockStatus = (qty: number): MaterialStockStatus => {
  if (qty <= 0) return "habis";
  if (qty < MATERIAL_MINIMUM_STOCK) return "menipis";
  return "aman";
};

export function MaterialStockStatusBadge({
  status,
}: {
  status: MaterialStockStatus;
}) {
  if (status === "habis") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <PackageX className="w-3 h-3" />
        Habis
      </span>
    );
  }
  if (status === "menipis") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <AlertTriangle className="w-3 h-3" />
        Menipis
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Aman
    </span>
  );
}

export function MaterialCriticalStockBanner({
  title,
  materials,
  getQty,
  satuanLabel,
}: {
  title: string;
  materials: Material[];
  getQty: (m: Material) => number;
  satuanLabel: (m: Material) => string;
}) {
  const habisItems = materials.filter((m) => m.is_active && getQty(m) <= 0);
  const menipisItems = materials.filter(
    (m) => m.is_active && getQty(m) > 0 && getQty(m) < MATERIAL_MINIMUM_STOCK,
  );

  if (habisItems.length === 0 && menipisItems.length === 0) return null;

  return (
    <div className="clay-inset-red border-0 rounded-xl p-4 mb-6 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
        <p className="text-sm text-red-700">
          {habisItems.length > 0 && (
            <>
              {habisItems.length} bahan sudah <strong>habis</strong>
              {menipisItems.length > 0 ? ", dan " : "."}
            </>
          )}
          {menipisItems.length > 0 && (
            <>
              {menipisItems.length} bahan <strong>menipis</strong> (di bawah{" "}
              {MATERIAL_MINIMUM_STOCK} unit).
            </>
          )}
        </p>
        <ul className="mt-1 text-xs list-disc list-inside">
          {habisItems.map((m) => (
            <li key={m.id} className="text-red-700 font-medium">
              {m.nama_bahan} — HABIS (0 {satuanLabel(m)})
            </li>
          ))}
          {menipisItems.map((m) => (
            <li key={m.id} className="text-orange-600">
              {m.nama_bahan} — stok: {getQty(m)} {satuanLabel(m)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MovementList({
  movements,
  emptyText,
}: {
  movements: MaterialMovement[];
  emptyText: string;
}) {
  if (movements.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">{emptyText}</p>
    );
  }
  return (
    <div className="space-y-3">
      {movements.map((mov) => {
        const visual = MOVEMENT_VISUAL[mov.movement_type];
        return (
          <div
            key={mov.id}
            className="clay-raised-sm clay-pressable border-0 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${visual.bg} ${visual.text}`}
                >
                  {visual.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-0.5">
                    {mov.materials?.nama_bahan ?? "—"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                    <span>Bahan Baku</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{MOVEMENT_TYPE_LABEL[mov.movement_type]}</span>
                  </div>
                  {mov.note && (
                    <p className="text-xs text-gray-500 mt-1">{mov.note}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`text-lg font-bold ${visual.text}`}>
                  {visual.sign}
                  {mov.quantity} {mov.materials?.satuan ?? ""}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(mov.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
