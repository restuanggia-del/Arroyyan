import { useState } from "react";
import { Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import { ProductModal } from "./ProductModal";

export interface Product {
  id: string;
  nama: string;
  kategori: "Cup" | "Botol";
  harga: number;
  satuan: string;
  foto?: string;
  status: "aktif" | "nonaktif";
}

const initialProducts: Product[] = [
  {
    id: "1",
    nama: "Arroyyan99 Cup Kecil",
    kategori: "Cup",
    harga: 3000,
    satuan: "pcs",
    status: "aktif",
  },
  {
    id: "2",
    nama: "Arroyyan99 Cup Sedang",
    kategori: "Cup",
    harga: 5000,
    satuan: "pcs",
    status: "aktif",
  },
  {
    id: "3",
    nama: "Arroyyan99 Botol Kecil",
    kategori: "Botol",
    harga: 4000,
    satuan: "pcs",
    status: "aktif",
  },
  {
    id: "4",
    nama: "Arroyyan99 Botol Sedang",
    kategori: "Botol",
    harga: 6000,
    satuan: "pcs",
    status: "nonaktif",
  },
];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState<"all" | "Cup" | "Botol">(
    "all",
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts([...products, { ...product, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setProducts(
      products.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "aktif" ? "nonaktif" : "aktif" }
          : p,
      ),
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesKategori =
      filterKategori === "all" || product.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Manajemen Produk
        </h1>
        <p className="text-gray-600">
          Kelola produk air minum dalam kemasan Arroyyan99
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterKategori}
                onChange={(e) =>
                  setFilterKategori(e.target.value as "all" | "Cup" | "Botol")
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="Cup">Cup</option>
                <option value="Botol">Botol</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Foto
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Nama Produk
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Kategori
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Harga
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Satuan
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                      {product.foto ? (
                        <img
                          src={product.foto}
                          alt={product.nama}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-xs">
                          {product.kategori === "Cup" ? "🥤" : "🍶"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      {product.nama}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.kategori === "Cup"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {product.kategori}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">
                      Rp {product.harga.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {product.satuan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.status === "aktif"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {product.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </p>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
