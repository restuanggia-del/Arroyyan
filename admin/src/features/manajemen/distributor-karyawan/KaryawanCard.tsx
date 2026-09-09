import {
  Phone,
  MapPin,
  RefreshCw,
  Trash2,
  Pencil,
  Star,
  Power,
} from "lucide-react";
import { Karyawan } from "../../../services/karyawanService";
import { roleLabel } from "../distributor-karyawan/karyawanRoleOptions";

interface KaryawanCardProps {
  karyawan: Karyawan;
  actionLoading: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function KaryawanCard({
  karyawan: k,
  actionLoading,
  onToggleActive,
  onEdit,
  onDelete,
}: KaryawanCardProps) {
  return (
    <div
      className={`border rounded-xl p-5 transition-all ${
        !k.is_active
          ? "border-[rgba(140,172,214,0.35)] bg-[rgba(215,233,255,0.4)]"
          : "border-[rgba(140,172,214,0.35)] bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
              k.is_active ? "clay-blue text-white" : "bg-gray-300 text-white"
            }`}
          >
            {k.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900">{k.nama}</h3>
              {k.bonus_khusus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Star className="w-3 h-3" /> Bonus Khusus
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  k.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {k.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(k.karyawan_roles ?? []).map((r) => (
                <span
                  key={r.role}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"
                >
                  {roleLabel(r.role)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600">
              {k.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{k.phone}</span>
                </div>
              )}
              {k.address && (
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{k.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actionLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
            </div>
          ) : (
            <>
              <button
                onClick={onToggleActive}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  k.is_active
                    ? "bg-orange-100 hover:bg-orange-200 text-orange-700"
                    : "bg-green-100 hover:bg-green-200 text-green-700"
                }`}
              >
                <Power className="w-4 h-4" />
                {k.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
