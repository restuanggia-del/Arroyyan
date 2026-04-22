import { TrendingUp } from 'lucide-react';

interface Product {
  name: string;
  category: string;
  sales: number;
  percentage: number;
}

const topProducts: Product[] = [
  { name: 'Arroyyan99 Cup Sedang', category: 'Cup', sales: 2500, percentage: 35 },
  { name: 'Arroyyan99 Botol Kecil', category: 'Botol', sales: 2100, percentage: 29 },
  { name: 'Arroyyan99 Cup Kecil', category: 'Cup', sales: 1800, percentage: 25 },
  { name: 'Arroyyan99 Botol Sedang', category: 'Botol', sales: 800, percentage: 11 },
];

export function TopProducts() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Produk Terlaris</h3>
      </div>

      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{product.name}</span>
                <span className="text-sm text-gray-600">{product.sales} unit</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                  style={{ width: `${product.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
