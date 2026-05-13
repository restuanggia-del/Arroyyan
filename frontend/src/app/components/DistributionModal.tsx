import { useState, useEffect } from "react";
import {
  X,
  Truck,
  Package,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  getAllDistributors,
  DistributorWithUser,
} from "../../services/distributorService";
import { getActiveProducts, Product } from "../../services/productService";
import { getCentralStock } from "../../services/stockService";
import {
  createDistribution,
  DistributionItem,
} from "../../services/distributionService";

interface DistributionModalProps {
  currentUserId: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface ItemRow {
  product_id: string;
  quantity: number;
}

export function DistributionModal({
  currentUserId,
  onClose,
  onSaveSuccess,
}: DistributionModalProps) {
  const [distributors, setDistributors] = useState<DistributorWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [centralStockMap, setCentralStockMap] = useState<
    Record<string, number>
  >({});
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [distributorId, setDistributorId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    { product_id: "", quantity: 1 },
  ]);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      const [distRes, prodRes, stockRes] = await Promise.all([
        getAllDistributors(),
        getActiveProducts(),
        getCentralStock(),
      ]);

      setDistributors((distRes.data ?? []).filter((d) => d.users.is_approved));
      setProducts(prodRes.data ?? []);

      const map: Record<string, number> = {};
      for (const s of stockRes.data ?? []) {
        map[s.product_id] = s.stock_quantity;
      }
      setCentralStockMap(map);
      setLoadingData(false);
    };
    load();
  }, []);

  const addItem = () =>
    setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof ItemRow,
    value: string | number,
  ) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  const availableProducts = (currentIdx: number) =>
    products.filter(
      (p) =>
        !items.some((item, i) => i !== currentIdx && item.product_id === p.id),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!distributorId) {
      setFormError("Pilih distributor terlebih dahulu.");
      return;
    }

    const validItems = items.filter(
      (item) => item.product_id && item.quantity > 0,
    );
    if (validItems.length === 0) {
      setFormError("Tambahkan minimal 1 produk.");
      return;
    }

    for (const item of validItems) {
      const available = centralStockMap[item.product_id] ?? 0;
      if (item.quantity > available) {
        const prod = products.find((p) => p.id === item.product_id);
        setFormError(
          `Stok pusat tidak mencukupi untuk ${prod?.product_name ?? "produk"}. Tersedia: ${available} unit.`,
        );
        return;
      }
    }

    setSaving(true);

    const distributionItems: DistributionItem[] = validItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product_name: products.find((p) => p.id === item.product_id)
        ?.product_name,
    }));

    const { error } = await createDistribution(
      distributorId,
      currentUserId,
      distributionItems,
    );

    if (error) {
      setFormError((error as any).message ?? "Gagal membuat distribusi.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  const totalItems = items.filter((i) => i.product_id && i.quantity > 0);
  const totalQty = totalItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Buat Distribusi Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loadingData ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Stok pusat akan otomatis berkurang dan stok distributor akan
                bertambah setelah distribusi dibuat.
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tujuan Distributor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={distributorId}
                onChange={(e) => {
                  setDistributorId(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Pilih Distributor --</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.distributor_name}
                    {d.address ? ` — ${d.address}` : ""}
                  </option>
                ))}
              </select>
              {distributors.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Belum ada distributor yang disetujui.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Produk yang Dikirim <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Produk
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const selected = products.find(
                    (p) => p.id === item.product_id,
                  );
                  const available = item.product_id
                    ? (centralStockMap[item.product_id] ?? 0)
                    : null;
                  const isOverStock =
                    available !== null && item.quantity > available;

                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) =>
                              updateItem(idx, "product_id", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                          >
                            <option value="">-- Pilih Produk --</option>
                            {availableProducts(idx).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.product_name}
                                {p.size ? ` (${p.size})` : ""}
                              </option>
                            ))}
                          </select>
                          {available !== null && (
                            <p
                              className={`text-xs mt-1 ${isOverStock ? "text-red-600" : "text-gray-500"}`}
                            >
                              Stok pusat tersedia: {available} unit
                            </p>
                          )}
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            required
                            min="1"
                            max={available ?? undefined}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isOverStock
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300"
                            }`}
                            placeholder="Jumlah"
                          />
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer mt-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {totalItems.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Ringkasan Pengiriman
                </p>
                <div className="space-y-1">
                  {totalItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.product_id);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>{prod?.product_name ?? "—"}</span>
                        <span className="font-medium">
                          {item.quantity} unit
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{totalQty} unit</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || loadingData}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                {saving ? "Memproses..." : "Buat Distribusi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
