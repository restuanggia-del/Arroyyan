import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
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
    <div className="clay-raised rounded-3xl p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-[#e08e0a]" />
        <h3 className="text-lg font-bold text-[#10193a]">Stok Kritis</h3>
        {!loading && items.length > 0 && (
          <span className="ml-auto clay-amber text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 clay-inset-sm animate-pulse rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 clay-green rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-[#159650]">
            Semua stok aman
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between p-3 clay-inset-amber rounded-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-[#10193a] leading-tight">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-[#5b6a8f] mt-0.5">
                    Min: {item.minimum} unit
                  </p>
                </div>
                <span className="text-sm font-bold text-[#e08e0a] ml-3 flex-shrink-0">
                  {item.current} unit
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2.5 clay-amber clay-pressable text-white text-sm font-semibold rounded-xl cursor-pointer">
            Restok Sekarang
          </button>
        </>
      )}
    </div>
  );
}
