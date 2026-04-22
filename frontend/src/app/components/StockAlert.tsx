import { AlertTriangle } from "lucide-react";

interface StockItem {
  product: string;
  current: number;
  minimum: number;
}

const lowStockItems: StockItem[] = [
  { product: "Arroyyan99 Cup Sedang", current: 50, minimum: 100 },
  { product: "Arroyyan99 Botol Kecil", current: 30, minimum: 80 },
  { product: "Arroyyan99 Cup Kecil", current: 45, minimum: 100 },
];

export function StockAlert() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Stok Kritis</h3>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {item.product}
              </p>
              <p className="text-xs text-gray-600">
                Minimum: {item.minimum} unit
              </p>
            </div>
            <span className="text-sm font-bold text-orange-600">
              {item.current} unit
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors cursor-pointer">
        Restok Sekarang
      </button>
    </div>
  );
}
