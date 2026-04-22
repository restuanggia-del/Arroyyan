import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const products: Product[] = [
  { id: "1", name: "Arroyyan99 Cup Kecil", price: 3000, stock: 250 },
  { id: "2", name: "Arroyyan99 Cup Sedang", price: 5000, stock: 180 },
  { id: "3", name: "Arroyyan99 Botol Kecil", price: 4000, stock: 120 },
  { id: "4", name: "Arroyyan99 Botol Sedang", price: 6000, stock: 150 },
];

export function SalesTransaction() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity > 0 && newQuantity <= item.product.stock) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    if (!customerName.trim()) {
      alert("Mohon isi nama pelanggan!");
      return;
    }

    const transaction = {
      date: new Date().toLocaleString("id-ID"),
      customer: customerName,
      phone: customerPhone,
      items: cart,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      paymentMethod,
    };

    setLastTransaction(transaction);
    setShowReceipt(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewTransaction = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setShowReceipt(false);
    setLastTransaction(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Transaksi Penjualan
        </h1>
        <p className="text-gray-600">Point of Sales - Distributor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pilih Produk
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-left cursor-pointer"
                  disabled={product.stock === 0}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.stock > 50
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {product.stock} unit
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Pelanggan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xx xxxx xxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Keranjang</h2>
              <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                {cart.length}
              </span>
            </div>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Keranjang kosong
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm flex-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-semibold text-gray-900">
                        Rp{" "}
                        {(item.product.price * item.quantity).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  Rp {calculateSubtotal().toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-xl font-bold text-blue-600">
                  Rp {calculateTotal().toLocaleString("id-ID")}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("transfer")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                      paymentMethod === "transfer"
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Transfer</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
              <h2 className="text-lg font-semibold text-gray-900">
                Struk Pembayaran
              </h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div id="receipt" className="p-6 font-mono text-sm">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold mb-1">ARROYYAN99</h1>
                <p className="text-xs text-gray-600">Air Minum Dalam Kemasan</p>
                <p className="text-xs text-gray-600">Tulang Bawang, Lampung</p>
              </div>

              <div className="border-t border-b border-gray-300 py-3 mb-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Tanggal:</span>
                  <span>{lastTransaction.date}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Pelanggan:</span>
                  <span>{lastTransaction.customer}</span>
                </div>
                {lastTransaction.phone && (
                  <div className="flex justify-between">
                    <span>Telepon:</span>
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
                  {lastTransaction.items.map(
                    (item: CartItem, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-1">{item.product.name}</td>
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
                    ),
                  )}
                </tbody>
              </table>

              <div className="border-t border-gray-300 pt-3 mb-3">
                <div className="flex justify-between mb-2 text-xs">
                  <span>Subtotal:</span>
                  <span>
                    Rp {lastTransaction.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>
                    Rp {lastTransaction.total.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mb-4 text-xs">
                <div className="flex justify-between">
                  <span>Metode Pembayaran:</span>
                  <span className="uppercase font-semibold">
                    {lastTransaction.paymentMethod === "cash"
                      ? "TUNAI"
                      : "TRANSFER"}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-600">
                <p>Terima kasih atas pembelian Anda!</p>
                <p>Semoga sehat selalu</p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={handleNewTransaction}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
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
