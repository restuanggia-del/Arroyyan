import { Edit2, Trash2, RefreshCw } from "lucide-react";
import { Product } from "../../../services/productService";
import {
  formatRupiah,
  getCategoryLabel,
  getCategoryEmoji,
  getCategoryBadgeClass,
} from "./productCategoryHelpers";

interface ProductTableRowProps {
  product: Product;
  actionLoading: boolean;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductTableRow({
  product,
  actionLoading,
  onToggleStatus,
  onEdit,
  onDelete,
}: ProductTableRowProps) {
  return (
    <tr className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]">
      <td className="py-3 px-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center overflow-hidden">
          {product.photo_url ? (
            <img
              src={product.photo_url}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg">
              {getCategoryEmoji(product.category)}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium text-gray-900">
          {product.product_name}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(product.category)}`}
        >
          {getCategoryLabel(product.category)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">{product.size ?? "-"}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-900">
          {formatRupiah(product.price)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">{product.unit}</span>
      </td>
      <td className="py-3 px-4">
        {actionLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <button
            onClick={onToggleStatus}
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              product.is_active
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-[rgba(215,233,255,0.55)] text-gray-700 hover:bg-gray-200"
            }`}
          >
            {product.is_active ? "Aktif" : "Nonaktif"}
          </button>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
