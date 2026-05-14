import { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getMonthlySales, MonthlySales } from "../../services/reportService";

export function SalesPrediction() {
  const [historicalData, setHistoricalData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(3);

  useEffect(() => {
    getMonthlySales().then((data) => {
      setHistoricalData(data);
      setLoading(false);
    });
  }, []);

  const calcMA = (data: MonthlySales[], n: number): number => {
    if (data.length < n) return 0;
    const slice = data.slice(-n);
    return Math.round(slice.reduce((s, d) => s + d.penjualan, 0) / n);
  };

  const predictedSales = calcMA(historicalData, period);

  const nextMonthLabel = (() => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${names[now.getMonth()]} ${now.getFullYear()}`;
  })();

  const chartData = [
    ...historicalData.map((d) => ({
      bulan: d.bulan,
      aktual: d.penjualan,
      prediksi: null as number | null,
    })),
    { bulan: nextMonthLabel, aktual: null, prediksi: predictedSales },
  ];

  const lastMonth = historicalData[historicalData.length - 1]?.penjualan ?? 0;
  const growth =
    lastMonth > 0
      ? (((predictedSales - lastMonth) / lastMonth) * 100).toFixed(1)
      : "0.0";
  const isPositive = parseFloat(growth) >= 0;

  const calcAccuracy = (): string => {
    if (historicalData.length < period + 1) return "—";
    let totalErr = 0,
      count = 0;
    for (let i = period; i < historicalData.length; i++) {
      const pred = calcMA(historicalData.slice(0, i), period);
      const actual = historicalData[i].penjualan;
      if (actual > 0) {
        totalErr += Math.abs(actual - pred) / actual;
        count++;
      }
    }
    return count > 0 ? ((1 - totalErr / count) * 100).toFixed(1) : "—";
  };

  const accuracy = calcAccuracy();
  const formatRp = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

  if (loading) {
    return (
      <div className="p-8 py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Memuat data penjualan...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Prediksi Penjualan
        </h1>
        <p className="text-gray-600">
          Prediksi menggunakan Moving Average dari data nyata
        </p>
      </div>

      {historicalData.every((d) => d.penjualan === 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          ⚠️ Belum ada data transaksi. Prediksi akan muncul setelah ada riwayat
          penjualan.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Grafik Penjualan & Prediksi
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Periode MA:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={2}>2 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={4}>4 Bulan</option>
                  <option value={6}>6 Bulan</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="bulan"
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
                />
                <Tooltip
                  formatter={(value: number) => (value ? formatRp(value) : "—")}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="aktual"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Penjualan Aktual"
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="prediksi"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Prediksi"
                  dot={{ r: 6, fill: "#f59e0b" }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Tentang Moving Average
              </p>
              <p className="text-sm text-blue-700">
                Menghitung rata-rata penjualan dari {period} bulan terakhir
                untuk memprediksi bulan berikutnya. Data diambil langsung dari
                transaksi nyata di sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Prediksi {nextMonthLabel}</h3>
            </div>
            <p className="text-3xl font-bold mb-2">
              {predictedSales > 0 ? formatRp(predictedSales) : "Belum ada data"}
            </p>
            {predictedSales > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isPositive ? "bg-green-500/30" : "bg-red-500/30"
                  }`}
                >
                  {isPositive ? "↑" : "↓"} {growth}%
                </span>
                <span className="text-sm opacity-90">dari bulan lalu</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Metrik Akurasi</h3>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Tingkat Akurasi</span>
              <span className="text-lg font-bold text-blue-600">
                {accuracy === "—" ? "—" : `${accuracy}%`}
              </span>
            </div>
            {accuracy !== "—" && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            )}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <p className="text-xs text-gray-500">Periode Moving Average</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                {period} Bulan
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Data {period} Bulan Terakhir
              </h3>
            </div>
            <div className="space-y-2">
              {historicalData.slice(-period).map((item) => (
                <div
                  key={item.bulan}
                  className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">{item.bulan}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.penjualan > 0
                      ? `Rp ${(item.penjualan / 1_000_000).toFixed(2)}jt`
                      : "Rp 0"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Statistik</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rata-rata {period} Bulan</span>
                <span className="font-semibold">
                  {predictedSales > 0
                    ? `Rp ${(predictedSales / 1_000_000).toFixed(2)}jt`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tertinggi</span>
                <span className="font-semibold text-green-600">
                  {historicalData.length > 0
                    ? `Rp ${(Math.max(...historicalData.map((d) => d.penjualan)) / 1_000_000).toFixed(2)}jt`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Terendah</span>
                <span className="font-semibold text-orange-600">
                  {historicalData.length > 0
                    ? `Rp ${(Math.min(...historicalData.map((d) => d.penjualan)) / 1_000_000).toFixed(2)}jt`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
