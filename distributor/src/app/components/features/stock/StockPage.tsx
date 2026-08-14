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
} from "../../../services";

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
      <div className="flex gap-1 mb-4 bg-[#F4F7FE] rounded-xl p-1">
        <button
          onClick={() => setTab("stok")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "stok"
              ? "bg-white text-[#0249E1] shadow-sm"
              : "text-[#111111]/45"
          }`}
        >
          Stok Saya
        </button>
        <button
          onClick={() => setTab("riwayat")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            tab === "riwayat"
              ? "bg-white text-[#0249E1] shadow-sm"
              : "text-[#111111]/45"
          }`}
        >
          Riwayat Mutasi
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
          <p className="text-sm text-[#111111]/35">Memuat...</p>
        </div>
      ) : tab === "stok" ? (
        products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
            <p className="text-sm text-[#111111]/35">
              Belum ada stok. Tunggu distribusi dari pabrik.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-black/5 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    {p.name}
                    {p.size ? ` (${p.size})` : ""}
                  </p>
                  <p className="text-xs text-[#111111]/35">
                    {p.category === "cup" ? "🥤 Cup" : "🍶 Botol"}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                    p.stock > p.minStock
                      ? "bg-[#DAFB71]/25 text-[#0249E1]"
                      : p.stock > 0
                        ? "bg-[#EE3D5A]/12 text-[#EE3D5A]"
                        : "bg-[#EE3D5A]/15 text-[#EE3D5A]"
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
          <History className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
          <p className="text-sm text-[#111111]/35">
            Belum ada riwayat mutasi stok.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {movements.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-black/5 rounded-xl p-3 flex items-center gap-3"
            >
              {m.type === "in" ? (
                <ArrowDownCircle className="w-5 h-5 text-[#0249E1] flex-shrink-0" />
              ) : (
                <ArrowUpCircle className="w-5 h-5 text-[#EE3D5A] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">
                  {m.productName}
                </p>
                <p className="text-xs text-[#111111]/35">
                  {m.note} · {formatDate(m.date)}
                </p>
              </div>
              <span
                className={`text-sm font-bold ${m.type === "in" ? "text-[#0249E1]" : "text-[#EE3D5A]"}`}
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
