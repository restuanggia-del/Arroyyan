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
    backgroundColor: "#f3f8ff",
    border: "none",
    borderRadius: "14px",
    boxShadow: "6px 6px 14px rgba(163,190,225,0.45), -6px -6px 14px rgba(255,255,255,0.9)",
  };

  const formatRp = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

  return (
    <div className="clay-raised rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#10193a]">
          Grafik Penjualan
        </h3>
        <div className="flex gap-1 clay-inset-sm p-1 rounded-xl">
          {(["harian", "bulanan"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "clay-raised-sm text-[#0249E1]"
                  : "text-[#5b6a8f] hover:text-[#10193a]"
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
            <RefreshCw className="w-8 h-8 animate-spin text-[#8fa4d4] mx-auto mb-2" />
            <p className="text-sm text-[#8fa4d4]">Memuat grafik...</p>
          </div>
        </div>
      ) : activeTab === "harian" ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorHarian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0249e1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0249e1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,172,214,0.25)" />
            <XAxis dataKey="hari" stroke="#8fa4d4" />
            <YAxis
              stroke="#8fa4d4"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={formatRp} contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#0249e1"
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
                <stop offset="5%" stopColor="#5c92f2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5c92f2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,172,214,0.25)" />
            <XAxis dataKey="bulan" stroke="#8fa4d4" />
            <YAxis
              stroke="#8fa4d4"
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
            />
            <Tooltip formatter={formatRp} contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#5c92f2"
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
