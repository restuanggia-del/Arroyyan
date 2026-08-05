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
  Building2,
  Truck,
} from "lucide-react";
import { getActiveProducts, Product } from "../../services/productService";
import {
  getCentralStock,
  getKaryawanStock,
} from "../../services/stockService";
import { getAllCustomers, Customer } from "../../services/customerService";
import {
  createTransaction,
  TransactionItem,
} from "../../services/transactionService";
import {
  getSystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  SystemSettingsData,
} from "../../services/systemSettingsService";

interface CartItem {
  product: Product;
  quantity: number;
  maxStock: number;
}

interface SalesTransactionProps {
  role: "admin" | "karyawan";
  karyawanId?: string;
}

const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function SalesTransaction({
  role,
  karyawanId,
}: SalesTransactionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings struk dari DB
  const [receiptSettings, setReceiptSettings] = useState<SystemSettingsData>(
    DEFAULT_SYSTEM_SETTINGS,
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [prodRes, custRes, stockRes, settingsRes] = await Promise.all([
      getActiveProducts(),
      getAllCustomers(),
      role === "admin"
        ? getCentralStock()
        : karyawanId
          ? getKaryawanStock(karyawanId)
          : Promise.resolve({ data: [] }),
      getSystemSettings(),
    ]);

    setProducts(prodRes.data ?? []);
    setCustomers(custRes.data ?? []);
    if (settingsRes.data) setReceiptSettings(settingsRes.data);

    const map: Record<string, number> = {};
    for (const s of (stockRes as any).data ?? []) {
      map[s.product_id] = s.stock_quantity;
    }
    setStockMap(map);
    setLoadingData(false);
  }, [role, karyawanId]);

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

    const txOptions =
      role === "admin"
        ? { mode: "admin" as const }
        : { mode: "karyawan" as const, karyawanId: karyawanId! };

    const { data, error } = await createTransaction(
      items,
      paymentMethod,
      selectedCustomerId || null,
      txOptions,
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
      sumber: role === "admin" ? "Penjualan Pabrik" : "Penjualan Karyawan",
      customer: customer?.customer_name ?? "Umum",
      phone: customer?.phone ?? "",
      items: [...cart],
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

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Transaksi Penjualan
        </h1>
        <p className="text-gray-600">
          Point of Sales — {receiptSettings.company_name}
        </p>
      </div>

      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border ${
          role === "admin"
            ? "bg-blue-50 border-blue-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        {role === "admin" ? (
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
        ) : (
          <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
        <div>
          <p
            className={`text-sm font-semibold ${role === "admin" ? "text-blue-800" : "text-green-800"}`}
          >
            {role === "admin"
              ? "Mode Penjualan Pabrik"
              : "Mode Penjualan Karyawan"}
          </p>
          <p
            className={`text-xs ${role === "admin" ? "text-blue-600" : "text-green-600"}`}
          >
            {role === "admin"
              ? "Stok yang berkurang: stok pusat"
              : "Stok yang berkurang: stok karyawan Anda"}
          </p>
        </div>
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
                <p className="text-sm text-gray-500">Belum ada produk aktif.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => {
                    const stock = stockMap[product.id] ?? 0;
                    const inCart = cart.find(
                      (i) => i.product.id === product.id,
                    );
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={stock === 0}
                        className={`border-2 rounded-xl p-4 text-left transition-all relative ${
                          stock === 0
                            ? "border-gray-200 opacity-50 cursor-not-allowed bg-gray-50"
                            : inCart
                              ? "border-blue-500 bg-blue-50 cursor-pointer"
                              : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                        }`}
                      >
                        {inCart && (
                          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {inCart.quantity}
                          </span>
                        )}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">
                            {product.category === "cup" ? "🥤" : "🍶"}
                          </span>
                          <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                            {product.product_name}
                            {product.size ? ` (${product.size})` : ""}
                          </h3>
                        </div>
                        <p className="text-base font-bold text-blue-600 mb-1.5">
                          {formatRp(product.price)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            stock > 50
                              ? "bg-green-100 text-green-700"
                              : stock > 0
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          Stok: {stock} {product.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
                    {c.is_subscribed ? " ⭐" : ""}
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
                  {cart.reduce((s, i) => s + i.quantity, 0)} item
                </span>
              </div>

              {checkoutError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">
                    Klik produk untuk menambahkan
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
                          {item.product.size ? ` (${item.product.size})` : ""}
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
                          {formatRp(item.product.price * item.quantity)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Maks: {item.maxStock} unit
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRp(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600 text-lg">
                    {formatRp(subtotal)}
                  </span>
                </div>
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
                <h1 className="text-xl font-bold">
                  {receiptSettings.company_name}
                </h1>
                {receiptSettings.receipt_header && (
                  <p className="text-xs text-gray-500">
                    {receiptSettings.receipt_header}
                  </p>
                )}
                {receiptSettings.company_address && (
                  <p className="text-xs text-gray-500">
                    {receiptSettings.company_address}
                  </p>
                )}
                {receiptSettings.phone && (
                  <p className="text-xs text-gray-500">
                    Telp: {receiptSettings.phone}
                  </p>
                )}
                {receiptSettings.email && (
                  <p className="text-xs text-gray-500">
                    {receiptSettings.email}
                  </p>
                )}
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
                  <span>Sumber</span>
                  <span>{lastTransaction.sumber}</span>
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
                      <td className="py-1 leading-tight">
                        {item.product.product_name}
                        {item.product.size ? ` (${item.product.size})` : ""}
                      </td>
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
                  <span className="font-bold uppercase">
                    {lastTransaction.paymentMethod === "cash"
                      ? "TUNAI"
                      : "TRANSFER"}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 whitespace-pre-line">
                {receiptSettings.receipt_footer}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={handleNewTransaction}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
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
