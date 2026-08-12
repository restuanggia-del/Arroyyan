import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, Plus, Minus, Trash2 } from "lucide-react";
import { getActiveProducts, Product } from "../../../services/productService";
import { getAllCustomers, Customer } from "../../../services/customerService";
import { getActiveSales, Sales } from "../../../services/salesService";
import { getSalesStock } from "../../../services/stockService";
import {
  getAllActiveProductPrices,
  ProductPrice,
} from "../../../services/productPriceService";
import { createKasbonTransaction } from "../../../services/kasbonService";
import { TransactionItem } from "../../../services/transactionService";

interface KasbonTransactionModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  maxStock: number;
  unitPrice: number;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function KasbonTransactionModal({
  onClose,
  onSaveSuccess,
}: KasbonTransactionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [priceOptionsMap, setPriceOptionsMap] = useState<
    Record<string, ProductPrice[]>
  >({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      const [prodRes, custRes, salesRes, priceRes] = await Promise.all([
        getActiveProducts(),
        getAllCustomers(),
        getActiveSales(),
        getAllActiveProductPrices(),
      ]);
      setProducts(prodRes.data ?? []);
      setCustomers(custRes.data ?? []);
      setSalesList(salesRes.data ?? []);

      const pMap: Record<string, ProductPrice[]> = {};
      for (const p of priceRes.data ?? []) {
        (pMap[p.product_id] ??= []).push(p);
      }
      setPriceOptionsMap(pMap);
      setLoadingData(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!salesId) {
      setStockMap({});
      setCart([]);
      return;
    }
    const loadStock = async () => {
      setLoadingStock(true);
      const { data } = await getSalesStock(salesId);
      const map: Record<string, number> = {};
      for (const s of data ?? []) map[s.product_id] = s.stock_quantity;
      setStockMap(map);
      setCart([]);
      setLoadingStock(false);
    };
    loadStock();
  }, [salesId]);

  const addToCart = (product: Product) => {
    const max = stockMap[product.id] ?? 0;
    if (max === 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= max) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { product, quantity: 1, maxStock: max, unitPrice: product.price },
      ];
    });
    setFormError(null);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity: Math.max(1, Math.min(i.maxStock, i.quantity + delta)),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, unitPrice: Math.max(0, newPrice) }
          : i,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const totalDus = cart.reduce((s, i) => s + i.quantity, 0);
  const totalRp = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const estimasiKomisi = cart.reduce(
    (s, i) => s + (i.unitPrice - i.product.price) * i.quantity,
    0,
  );

  const handleSubmit = async () => {
    setFormError(null);

    if (!customerId) {
      setFormError("Pilih toko tujuan titipan terlebih dahulu.");
      return;
    }
    if (!salesId) {
      setFormError("Pilih sales penanggung jawab terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      setFormError("Tambahkan minimal 1 produk ke titipan.");
      return;
    }

    setSaving(true);

    const items: TransactionItem[] = cart.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.product_name,
      quantity: i.quantity,
      price: i.unitPrice,
    }));

    const { error } = await createKasbonTransaction(items, customerId, {
      mode: "sales",
      salesId,
    });

    if (error) {
      setFormError("Gagal menyimpan titipan: " + (error as any).message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            Buat Titipan Baru
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {loadingData ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Toko Tujuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Toko / Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name}
                        {c.phone ? ` — ${c.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sales Penanggung Jawab{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={salesId}
                    onChange={(e) => setSalesId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Sales --</option>
                    {salesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_sales}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Stok titipan diambil dari stok sales ini.
                  </p>
                </div>
              </div>

              {!salesId ? (
                <p className="text-sm text-gray-400 text-center py-10 border border-dashed border-gray-200 rounded-xl">
                  Pilih sales terlebih dahulu untuk melihat produk & stok yang
                  tersedia.
                </p>
              ) : loadingStock ? (
                <div className="py-10 text-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Memuat stok sales...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Pilih Produk
                    </h3>
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {products.map((product) => {
                        const stock = stockMap[product.id] ?? 0;
                        const disabled = stock === 0;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={disabled}
                            className={`text-left border rounded-xl p-3 transition-colors ${
                              disabled
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900 leading-tight mb-1">
                              {product.product_name}
                              {product.size ? ` (${product.size})` : ""}
                            </p>
                            <p className="text-sm font-bold text-blue-600">
                              {formatRp(product.price)}
                              <span className="ml-1.5 align-middle text-[10px] font-medium text-gray-400">
                                harga pabrik
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Stok: {stock}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Keranjang Titipan
                    </h3>
                    {cart.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-10 border border-dashed border-gray-200 rounded-xl">
                        Belum ada produk dipilih
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div
                            key={item.product.id}
                            className="border border-gray-200 rounded-xl p-3"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 flex-1 leading-tight">
                                {item.product.product_name}
                                {item.product.size
                                  ? ` (${item.product.size})`
                                  : ""}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updatePrice(
                                      item.product.id,
                                      e.target.value === ""
                                        ? 0
                                        : Number(e.target.value),
                                    )
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {(priceOptionsMap[item.product.id]?.length ?? 0) >
                                0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value)
                                      updatePrice(
                                        item.product.id,
                                        Number(e.target.value),
                                      );
                                  }}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-blue-50/50"
                                >
                                  <option value="">Pilih...</option>
                                  <option value={item.product.price}>
                                    {formatRp(item.product.price)} (Dasar)
                                  </option>
                                  {priceOptionsMap[item.product.id].map((p) => (
                                    <option key={p.id} value={p.price}>
                                      {formatRp(p.price)}
                                      {p.label ? ` (${p.label})` : ""}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateQty(item.product.id, -1)}
                                  className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQty(item.product.id, 1)}
                                  className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {formatRp(item.unitPrice * item.quantity)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Maks: {item.maxStock} unit
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">
                Total {totalDus} unit titipan
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatRp(totalRp)}
              </p>
              {estimasiKomisi !== 0 && (
                <p
                  className={`text-xs font-medium mt-0.5 ${estimasiKomisi > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  Estimasi komisi sales: {estimasiKomisi > 0 ? "+" : ""}
                  {formatRp(estimasiKomisi)} (cair setelah toko lunas)
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || cart.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Titipan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
