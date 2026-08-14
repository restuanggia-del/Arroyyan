import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Wallet,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  X,
  Search,
  UserPlus,
  History,
} from "lucide-react";
import {
  getProductsWithSalesStock,
  createSalesTransaction,
  SalesProduct,
  TxItemInput,
} from "../../../services";
import ReceiptDialog from "./ReceiptDialog";
import CustomerPage from "../customer/CustomerPage";

interface TransactionPageProps {
  salesId: string;
  /** Optional: lets this page hand off to other tabs, e.g. jumping to
   *  "history" after a successful checkout or via the header shortcut. */
  onNavigate?: (tab: string) => void;
}

interface CartItem {
  product: SalesProduct;
  quantity: number;
  hargaJual: number;
}

interface SelectedCustomer {
  id: string;
  name: string;
  phone: string;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function TransactionPage({
  salesId,
  onNavigate,
}: TransactionPageProps) {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "kasbon"
  >("cash");
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const prodData = await getProductsWithSalesStock(salesId);
      setProducts(prodData);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data.");
    } finally {
      setLoadingData(false);
    }
  }, [salesId]);

  useEffect(() => {
    load();
  }, [load]);

  const addToCart = (product: SalesProduct) => {
    if (product.stock === 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { product, quantity: 1, hargaJual: product.hargaPabrik },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null as any;
          if (newQty > i.product.stock) return i;
          return { ...i, quantity: newQty };
        })
        .filter(Boolean),
    );
  };

  const updatePrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, hargaJual: Math.max(0, price) }
          : i,
      ),
    );
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.hargaJual * i.quantity, 0);
  const estimasiKomisi = cart.reduce(
    (s, i) => s + (i.hargaJual - i.product.hargaPabrik) * i.quantity,
    0,
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "kasbon" && !selectedCustomer) {
      setError("Transaksi kasbon wajib memilih toko/pelanggan tujuan.");
      return;
    }
    setError("");
    setSaving(true);

    const items: TxItemInput[] = cart.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      hargaPabrik: i.product.hargaPabrik,
      hargaJual: i.hargaJual,
      quantity: i.quantity,
    }));

    try {
      const trx = await createSalesTransaction(
        salesId,
        items,
        paymentMethod,
        selectedCustomer?.id ?? null,
      );
      setReceipt({
        id: trx.id.slice(0, 8).toUpperCase(),
        date: new Date().toLocaleString("id-ID"),
        customer: selectedCustomer?.name ?? "Umum",
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.hargaJual,
          subtotal: i.hargaJual * i.quantity,
        })),
        subtotal,
        paymentMethod,
      });
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod("cash");
      setShowCart(false);
      load();
    } catch (err: any) {
      setError(err.message ?? "Gagal memproses transaksi.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
        <p className="text-sm text-[#111111]/35">Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="p-4 sticky top-0 bg-[#F4F7FE] z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 border border-black/5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
          />
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("history")}
            title="Riwayat Transaksi"
            className="w-10 h-10 flex-shrink-0 bg-white border border-black/5 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <History className="w-4 h-4 text-[#111111]/60" />
          </button>
        )}
      </div>

      {error && !showCart && (
        <div className="mx-4 mb-3 p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => {
          const inCart = cart.find((i) => i.product.id === product.id);
          return (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`text-left border-2 rounded-2xl p-3 relative transition-all ${
                product.stock === 0
                  ? "border-black/5 bg-[#F4F7FE] opacity-50"
                  : inCart
                    ? "border-[#0249E1] bg-[#0249E1]/10"
                    : "border-black/5 bg-white active:border-[#80B0EC]"
              }`}
            >
              {inCart && (
                <span className="absolute top-2 right-2 bg-[#0249E1] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {inCart.quantity}
                </span>
              )}
              <p className="text-sm font-semibold text-[#111111] leading-tight mb-1">
                {product.name}
                {product.size ? ` (${product.size})` : ""}
              </p>
              <p className="text-sm font-bold text-[#0249E1] mb-1.5">
                {formatRp(product.hargaPabrik)}
              </p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  product.stock > product.minStock
                    ? "bg-[#DAFB71]/25 text-[#0249E1]"
                    : product.stock > 0
                      ? "bg-[#EE3D5A]/12 text-[#EE3D5A]"
                      : "bg-[#EE3D5A]/15 text-[#EE3D5A]"
                }`}
              >
                Stok: {product.stock} {product.unit}
              </span>
            </button>
          );
        })}
      </div>

      {cart.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-[76px] left-4 right-4 bg-[#0249E1] text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-lg shadow-[#0249E1]/30 cursor-pointer z-20"
        >
          <span className="flex items-center gap-2 font-semibold text-sm">
            <ShoppingCart className="w-4.5 h-4.5" />
            {totalQty} item
          </span>
          <span className="font-bold">{formatRp(subtotal)}</span>
        </button>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <h2 className="font-bold text-[#111111]">Keranjang</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-1.5 hover:bg-[#F4F7FE] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {error && (
                <div className="p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {cart.map((item) => {
                const komisiItem =
                  (item.hargaJual - item.product.hargaPabrik) * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    className="border border-black/5 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-[#111111] flex-1">
                        {item.product.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[#EE3D5A] p-1 -mt-1 -mr-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative mb-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#111111]/35">
                        Rp
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={item.hargaJual}
                        onChange={(e) =>
                          updatePrice(
                            item.product.id,
                            Number(e.target.value) || 0,
                          )
                        }
                        className="w-full pl-8 pr-3 py-2 border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-7 h-7 border border-black/5 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-7 h-7 border border-black/5 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-[#111111]">
                        {formatRp(item.hargaJual * item.quantity)}
                      </p>
                    </div>
                    {komisiItem !== 0 && (
                      <p
                        className={`text-xs mt-1 text-right ${komisiItem > 0 ? "text-[#0249E1]" : "text-[#EE3D5A]"}`}
                      >
                        {komisiItem > 0 ? "+" : ""}
                        {formatRp(komisiItem)} komisi
                      </p>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                  Pelanggan (opsional)
                </label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between px-3 py-2.5 border border-black/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        {selectedCustomer.name}
                      </p>
                      {selectedCustomer.phone && (
                        <p className="text-xs text-[#111111]/40">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-[#EE3D5A] font-medium cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomerPicker(true)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-black/15 text-[#111111]/60 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Pilih Pelanggan (Umum jika kosong)
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "cash", label: "Cash", icon: Banknote },
                      { key: "transfer", label: "Transfer", icon: CreditCard },
                      { key: "kasbon", label: "Kasbon", icon: Wallet },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium cursor-pointer ${
                        paymentMethod === m.key
                          ? "border-[#0249E1] bg-[#0249E1]/10 text-[#0249E1]"
                          : "border-black/5 text-[#111111]/60"
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "kasbon" && (
                  <p className="text-[11px] text-[#EE3D5A] mt-1.5">
                    Kasbon = titipan/piutang, wajib pilih toko tujuan di atas.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-black/5 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-[#111111]/60">
                <span>Subtotal</span>
                <span>{formatRp(subtotal)}</span>
              </div>
              {estimasiKomisi !== 0 && (
                <div
                  className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg ${
                    estimasiKomisi >= 0
                      ? "bg-[#DAFB71]/20 text-[#0249E1]"
                      : "bg-[#EE3D5A]/10 text-[#EE3D5A]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Estimasi Komisi
                  </span>
                  <span>{formatRp(estimasiKomisi)}</span>
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={saving || cart.length === 0}
                className="w-full bg-[#0249E1] text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving ? "Memproses..." : `Bayar ${formatRp(subtotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <ReceiptDialog
          transaction={receipt}
          onClose={() => setReceipt(null)}
          onViewHistory={
            onNavigate
              ? () => {
                  setReceipt(null);
                  onNavigate("history");
                }
              : undefined
          }
        />
      )}

      {showCustomerPicker && (
        <CustomerPage
          salesId={salesId}
          mode="picker"
          onSelect={(c) => setSelectedCustomer(c)}
          onClose={() => setShowCustomerPicker(false)}
        />
      )}
    </div>
  );
}
