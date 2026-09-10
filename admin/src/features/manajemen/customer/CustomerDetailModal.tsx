import { X, Star, Briefcase } from "lucide-react";
import { Customer } from "../../../services/customerService";
import { formatDate } from "./utils";

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailModal({
  customer,
  onClose,
}: CustomerDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Detail Pelanggan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {customer.customer_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {customer.customer_name}
              </h3>
              {customer.is_subscribed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Star className="w-3 h-3" fill="currentColor" />
                  Langganan
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(140,172,214,0.2)]">
              <span className="text-gray-500 flex items-center gap-1.5">
                Sales
              </span>
              <span className="font-medium">
                {customer.sales?.nama_sales ?? "— Tidak ada / Admin —"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(140,172,214,0.2)]">
              <span className="text-gray-500">No. Telepon</span>
              <span className="font-medium">{customer.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(140,172,214,0.2)]">
              <span className="text-gray-500">Alamat</span>
              <span className="font-medium text-right max-w-[220px]">
                {customer.address ?? "—"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Terdaftar</span>
              <span className="font-medium">
                {formatDate(customer.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
