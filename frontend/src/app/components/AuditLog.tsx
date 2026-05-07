import { useState } from "react";
import {
  History,
  User,
  ShoppingCart,
  Edit,
  LogIn,
  Search,
  Filter,
  Calendar,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "login" | "transaction" | "data_change";
  user: string;
  action: string;
  details: string;
  ipAddress?: string;
}

const logData: LogEntry[] = [
  {
    id: "1",
    timestamp: "2026-04-21 14:35:22",
    type: "transaction",
    user: "Restu Anggia (Admin)",
    action: "Transaksi Penjualan",
    details: "Transaksi TRX001 sebesar Rp 70.000 kepada Budi Santoso",
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    timestamp: "2026-04-21 14:30:15",
    type: "data_change",
    user: "Restu Anggia (Admin)",
    action: "Update Stok",
    details: "Stok masuk Arroyyan99 Cup Sedang sebanyak 500 unit",
    ipAddress: "192.168.1.100",
  },
  {
    id: "3",
    timestamp: "2026-04-21 13:45:10",
    type: "login",
    user: "Restu Anggia (Admin)",
    action: "Login Berhasil",
    details: "Login ke sistem melalui web browser",
    ipAddress: "192.168.1.100",
  },
  {
    id: "4",
    timestamp: "2026-04-21 11:20:35",
    type: "data_change",
    user: "Restu Anggia (Admin)",
    action: "Tambah Produk",
    details: 'Produk baru "Arroyyan99 Botol Sedang" ditambahkan',
    ipAddress: "192.168.1.100",
  },
  {
    id: "5",
    timestamp: "2026-04-21 10:15:45",
    type: "transaction",
    user: "Ahmad Distributor (Distributor)",
    action: "Distribusi Barang",
    details: "Distribusi 300 unit ke Distributor Bandung",
    ipAddress: "192.168.1.105",
  },
  {
    id: "6",
    timestamp: "2026-04-21 09:30:20",
    type: "login",
    user: "Ahmad Distributor (Distributor)",
    action: "Login Berhasil",
    details: "Login ke sistem melalui web browser",
    ipAddress: "192.168.1.105",
  },
  {
    id: "7",
    timestamp: "2026-04-20 16:45:55",
    type: "data_change",
    user: "Restu Anggia (Admin)",
    action: "Update Pelanggan",
    details: 'Data pelanggan "Siti Nurhaliza" diperbarui',
    ipAddress: "192.168.1.100",
  },
  {
    id: "8",
    timestamp: "2026-04-20 15:20:10",
    type: "transaction",
    user: "Ahmad Distributor (Distributor)",
    action: "Transaksi Penjualan",
    details: "Transaksi TRX002 sebesar Rp 48.000 kepada Dewi Lestari",
    ipAddress: "192.168.1.105",
  },
];

export function AuditLog() {
  const [filterType, setFilterType] = useState<
    "all" | "login" | "transaction" | "data_change"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("2026-04-21");

  const filteredLogs = logData.filter((log) => {
    const matchesType = filterType === "all" || log.type === filterType;
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = log.timestamp.startsWith(dateFilter);

    return matchesType && matchesSearch && matchesDate;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case "login":
        return <LogIn className="w-5 h-5 text-green-600" />;
      case "transaction":
        return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case "data_change":
        return <Edit className="w-5 h-5 text-orange-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "login":
        return "bg-green-100";
      case "transaction":
        return "bg-blue-100";
      case "data_change":
        return "bg-orange-100";
      default:
        return "bg-gray-100";
    }
  };

  const getLogLabel = (type: string) => {
    switch (type) {
      case "login":
        return "Login";
      case "transaction":
        return "Transaksi";
      case "data_change":
        return "Perubahan Data";
      default:
        return type;
    }
  };

  const loginCount = logData.filter((l) => l.type === "login").length;
  const transactionCount = logData.filter(
    (l) => l.type === "transaction",
  ).length;
  const dataChangeCount = logData.filter(
    (l) => l.type === "data_change",
  ).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Audit & Log Aktivitas
        </h1>
        <p className="text-gray-600">
          Pantau semua aktivitas dan perubahan dalam sistem
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Log</h3>
          <p className="text-2xl font-bold text-gray-900">{logData.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Log Login</h3>
          <p className="text-2xl font-bold text-gray-900">{loginCount}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Log Transaksi</h3>
          <p className="text-2xl font-bold text-gray-900">{transactionCount}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Edit className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Perubahan Data</h3>
          <p className="text-2xl font-bold text-gray-900">{dataChangeCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari user, aksi, atau detail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600 " />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 "
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType("login")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filterType === "login"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setFilterType("transaction")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filterType === "transaction"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Transaksi
              </button>
              <button
                onClick={() => setFilterType("data_change")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filterType === "data_change"
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Perubahan Data
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getLogColor(log.type)}`}
                  >
                    {getLogIcon(log.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {log.action}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.type === "login"
                                ? "bg-green-100 text-green-700"
                                : log.type === "transaction"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {getLogLabel(log.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{log.user}</span>
                          </div>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  Tidak ada log aktivitas ditemukan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
