import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { getTopProducts, TopProduct } from "../../services/reportService";

export function TopProducts() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopProducts(4).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const formatRp = (n: number) => {
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
    return `Rp ${n}`;
  };

  return (
    <div className="clay-raised rounded-3xl p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#0249E1]" />
        <h3 className="text-lg font-bold text-[#10193a]">Produk Terlaris</h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 clay-inset-sm animate-pulse rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 clay-inset-sm animate-pulse rounded-lg w-3/4" />
                <div className="h-2 clay-inset-sm animate-pulse rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-10 text-center">
          <TrendingUp className="w-10 h-10 text-[#b9d9fc] mx-auto mb-2" />
          <p className="text-sm text-[#5b6a8f]">Belum ada data transaksi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.product_id} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 clay-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#10193a] truncate">
                    {product.product_name}
                  </span>
                  <span className="text-sm text-[#5b6a8f] ml-2 flex-shrink-0">
                    {product.totalSold} unit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 clay-inset-sm rounded-full h-2">
                    <div
                      className="clay-fill h-2 rounded-full transition-all"
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#8fa4d4] flex-shrink-0">
                    {formatRp(product.revenue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
