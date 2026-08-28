import { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  getProductsWithSalesStock,
  getCustomers,
  createSalesTransaction,
  SalesProduct,
  SalesCustomer,
} from "../../../services";
import CustomerPage from "../customer/CustomerPage";

interface KasbonCreateModalProps {
  salesId: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface CartItem {
  product: SalesProduct;
  quantity: number;
  unitPrice: number;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function KasbonCreateModal({
  salesId,
  onClose,
  onSaveSuccess,
}: KasbonCreateModalProps) {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedCustomer, setSelectedCustomer] =
    useState<SalesCustomer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [prodData, custData] = await Promise.all([
          getProductsWithSalesStock(salesId),
          getCustomers(),
        ]);
        setProducts(prodData);
        setCustomers(custData);
      } catch (err: any) {
        setFormError(err.message ?? "Gagal memuat data.");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [salesId]);

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
      return [...prev, { product, quantity: 1, unitPrice: product.hargaPabrik }];
    });
    setFormError("");
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
        i.product.id === productId ? { ...i, unitPrice: Math.max(0, price) } : i,
      ),
    );
  };

  const removeFromCart = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const totalDus = cart.reduce((s, i) => s + i.quantity, 0);
  const totalRp = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const estimasiKomisi = cart.reduce(
    (s, i) => s + (i.unitPrice - i.product.hargaPabrik) * i.quantity,
    0,
  );

  const handleSubmit = async () => {
    setFormError("");

    if (!selectedCustomer) {
      setFormError("Pilih toko tujuan titipan terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      setFormError("Tambahkan minimal 1 produk ke titipan.");
      return;
    }

    setSaving(true);
    try {
      await createSalesTransaction(
        salesId,
        cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          hargaPabrik: i.product.hargaPabrik,
          hargaJual: i.unitPrice,
          quantity: i.quantity,
        })),
        "kasbon",
        selectedCustomer.id,
      );
      onSaveSuccess();
    } catch (err: any) {
      setFormError(err.message ?? "Gagal menyimpan titipan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="clay-raised-lg rounded-t-3xl w-full max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)] flex-shrink-0">
          <h2 className="font-bold text-[#111111]">Buat Titipan Baru</h2>
          <button
            onClick={onClose}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {formError && (
            <div className="p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          {loadingData ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#111111]/35">Memuat data...</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                  Toko Tujuan <span className="text-[#EE3D5A]">*</span>
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
                      Ganti
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomerPicker(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#0249E1]/30 text-[#0249E1] py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Pilih Toko / Pelanggan
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-[#111111]/45 uppercase tracking-wide mb-2">
                  Pilih Produk
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {products.map((product) => {
                    const inCart = cart.find((i) => i.product.id === product.id);
                    const disabled = product.stock === 0;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={disabled}
                        className={`text-left rounded-xl p-3 transition-colors ${
                          disabled
                            ? "clay-inset-sm opacity-40 cursor-not-allowed"
                            : inCart
                              ? "clay-inset border-2 border-[#0249E1]/40 cursor-pointer"
                              : "clay-raised cursor-pointer"
                        }`}
                      >
                        <p className="text-sm font-medium text-[#111111] leading-tight mb-1">
                          {product.name}
                          {product.size ? ` (${product.size})` : ""}
                        </p>
                        <p className="text-sm font-bold text-[#0249E1]">
                          {formatRp(product.hargaPabrik)}
                        </p>
                        <p className="text-xs text-[#111111]/35 mt-1">
                          Stok: {product.stock}
                          {inCart ? ` · di keranjang: ${inCart.quantity}` : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#111111]/45 uppercase tracking-wide mb-2">
                  Keranjang Titipan
                </p>
                {cart.length === 0 ? (
                  <p className="text-sm text-[#111111]/35 text-center py-8 border border-dashed border-black/15 rounded-xl">
                    Belum ada produk dipilih
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="clay-raised rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-semibold text-[#111111] flex-1 leading-tight">
                            {item.product.name}
                            {item.product.size ? ` (${item.product.size})` : ""}
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
                            value={item.unitPrice}
                            onChange={(e) =>
                              updatePrice(
                                item.product.id,
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-full pl-8 pr-3 py-2 clay-inset-sm border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQty(item.product.id, -1)}
                              className="w-7 h-7 clay-raised-sm clay-pressable rounded-lg flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.product.id, 1)}
                              className="w-7 h-7 clay-raised-sm clay-pressable rounded-lg flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-[#111111]">
                            {formatRp(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                        <p className="text-xs text-[#111111]/35 mt-1">
                          Maks: {item.product.stock} unit
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[rgba(140,172,214,0.35)] px-5 py-4 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#111111]/45">
                Total {totalDus} unit titipan
              </p>
              <p className="text-lg font-extrabold text-[#111111]">
                {formatRp(totalRp)}
              </p>
            </div>
            {estimasiKomisi !== 0 && (
              <p
                className={`text-xs font-medium text-right ${
                  estimasiKomisi > 0 ? "text-[#0249E1]" : "text-[#EE3D5A]"
                }`}
              >
                Estimasi komisi:
                <br />
                {estimasiKomisi > 0 ? "+" : ""}
                {formatRp(estimasiKomisi)}
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || cart.length === 0}
            className="w-full clay-blue clay-pressable text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Titipan"}
          </button>
        </div>
      </div>

      {showCustomerPicker && (
        <CustomerPage
          salesId={salesId}
          mode="picker"
          onSelect={(c) =>
            setSelectedCustomer({
              id: c.id,
              name: c.name,
              phone: c.phone,
              address: "",
              isSubscribed: false,
            })
          }
          onClose={() => setShowCustomerPicker(false)}
        />
      )}
    </div>
  );
}
