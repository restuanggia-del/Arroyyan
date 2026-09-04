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
  HeartHandshake,
  Building2,
  Gift,
  PackageOpen,
  PackageSearch,
} from "lucide-react";
import {
  getProductsWithSalesStock,
  createSalesTransaction,
  createSalesStockOut,
  SalesProduct,
  TxItemInput,
  StockOutMovementType,
} from "../../../services";
import ReceiptDialog from "./ReceiptDialog";
import CustomerPage from "../customer/CustomerPage";

interface TransactionPageProps {
  salesId: string;
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

type JenisTransaksi = "penjualan" | "sodaqoh" | "internal" | "bonus";

const JENIS_OPTIONS: {
  key: JenisTransaksi;
  label: string;
  icon: typeof ShoppingCart;
}[] = [
  { key: "penjualan", label: "Penjualan", icon: ShoppingCart },
  { key: "sodaqoh", label: "Sodaqoh", icon: HeartHandshake },
  { key: "internal", label: "Internal", icon: Building2 },
  { key: "bonus", label: "Bonus / Hadiah", icon: Gift },
];

const JENIS_MOVEMENT_TYPE: Record<
  Exclude<JenisTransaksi, "penjualan">,
  StockOutMovementType
> = {
  sodaqoh: "sodaqoh_out",
  internal: "pribadi_out",
  bonus: "bonus_out",
};

const JENIS_SUBMIT_LABEL: Record<
  Exclude<JenisTransaksi, "penjualan">,
  string
> = {
  sodaqoh: "Simpan Sodaqoh",
  internal: "Simpan Internal",
  bonus: "Simpan Bonus / Hadiah",
};

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
  const [jenisTransaksi, setJenisTransaksi] =
    useState<JenisTransaksi>("penjualan");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "kasbon"
  >("cash");
  const [note, setNote] = useState("");
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

  const handleJenisChange = (jenis: JenisTransaksi) => {
    setJenisTransaksi(jenis);
    setError("");
    if (jenis !== "penjualan") {
      setCart((prev) =>
        prev.map((i) => ({ ...i, hargaJual: i.product.hargaPabrik })),
      );
    }
  };

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.hargaJual * i.quantity, 0);
  const estimasiKomisi = cart.reduce(
    (s, i) => s + (i.hargaJual - i.product.hargaPabrik) * i.quantity,
    0,
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const resetCheckoutState = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setNote("");
    setJenisTransaksi("penjualan");
    setShowCart(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (jenisTransaksi === "penjualan") {
      if (paymentMethod === "kasbon" && !selectedCustomer) {
        setError("Transaksi kasbon wajib memilih toko/pelanggan tujuan.");
        return;
      }
    }

    setError("");
    setSaving(true);

    try {
      if (jenisTransaksi === "penjualan") {
        const items: TxItemInput[] = cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          hargaPabrik: i.product.hargaPabrik,
          hargaJual: i.hargaJual,
          quantity: i.quantity,
        }));

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
      } else {
        const movementType = JENIS_MOVEMENT_TYPE[jenisTransaksi];
        const items = cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
        }));

        await createSalesStockOut(
          salesId,
          items,
          movementType,
          note,
          selectedCustomer?.name ?? null,
        );
        setReceipt({
          id: Date.now().toString(36).toUpperCase(),
          date: new Date().toLocaleString("id-ID"),
          customer: selectedCustomer?.name ?? "Umum",
          items: cart.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.hargaPabrik,
            subtotal: i.product.hargaPabrik * i.quantity,
          })),
          subtotal,
          paymentMethod: movementType,
        });
      }

      resetCheckoutState();
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
      <div className="p-4 sticky top-0 clay-page-bg z-10 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-4 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
          />
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("history")}
            title="Riwayat Transaksi"
            className="w-10 h-10 flex-shrink-0 clay-raised rounded-xl flex items-center justify-center cursor-pointer"
          >
            <History className="w-4 h-4 text-[#111111]/60" />
          </button>
        )}
      </div>

      {error && !showCart && (
        <div className="mx-4 mb-3 p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
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
                  ? "clay-inset-sm border-2 border-transparent opacity-50"
                  : inCart
                    ? "border-2 border-[#0249E1] clay-blue-soft"
                    : "clay-raised-sm border-0"
              }`}
            >
              {inCart && (
                <span className="absolute top-2 right-2 clay-blue text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
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

      {products.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0249E1]/5 flex items-center justify-center">
            <PackageOpen className="w-7 h-7 text-[#111111]/25" />
          </div>
          <p className="text-sm font-semibold text-[#111111]/60 mb-1">
            Produk masih kosong
          </p>
          <p className="text-xs text-[#111111]/40 max-w-[240px] mx-auto">
            Belum ada produk/stok yang ditambahkan atau didistribusikan oleh
            admin untuk kamu. Silakan hubungi admin untuk mengirimkan stok
            produk terlebih dahulu.
          </p>
        </div>
      ) : (
        filteredProducts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#0249E1]/5 flex items-center justify-center">
              <PackageSearch className="w-6 h-6 text-[#111111]/25" />
            </div>
            <p className="text-sm font-semibold text-[#111111]/60 mb-1">
              Produk tidak ditemukan
            </p>
            <p className="text-xs text-[#111111]/40">
              Coba kata kunci lain untuk "{search}".
            </p>
          </div>
        )
      )}

      {cart.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-[76px] left-4 right-4 clay-blue clay-pressable text-white rounded-2xl py-3.5 px-5 flex items-center justify-between cursor-pointer z-20"
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
          <div className="clay-raised-lg rounded-t-3xl w-full max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
              <h2 className="font-bold text-[#111111]">Keranjang</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {error && (
                <div className="p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {JENIS_OPTIONS.map((j) => (
                    <button
                      key={j.key}
                      onClick={() => handleJenisChange(j.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium cursor-pointer ${
                        jenisTransaksi === j.key
                          ? "border-2 border-[#0249E1] clay-blue-soft text-[#0249E1]"
                          : "clay-inset-sm border-2 border-transparent text-[#111111]/60"
                      }`}
                    >
                      <j.icon className="w-4 h-4" />
                      {j.label}
                    </button>
                  ))}
                </div>
                {jenisTransaksi !== "penjualan" && (
                  <p className="text-[11px] text-[#111111]/40 mt-1.5">
                    Barang keluar tanpa transaksi jual-beli (tidak masuk riwayat
                    penjualan/komisi), stok tetap dikurangi dari stok kamu.
                  </p>
                )}
              </div>

              {cart.map((item) => {
                const komisiItem =
                  (item.hargaJual - item.product.hargaPabrik) * item.quantity;
                return (
                  <div
                    key={item.product.id}
                    className="clay-raised rounded-xl p-3"
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

                    {jenisTransaksi === "penjualan" ? (
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
                          className="w-full pl-8 pr-3 py-2 clay-raised rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-[#111111]/40 mb-2">
                        Harga pabrik (referensi): {formatRp(item.hargaJual)}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="w-7 h-7 clay-raised rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="w-7 h-7 clay-raised rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-[#111111]">
                        {formatRp(item.hargaJual * item.quantity)}
                      </p>
                    </div>
                    {jenisTransaksi === "penjualan" && komisiItem !== 0 && (
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
                  {jenisTransaksi === "penjualan"
                    ? "Pelanggan (opsional)"
                    : "Penerima (opsional)"}
                </label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between px-3 py-2.5 clay-raised rounded-xl">
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
                    {jenisTransaksi === "penjualan"
                      ? "Pilih Pelanggan (Umum jika kosong)"
                      : "Pilih Penerima (opsional)"}
                  </button>
                )}
              </div>

              {jenisTransaksi === "penjualan" ? (
                <div>
                  <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "cash", label: "Cash", icon: Banknote },
                        {
                          key: "transfer",
                          label: "Transfer",
                          icon: CreditCard,
                        },
                        { key: "kasbon", label: "Kasbon", icon: Wallet },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setPaymentMethod(m.key)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium cursor-pointer ${
                          paymentMethod === m.key
                            ? "border-2 border-[#0249E1] clay-blue-soft text-[#0249E1]"
                            : "clay-inset-sm border-2 border-transparent text-[#111111]/60"
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
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                    Catatan
                    <span className="text-[#111111]/30 font-normal ml-1">
                      (opsional)
                    </span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      jenisTransaksi === "sodaqoh"
                        ? "Contoh: Sodaqoh ke Masjid Al-Ikhlas"
                        : jenisTransaksi === "internal"
                          ? "Contoh: Konsumsi pribadi sales"
                          : "Contoh: Hadiah untuk toko langganan"
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-[rgba(140,172,214,0.35)] px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-[#111111]/60">
                <span>
                  {jenisTransaksi === "penjualan"
                    ? "Subtotal"
                    : "Total Nilai Barang"}
                </span>
                <span>{formatRp(subtotal)}</span>
              </div>
              {jenisTransaksi === "penjualan" && estimasiKomisi !== 0 && (
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
                className="w-full clay-blue clay-pressable text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {saving
                  ? "Memproses..."
                  : jenisTransaksi === "penjualan"
                    ? `Bayar ${formatRp(subtotal)}`
                    : JENIS_SUBMIT_LABEL[jenisTransaksi]}
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
