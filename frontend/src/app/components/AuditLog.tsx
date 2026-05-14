import { useState, useEffect, useCallback } from "react";
import {
  History,
  User,
  ShoppingCart,
  Edit,
  LogIn,
  Search,
  Calendar,
  RefreshCw,
  Package,
  Truck,
} from "lucide-react";
import { getAuditLogs, AuditLogRow } from "../../services/reportService";

type FilterType = "all" | "login" | "transaction" | "product" | "stock";

const categorize = (type: string): FilterType => {
  if (type.includes("login")) return "login";
  if (type.includes("transaction")) return "transaction";
  if (type.includes("product")) return "product";
  if (type.includes("stock") || type.includes("distribution")) return "stock";
  return "stock";
};

const getIcon = (type: string) => {
  const cat = categorize(type);
  if (cat === "login") return <LogIn className="w-5 h-5 text-green-600" />;
  if (cat === "transaction")
    return <ShoppingCart className="w-5 h-5 text-blue-600" />;
  if (cat === "product") return <Package className="w-5 h-5 text-purple-600" />;
  if (cat === "stock") return <Truck className="w-5 h-5 text-orange-600" />;
  return <Edit className="w-5 h-5 text-gray-600" />;
};

const getBg = (type: string) => {
  const cat = categorize(type);
  if (cat === "login") return "bg-green-100";
  if (cat === "transaction") return "bg-blue-100";
  if (cat === "product") return "bg-purple-100";
  return "bg-orange-100";
};

const getBadge = (type: string) => {
  const cat = categorize(type);
  if (cat === "login")
    return { label: "Login", cls: "bg-green-100 text-green-700" };
  if (cat === "transaction")
    return { label: "Transaksi", cls: "bg-blue-100 text-blue-700" };
  if (cat === "product")
    return { label: "Produk", cls: "bg-purple-100 text-purple-700" };
  return { label: "Stok/Distribusi", cls: "bg-orange-100 text-orange-700" };
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const data = await getAuditLogs(dateFilter || undefined);
    setLogs(data);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const matchType =
      filterType === "all" || categorize(log.activity_type) === filterType;
    const matchSearch =
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.activity_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const countByType = (t: FilterType) =>
    logs.filter((l) => categorize(l.activity_type) === t).length;

  const filterBtns: { id: FilterType; label: string; activeCls: string }[] = [
    { id: "all", label: "Semua", activeCls: "bg-gray-100 text-gray-900" },
    { id: "login", label: "Login", activeCls: "bg-green-100 text-green-700" },
    {
      id: "transaction",
      label: "Transaksi",
      activeCls: "bg-blue-100 text-blue-700",
    },
    {
      id: "product",
      label: "Produk",
      activeCls: "bg-purple-100 text-purple-700",
    },
    {
      id: "stock",
      label: "Stok/Distribusi",
      activeCls: "bg-orange-100 text-orange-700",
    },
  ];

  const statCards = [
    {
      icon: <History className="w-6 h-6 text-gray-600" />,
      bg: "bg-gray-100",
      label: "Total Log",
      value: logs.length,
    },
    {
      icon: <LogIn className="w-6 h-6 text-green-600" />,
      bg: "bg-green-100",
      label: "Login",
      value: countByType("login"),
    },
    {
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      label: "Transaksi",
      value: countByType("transaction"),
    },
    {
      icon: <Edit className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-100",
      label: "Stok/Distribusi",
      value: countByType("stock"),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Audit & Log Aktivitas
          </h1>
          <p className="text-gray-600">
            Pantau semua aktivitas dan perubahan dalam sistem
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div
              className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}
            >
              {card.icon}
            </div>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Semua tanggal
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {filterBtns.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  filterType === f.id
                    ? f.activeCls
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {f.label}
                {f.id !== "all" && !loading && (
                  <span className="ml-1.5 opacity-60">
                    ({countByType(f.id)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat log aktivitas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Tidak ada log ditemukan</p>
              {dateFilter && (
                <p className="text-xs text-gray-400 mt-1">
                  Coba klik "Semua tanggal" untuk melihat semua log
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((log) => {
                const badge = getBadge(log.activity_type);
                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getBg(log.activity_type)}`}
                      >
                        {getIcon(log.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {log.activity_type}
                            </code>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-1.5">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{log.user_name ?? "Sistem"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">
              Menampilkan {filtered.length} dari {logs.length} log
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
