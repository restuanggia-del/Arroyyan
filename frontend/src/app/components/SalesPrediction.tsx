import { useState } from "react";
import { TrendingUp, Calendar, DollarSign, Activity, Info } from "lucide-react";
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

interface SalesHistory {
  month: string;
  sales: number;
}

const historicalData: SalesHistory[] = [
  { month: "Jan 2026", sales: 4500000 },
  { month: "Feb 2026", sales: 5200000 },
  { month: "Mar 2026", sales: 4800000 },
  { month: "Apr 2026", sales: 6100000 },
  { month: "Mei 2026", sales: 7200000 },
  { month: "Jun 2026", sales: 6800000 },
];

export function SalesPrediction() {
  const [period, setPeriod] = useState(3); // Moving Average period

  // Calculate Moving Average
  const calculateMovingAverage = (data: SalesHistory[], n: number): number => {
    if (data.length < n) return 0;
    const lastNMonths = data.slice(-n);
    const sum = lastNMonths.reduce((acc, curr) => acc + curr.sales, 0);
    return Math.round(sum / n);
  };

  const predictedSales = calculateMovingAverage(historicalData, period);

  // Prepare data for chart
  const chartData = [
    ...historicalData.map((item) => ({
      month: item.month,
      actual: item.sales,
      predicted: null,
    })),
    {
      month: "Jul 2026",
      actual: null,
      predicted: predictedSales,
    },
  ];

  // Calculate growth percentage
  const lastMonthSales = historicalData[historicalData.length - 1].sales;
  const growthPercentage = (
    ((predictedSales - lastMonthSales) / lastMonthSales) *
    100
  ).toFixed(1);
  const isPositiveGrowth = parseFloat(growthPercentage) > 0;

  // Calculate accuracy metrics
  const calculateAccuracy = () => {
    if (historicalData.length < period + 1) return 0;

    let totalError = 0;
    let validPredictions = 0;

    for (let i = period; i < historicalData.length; i++) {
      const historicalSlice = historicalData.slice(i - period, i);
      const prediction = calculateMovingAverage(historicalSlice, period);
      const actual = historicalData[i].sales;
      const error = Math.abs(actual - prediction) / actual;
      totalError += error;
      validPredictions++;
    }

    const accuracy =
      validPredictions > 0 ? (1 - totalError / validPredictions) * 100 : 0;
    return accuracy.toFixed(1);
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Prediksi Penjualan
        </h1>
        <p className="text-gray-600">
          Prediksi penjualan menggunakan metode Moving Average
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Grafik Penjualan & Prediksi
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Periode MA:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={4}>4 Bulan</option>
                  <option value={6}>6 Bulan</option>
                </select>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  formatter={(value: number) =>
                    value ? `Rp ${value.toLocaleString("id-ID")}` : "-"
                  }
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Penjualan Aktual"
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Tentang Moving Average
                </h3>
                <p className="text-sm text-blue-700">
                  Moving Average (MA) menghitung rata-rata penjualan dari{" "}
                  {period} bulan terakhir untuk memprediksi penjualan periode
                  berikutnya. Metode ini cocok untuk data yang relatif stabil
                  dan membantu menghaluskan fluktuasi jangka pendek.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Prediksi Bulan Depan</h3>
            </div>
            <p className="text-3xl font-bold mb-2">
              Rp {predictedSales.toLocaleString("id-ID")}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPositiveGrowth ? "bg-green-500/30" : "bg-red-500/30"
                }`}
              >
                {isPositiveGrowth ? "↑" : "↓"} {growthPercentage}%
              </span>
              <span className="text-sm opacity-90">dari bulan lalu</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Metrik Akurasi</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Tingkat Akurasi</span>
                  <span className="text-lg font-bold text-blue-600">
                    {accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">
                  Periode Moving Average
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {period} Bulan
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Data Historis</h3>
            </div>
            <div className="space-y-2">
              {historicalData.slice(-period).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Rp {(item.sales / 1000000).toFixed(1)}jt
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Ringkasan Statistik
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Rata-rata {period} Bulan
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Rp {(predictedSales / 1000000).toFixed(1)}jt
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Penjualan Tertinggi
                </span>
                <span className="text-sm font-semibold text-green-600">
                  Rp{" "}
                  {(
                    Math.max(...historicalData.map((d) => d.sales)) / 1000000
                  ).toFixed(1)}
                  jt
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Penjualan Terendah
                </span>
                <span className="text-sm font-semibold text-orange-600">
                  Rp{" "}
                  {(
                    Math.min(...historicalData.map((d) => d.sales)) / 1000000
                  ).toFixed(1)}
                  jt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
