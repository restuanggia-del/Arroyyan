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
} from "lucide-react";
import {
  getProductsWithSalesStock,
  getCustomers,
  createSalesTransaction,
  createCustomer,
  SalesProduct,
  TxItemInput,
} from "../services/SalesAppService";
import ReceiptDialog from "./ReceiptDialog";

interface TransactionPageProps {
  salesId: string;
}

interface CartItem {
  product: SalesProduct;
  quantity: number;
  hargaJual: number;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function TransactionPage({ salesId }: TransactionPageProps) {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [customers, setCustomers] = useState<
    { id: string; name: string; phone: string }[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "kasbon"
  >("cash");
  const [customerId, setCustomerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prodData, custData] = await Promise.all([
        getProductsWithSalesStock(salesId),
        getCustomers(),
      ]);
      setProducts(prodData);
      setCustomers(custData);
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
    if (paymentMethod === "kasbon" && !customerId) {
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
        customerId || null,
      );
      const customer = customers.find((c) => c.id === customerId);
      setReceipt({
        id: trx.id.slice(0, 8).toUpperCase(),
        date: new Date().toLocaleString("id-ID"),
        customer: customer?.name ?? "Umum",
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
      setCustomerId("");
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
        <RefreshCw className="w-7 h-7 text-gray-300 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400">Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="p-4 sticky top-0 bg-gray-50 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {error && !showCart && (
        <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
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
                  ? "border-gray-100 bg-gray-50 opacity-50"
                  : inCart
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-gray-100 bg-white active:border-cyan-300"
              }`}
            >
              {inCart && (
                <span className="absolute top-2 right-2 bg-cyan-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {inCart.quantity}
                </span>
              )}
              <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">
                {product.name}
                {product.size ? ` (${product.size})` : ""}
              </p>
              <p className="text-sm font-bold text-cyan-700 mb-1.5">
                {formatRp(product.hargaPabrik)}
              </p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  product.stock > product.minStock
                    ? "bg-green-100 text-green-700"
                    : product.stock > 0
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                Stok: {product.stock} {product.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-[76px] left-4 right-4 bg-cyan-600 text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-lg shadow-cyan-500/30 cursor-pointer z-20"
        >
          <span className="flex items-center gap-2 font-semibold text-sm">
            <ShoppingCart className="w-4.5 h-4.5" />
            {totalQty} item
          </span>
          <span className="font-bold">{formatRp(subtotal)}</span>
        </button>
      )}

      {/* Cart / checkout sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Keranjang</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
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
                    className="border border-gray-100 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900 flex-1">
                        {item.product.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 p-1 -mt-1 -mr-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative mb-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
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
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatRp(item.hargaJual * item.quantity)}
                      </p>
                    </div>
                    {komisiItem !== 0 && (
                      <p
                        className={`text-xs mt-1 text-right ${komisiItem > 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {komisiItem > 0 ? "+" : ""}
                        {formatRp(komisiItem)} komisi
                      </p>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Pelanggan (opsional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Umum (tanpa data)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` — ${c.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewCustomer(true)}
                    className="px-3 border border-gray-200 rounded-xl text-cyan-600 cursor-pointer flex-shrink-0"
                    title="Tambah toko baru"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
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
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "kasbon" && (
                  <p className="text-[11px] text-amber-600 mt-1.5">
                    Kasbon = titipan/piutang, wajib pilih toko tujuan di atas.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatRp(subtotal)}</span>
              </div>
              {estimasiKomisi !== 0 && (
                <div
                  className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg ${
                    estimasiKomisi >= 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
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
                className="w-full bg-cyan-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving ? "Memproses..." : `Bayar ${formatRp(subtotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <ReceiptDialog transaction={receipt} onClose={() => setReceipt(null)} />
      )}

      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={(newCust) => {
            setCustomers((prev) =>
              [...prev, newCust].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setCustomerId(newCust.id);
            setShowNewCustomer(false);
          }}
        />
      )}
    </div>
  );
}

function NewCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: { id: string; name: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Nama toko/pelanggan wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createCustomer({
        customer_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      onCreated({
        id: created.id,
        name: created.customer_name,
        phone: created.phone ?? "",
      });
    } catch (err: any) {
      setError(err.message ?? "Gagal menambah toko baru.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Tambah Toko Baru</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Nama Toko/Pelanggan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              No. HP
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Alamat
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-cyan-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Toko"}
          </button>
        </div>
      </div>
    </div>
  );
}
