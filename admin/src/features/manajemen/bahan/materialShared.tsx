import {
  TrendingUp,
  TrendingDown,
  ArrowRightCircle,
  ArrowLeftCircle,
  Factory,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import {
  Material,
  MaterialMovement,
  MOVEMENT_TYPE_LABEL,
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
};

// Pergerakan yang mempengaruhi Stok Gudang
export const GUDANG_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "masuk",
  "stok_awal",
  "keluar",
  "ke_sementara",
  "kembali_gudang",
];

// Pergerakan yang mempengaruhi Stok Sementara
export const SEMENTARA_MOVEMENT_TYPES: MaterialMovement["movement_type"][] = [
  "ke_sementara",
  "kembali_gudang",
  "produksi",
  "stok_awal_sementara",
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
