import { X, CheckCircle2 } from "lucide-react";

interface ReceiptDialogProps {
  transaction: {
    id: string;
    date: string;
    customer: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
    subtotal: number;
    paymentMethod: "cash" | "transfer" | "kasbon";
  };
  onClose: () => void;
}

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

const paymentLabel: Record<string, string> = {
  cash: "TUNAI",
  transfer: "TRANSFER",
  kasbon: "KASBON / TITIPAN",
};

export default function ReceiptDialog({
  transaction,
  onClose,
}: ReceiptDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="font-bold text-[#111111] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0249E1]" />
            Transaksi Berhasil
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F4F7FE] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        <div className="p-5 font-mono text-xs">
          <div className="border-b border-dashed border-black/10 pb-3 mb-3 space-y-1">
            <div className="flex justify-between">
              <span>No</span>
              <span>#{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{transaction.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{transaction.customer}</span>
            </div>
          </div>

          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1">{item.name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">
                    {item.subtotal.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black/10 pt-2 flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatRp(transaction.subtotal)}</span>
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span>Pembayaran</span>
            <span className="font-bold">
              {paymentLabel[transaction.paymentMethod]}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-[#0249E1] text-white py-3 rounded-xl font-semibold cursor-pointer"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
