import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, RefreshCw, AlertCircle } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { ProductTable } from "../produk/ProductTable";
import { ProductDeleteModal } from "../produk/ProductDeleteModal";
import {
  Product,
  getProducts,
  toggleProductStatus,
  deleteProduct,
} from "../../../services/productService";

export type { Product };

type CategoryFilter = "all" | "cup" | "botol" | "galon";

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState<CategoryFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getProducts();
    if (error) {
      setError("Gagal memuat produk. Coba refresh halaman.");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    fetchProducts();
  };

  const handleToggleStatus = async (product: Product) => {
    setActionLoading(product.id);
    const { error } = await toggleProductStatus(product.id, !product.is_active);
    if (error) {
      alert("Gagal mengubah status: " + error.message);
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !product.is_active } : p,
        ),
      );
    }
    setActionLoading(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    setConfirmDelete(null);
    const { error } = await deleteProduct(confirmDelete.id, confirmDelete.name);
    if (error) {
      alert("Gagal menghapus produk: " + error.message);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
    }
    setActionLoading(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesKategori =
      filterKategori === "all" || product.category === filterKategori;
    return matchesSearch && matchesKategori;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Produk
          </h1>
          <p className="text-gray-600">
            Kelola produk air minum dalam kemasan Arroyyan99
          </p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="clay-raised rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterKategori}
                onChange={(e) =>
                  setFilterKategori(e.target.value as CategoryFilter)
                }
                className="px-4 py-2 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="cup">Cup</option>
                <option value="botol">Botol</option>
                <option value="galon">Galon</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddProduct}
            className="clay-blue clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Memuat data produk...</p>
          </div>
        ) : (
          <>
            <ProductTable
              products={filteredProducts}
              actionLoadingId={actionLoading}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditProduct}
              onDelete={(product) =>
                setConfirmDelete({ id: product.id, name: product.product_name })
              }
            />

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Menampilkan {filteredProducts.length} dari {products.length}{" "}
                produk
              </p>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {confirmDelete && (
        <ProductDeleteModal
          productName={confirmDelete.name}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
