import { Product } from "../../../services/productService";
import { ProductTableRow } from "../produk/ProductTableRow";

interface ProductTableProps {
  products: Product[];
  actionLoadingId: string | null;
  onToggleStatus: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const COLUMNS = [
  "Foto",
  "Nama Produk",
  "Kategori",
  "Ukuran",
  "Harga",
  "Satuan",
  "Status",
  "Aksi",
];

export function ProductTable({
  products,
  actionLoadingId,
  onToggleStatus,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(140,172,214,0.35)]">
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              actionLoading={actionLoadingId === product.id}
              onToggleStatus={() => onToggleStatus(product)}
              onEdit={() => onEdit(product)}
              onDelete={() => onDelete(product)}
            />
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada produk ditemukan</p>
        </div>
      )}
    </div>
  );
}
