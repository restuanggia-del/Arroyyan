import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getLowStockItems, LowStockItem } from "../../services/reportService";

export function StockAlert() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStockItems(100).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Stok Kritis</h3>
        {!loading && items.length > 0 && (
          <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-green-700">Semua stok aman</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Min: {item.minimum} unit
                  </p>
                </div>
                <span className="text-sm font-bold text-orange-600 ml-3 flex-shrink-0">
                  {item.current} unit
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors cursor-pointer">
            Restok Sekarang
          </button>
        </>
      )}
    </div>
  );
}
