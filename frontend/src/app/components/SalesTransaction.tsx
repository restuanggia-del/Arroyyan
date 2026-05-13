import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getActiveProducts, Product } from "../../services/productService";
import { getDistributorStock } from "../../services/stockService";
import { getAllCustomers, Customer } from "../../services/customerService";
import {
  createTransaction,
  TransactionItem,
} from "../../services/transactionService";

interface CartItem {
  product: Product;
  quantity: number;
  maxStock: number;
}

interface SalesTransactionProps {
  distributorId: string;
}

export function SalesTransaction({ distributorId }: SalesTransactionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [prodRes, stockRes, custRes] = await Promise.all([
      getActiveProducts(),
      getDistributorStock(distributorId),
      getAllCustomers(),
    ]);

    setProducts(prodRes.data ?? []);
    setCustomers(custRes.data ?? []);

    // Map product_id → stok distributor
    const map: Record<string, number> = {};
    for (const s of stockRes.data ?? []) {
      map[s.product_id] = s.stock_quantity;
    }
    setStockMap(map);
    setLoadingData(false);
  }, [distributorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      return [...prev, { product, quantity: 1, maxStock: max }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null as any;
          if (newQty > i.maxStock) return i;
          return { ...i, quantity: newQty };
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError("Keranjang masih kosong!");
      return;
    }
    setCheckoutError(null);
    setSaving(true);

    const items: TransactionItem[] = cart.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.product_name,
      quantity: i.quantity,
      price: i.product.price,
    }));

    const { data, error } = await createTransaction(
      distributorId,
      selectedCustomerId || null,
      items,
      paymentMethod,
    );

    if (error) {
      setCheckoutError((error as any).message ?? "Gagal memproses transaksi.");
      setSaving(false);
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    setLastTransaction({
      id: data.id.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleString("id-ID"),
      customer: customer?.customer_name ?? "Umum",
      phone: customer?.phone ?? "",
      items: cart,
      subtotal,
      total: subtotal,
      paymentMethod,
    });

    setSaving(false);
    setShowReceipt(true);
  };

  const handleNewTransaction = () => {
    setCart([]);
    setSelectedCustomerId("");
    setPaymentMethod("cash");
    setShowReceipt(false);
    setLastTransaction(null);
    setCheckoutError(null);
    loadData();
  };

  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Transaksi Penjualan
        </h1>
        <p className="text-gray-600">Point of Sales</p>
      </div>

      {loadingData ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data produk & stok...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Pilih Produk
              </h2>
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Belum ada produk aktif.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => {
                    const stock = stockMap[product.id] ?? 0;
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={stock === 0}
                        className={`border-2 rounded-xl p-4 text-left transition-all cursor-pointer ${
                          stock === 0
                            ? "border-gray-200 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight">
                            {product.product_name}
                            {product.size ? ` (${product.size})` : ""}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              stock > 50
                                ? "bg-green-100 text-green-700"
                                : stock > 0
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {stock} unit
                          </span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          {formatRp(product.price)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          per {product.unit}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Pelanggan
              </h2>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Pelanggan Umum (tanpa data)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name}
                    {c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Keranjang
                </h2>
                <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm font-medium">
                  {cart.length}
                </span>
              </div>

              {checkoutError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {checkoutError}
                </div>
              )}

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    Keranjang kosong
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="border border-gray-200 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1 leading-tight">
                          {item.product.product_name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(item.product.id, -1)}
                            className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, 1)}
                            className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatRp(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between mb-1 text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRp(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base mb-4">
                  <span>Total</span>
                  <span className="text-blue-600">{formatRp(subtotal)}</span>
                </div>

                <p className="text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(["cash", "transfer"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer text-sm font-medium ${
                        paymentMethod === method
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {method === "cash" ? (
                        <Banknote className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      {method === "cash" ? "Cash" : "Transfer"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving ? "Memproses..." : "Proses Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
              <h2 className="text-lg font-semibold text-gray-900">
                Struk Pembayaran
              </h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div id="receipt" className="p-6 font-mono text-sm">
              <div className="text-center mb-5">
                <h1 className="text-xl font-bold">ARROYYAN99</h1>
                <p className="text-xs text-gray-500">Air Minum Dalam Kemasan</p>
                <p className="text-xs text-gray-500">Tulang Bawang, Lampung</p>
              </div>

              <div className="border-t border-b border-gray-300 py-3 mb-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>No</span>
                  <span>#{lastTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span>{lastTransaction.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span>{lastTransaction.customer}</span>
                </div>
                {lastTransaction.phone && (
                  <div className="flex justify-between">
                    <span>Telepon</span>
                    <span>{lastTransaction.phone}</span>
                  </div>
                )}
              </div>

              <table className="w-full mb-3 text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Harga</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastTransaction.items.map((item: CartItem, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1">{item.product.product_name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">
                        {item.product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="text-right py-1">
                        {(item.product.price * item.quantity).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-gray-300 pt-3 mb-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRp(lastTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL</span>
                  <span>{formatRp(lastTransaction.total)}</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mb-4 text-xs">
                <div className="flex justify-between">
                  <span>Pembayaran</span>
                  <span className="font-semibold uppercase">
                    {lastTransaction.paymentMethod === "cash"
                      ? "TUNAI"
                      : "TRANSFER"}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>Terima kasih atas pembelian Anda!</p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={handleNewTransaction}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm cursor-pointer"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
