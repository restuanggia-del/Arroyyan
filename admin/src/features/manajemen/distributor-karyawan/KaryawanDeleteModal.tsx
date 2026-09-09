import { Trash2 } from "lucide-react";
import { Karyawan } from "../../../services/karyawanService";

interface KaryawanDeleteModalProps {
  karyawan: Karyawan;
  onCancel: () => void;
  onConfirm: () => void;
}

export function KaryawanDeleteModal({
  karyawan,
  onCancel,
  onConfirm,
}: KaryawanDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Hapus Karyawan?
        </h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          "{karyawan.nama}" akan dihapus beserta seluruh data perannya. Aksi ini
          tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm text-gray-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 clay-red clay-pressable text-white rounded-xl text-sm font-medium cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
