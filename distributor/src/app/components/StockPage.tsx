import { useEffect, useState, useCallback } from "react";
import {
  Package,
  RefreshCw,
  AlertCircle,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import {
  getProductsWithSalesStock,
  getStockMovements,
  SalesProduct,
} from "../services/SalesAppService";

interface StockPageProps {
  salesId: string;
}

type MovementRow = Awaited<ReturnType<typeof getStockMovements>>[number];

export default function StockPage({ salesId }: StockPageProps) {
  const [tab, setTab] = useState<"stok" | "riwayat">("stok");
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prodData, movData] = await Promise.all([
        getProductsWithSalesStock(salesId),
        getStockMovements(salesId),
      ]);
      setProducts(prodData);
      setMovements(movData);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data stok.");
    } finally {
      setLoading(false);
    }
  }, [salesId]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("stok")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "stok"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Stok Saya
        </button>
        <button
          onClick={() => setTab("riwayat")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "riwayat"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Riwayat Mutasi
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-gray-300 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      ) : tab === "stok" ? (
        products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              Belum ada stok. Tunggu distribusi dari pabrik.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {p.name}
                    {p.size ? ` (${p.size})` : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.category === "cup" ? "🥤 Cup" : "🍶 Botol"}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                    p.stock > p.minStock
                      ? "bg-green-100 text-green-700"
                      : p.stock > 0
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.stock} {p.unit}
                </span>
              </div>
            ))}
          </div>
        )
      ) : movements.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Belum ada riwayat mutasi stok.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {movements.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3"
            >
              {m.type === "in" ? (
                <ArrowDownCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <ArrowUpCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {m.productName}
                </p>
                <p className="text-xs text-gray-400">
                  {m.note} · {formatDate(m.date)}
                </p>
              </div>
              <span
                className={`text-sm font-bold ${m.type === "in" ? "text-green-600" : "text-red-600"}`}
              >
                {m.type === "in" ? "+" : "-"}
                {m.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
