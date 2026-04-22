import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const dataBulanan = [
  { bulan: "Jan", penjualan: 4500000 },
  { bulan: "Feb", penjualan: 5200000 },
  { bulan: "Mar", penjualan: 4800000 },
  { bulan: "Apr", penjualan: 6100000 },
  { bulan: "Mei", penjualan: 7200000 },
  { bulan: "Jun", penjualan: 6800000 },
];

const dataHarian = [
  { hari: "Sen", penjualan: 180000 },
  { hari: "Sel", penjualan: 220000 },
  { hari: "Rab", penjualan: 195000 },
  { hari: "Kam", penjualan: 250000 },
  { hari: "Jum", penjualan: 310000 },
  { hari: "Sab", penjualan: 280000 },
  { hari: "Min", penjualan: 240000 },
];

export function DashboardChart() {
  const [activeTab, setActiveTab] = useState<"harian" | "bulanan">("harian");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Grafik Penjualan
        </h3>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("harian")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "harian"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setActiveTab("bulanan")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === "bulanan"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {activeTab === "harian" ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dataHarian}>
            <defs>
              <linearGradient id="colorHarian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hari" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number) =>
                `Rp ${value.toLocaleString("id-ID")}`
              }
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorHarian)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dataBulanan}>
            <defs>
              <linearGradient id="colorBulanan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number) =>
                `Rp ${value.toLocaleString("id-ID")}`
              }
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="penjualan"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorBulanan)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
