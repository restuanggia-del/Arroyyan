import { useState } from "react";
import {
  Users,
  Phone,
  ShoppingBag,
  Star,
  Plus,
  Search,
  Eye,
  X,
} from "lucide-react";
import { AddCustomerModal } from "./AddCustomerModal";

interface Purchase {
  id: string;
  date: string;
  items: string[];
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  isLoyalCustomer: boolean;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  purchases: Purchase[];
}

const customers: Customer[] = [
  {
    id: "1",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi.santoso@email.com",
    address: "Jl. Merdeka No. 45, Jakarta",
    isLoyalCustomer: true,
    totalPurchases: 45,
    totalSpent: 2250000,
    lastPurchase: "2026-04-21",
    purchases: [
      {
        id: "TRX001",
        date: "2026-04-21 10:30",
        items: ["Arroyyan99 Cup Sedang (10)", "Arroyyan99 Botol Kecil (5)"],
        total: 70000,
      },
      {
        id: "TRX002",
        date: "2026-04-18 14:20",
        items: ["Arroyyan99 Cup Kecil (20)"],
        total: 60000,
      },
    ],
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    phone: "082345678901",
    email: "siti.nur@email.com",
    address: "Jl. Sudirman No. 12, Bandung",
    isLoyalCustomer: true,
    totalPurchases: 32,
    totalSpent: 1850000,
    lastPurchase: "2026-04-20",
    purchases: [
      {
        id: "TRX003",
        date: "2026-04-20 09:15",
        items: ["Arroyyan99 Botol Sedang (8)"],
        total: 48000,
      },
    ],
  },
  {
    id: "3",
    name: "Ahmad Rizki",
    phone: "083456789012",
    isLoyalCustomer: false,
    totalPurchases: 8,
    totalSpent: 420000,
    lastPurchase: "2026-04-19",
    purchases: [
      {
        id: "TRX004",
        date: "2026-04-19 16:45",
        items: ["Arroyyan99 Cup Kecil (15)"],
        total: 45000,
      },
    ],
  },
  {
    id: "4",
    name: "Dewi Lestari",
    phone: "084567890123",
    email: "dewi.lestari@email.com",
    isLoyalCustomer: true,
    totalPurchases: 28,
    totalSpent: 1600000,
    lastPurchase: "2026-04-21",
    purchases: [
      {
        id: "TRX005",
        date: "2026-04-21 11:00",
        items: ["Arroyyan99 Cup Sedang (12)", "Arroyyan99 Cup Kecil (10)"],
        total: 90000,
      },
    ],
  },
  {
    id: "5",
    name: "Rudi Hartono",
    phone: "085678901234",
    isLoyalCustomer: false,
    totalPurchases: 5,
    totalSpent: 180000,
    lastPurchase: "2026-04-15",
    purchases: [
      {
        id: "TRX006",
        date: "2026-04-15 13:20",
        items: ["Arroyyan99 Botol Kecil (6)"],
        total: 24000,
      },
    ],
  },
];

export function CustomerManagement() {
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "loyal" | "regular">(
    "all",
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddCustomer = (customer: Customer) => {
    setCustomerList([customer, ...customerList]);
    setShowAddModal(false);
  };

  const filteredCustomers = customerList.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);

    const matchesFilter =
      filterType === "all" ||
      (filterType === "loyal" && customer.isLoyalCustomer) ||
      (filterType === "regular" && !customer.isLoyalCustomer);

    return matchesSearch && matchesFilter;
  });

  const loyalCustomerCount = customerList.filter(
    (c) => c.isLoyalCustomer,
  ).length;
  const totalCustomers = customerList.length;
  const totalRevenue = customerList.reduce((sum, c) => sum + c.totalSpent, 0);
  const averagePerCustomer = totalRevenue / totalCustomers;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Manajemen Pelanggan
        </h1>
        <p className="text-gray-600">
          Kelola data pelanggan dan riwayat pembelian
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Pelanggan</h3>
          <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Pelanggan Langganan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loyalCustomerCount}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Pendapatan</h3>
          <p className="text-2xl font-bold text-gray-900">
            Rp {(totalRevenue / 1000000).toFixed(1)}jt
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Rata-rata/Pelanggan</h3>
          <p className="text-2xl font-bold text-gray-900">
            Rp {(averagePerCustomer / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau nomor telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    filterType === "all"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType("loyal")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    filterType === "loyal"
                      ? "bg-amber-50 text-amber-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Langganan
                </button>
                <button
                  onClick={() => setFilterType("regular")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    filterType === "regular"
                      ? "bg-gray-100 text-gray-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Reguler
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Tambah Pelanggan
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Nama
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    No. Telepon
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Total Pembelian
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Total Belanja
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Terakhir Beli
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {customer.isLoyalCustomer ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Langganan
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Reguler
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900">
                        {customer.totalPurchases}x
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {customer.totalSpent.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {customer.lastPurchase}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada pelanggan ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCustomer}
        />
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Detail Pelanggan
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {selectedCustomer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {selectedCustomer.name}
                      </h3>
                      {selectedCustomer.isLoyalCustomer && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Pelanggan Langganan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">No. Telepon</p>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  {selectedCustomer.email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.email}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Alamat</p>
                      <p className="font-medium text-gray-900">
                        {selectedCustomer.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Pembelian</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCustomer.totalPurchases}x
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Belanja</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {(selectedCustomer.totalSpent / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Terakhir Beli</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {selectedCustomer.lastPurchase}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Riwayat Pembelian
                </h3>
                <div className="space-y-3">
                  {selectedCustomer.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">
                            #{purchase.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {purchase.date}
                          </p>
                        </div>
                        <p className="font-bold text-blue-600">
                          Rp {purchase.total.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-2">
                          Item yang dibeli:
                        </p>
                        <ul className="space-y-1">
                          {purchase.items.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-900">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
