import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";
import {
  getDailySales,
  getMonthlySales,
  DailySales,
  MonthlySales,
} from "../../services/reportService";

export function DashboardChart() {
  const [activeTab, setActiveTab] = useState<"harian" | "bulanan">("harian");
  const [dailyData, setDailyData] = useState<DailySales[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [daily, monthly] = await Promise.all([
        getDailySales(),
        getMonthlySales(),
      ]);
      setDailyData(daily);
      setMonthlyData(monthly);
      setLoading(false);
    };
    load();
  }, []);

  const tooltipStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  };

  const formatRp = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Grafik Penjualan
        </h3>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(["harian", "bulanan"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Memuat grafik...</p>
          </div>
        </div>
      ) : activeTab === "harian" ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorHarian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hari" stroke="#9ca3af" />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={formatRp} contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorHarian)"
              name="Penjualan"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorBulanan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" stroke="#9ca3af" />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
            />
            <Tooltip formatter={formatRp} contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorBulanan)"
              name="Penjualan"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
