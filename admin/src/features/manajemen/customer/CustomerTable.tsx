import {
  Search,
  Plus,
  AlertCircle,
  RefreshCw,
  Phone,
  Star,
  Briefcase,
} from "lucide-react";
import { Customer } from "../../../services/customerService";
import { CustomerRowMenu } from "../customer/CustomerRowMenu";
import { formatDate } from "./utils";

const TABLE_HEADERS = [
  "Nama",
  "Sales",
  "No. Telepon",
  "Alamat",
  "Status",
  "Terdaftar",
  "Aksi",
];

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterType: "all" | "subscribed" | "regular";
  onFilterChange: (f: "all" | "subscribed" | "regular") => void;
  onAdd: () => void;
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

export function CustomerTable({
  customers,
  loading,
  error,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <div className="clay-raised rounded-xl">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau telepon..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "subscribed", "regular"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  filterType === f
                    ? f === "subscribed"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-[rgba(215,233,255,0.5)]"
                }`}
              >
                {f === "all"
                  ? "Semua"
                  : f === "subscribed"
                    ? "Langganan"
                    : "Reguler"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onAdd}
          className="clay-blue clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Memuat data pelanggan...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(140,172,214,0.35)]">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_HEADERS.length}
                      className="py-12 text-center text-gray-500 text-sm"
                    >
                      Tidak ada pelanggan ditemukan
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {c.customer_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {c.customer_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.sales?.nama_sales ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {c.sales.nama_sales}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {c.phone ?? "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px] truncate">
                        {c.address ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        {c.is_subscribed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Langganan
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(215,233,255,0.55)] text-gray-600">
                            Reguler
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <CustomerRowMenu
                          onView={() => onView(c)}
                          onEdit={() => onEdit(c)}
                          onDelete={() => onDelete(c)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
