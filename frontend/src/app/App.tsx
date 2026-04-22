import { useState } from "react";
import { Logo } from "./components/Logo";
import { SearchBar } from "./components/SearchBar";
import { UserProfile } from "./components/UserProfile";
import { Sidebar } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { DashboardChart } from "./components/DashboardChart";
import { TopProducts } from "./components/TopProducts";
import { StockAlert } from "./components/StockAlert";
import { Calendar } from "./components/Calendar";
import { ProductManagement } from "./components/ProductManagement";
import { StockManagement } from "./components/StockManagement";
import { DollarSign, TrendingUp, ShoppingCart, Package } from "lucide-react";
import { DistributionManagement } from "./components/DistributionManagement";
import { SalesTransaction } from "./components/SalesTransaction";

export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const renderContent = () => {
    switch (activeMenu) {
      case "produk":
        return <ProductManagement />;
      case "stok":
        return <StockManagement />;
      case "distribusi":
        return <DistributionManagement />;
      case "transaksi":
        return <SalesTransaction />;
      case "dashboard":
      default:
        return (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Selamat datang kembali! Berikut ringkasan bisnis Anda hari ini.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Penjualan Hari Ini"
                value="Rp 2.450.000"
                icon={DollarSign}
                trend={{ value: "+12.5%", isPositive: true }}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Penjualan Bulan Ini"
                value="Rp 45.200.000"
                icon={TrendingUp}
                trend={{ value: "+8.2%", isPositive: true }}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatCard
                title="Total Transaksi"
                value="156"
                icon={ShoppingCart}
                trend={{ value: "+5.1%", isPositive: true }}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                title="Produk Terjual"
                value="1.234 Unit"
                icon={Package}
                trend={{ value: "-2.3%", isPositive: false }}
                color="bg-gradient-to-br from-orange-500 to-orange-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <DashboardChart />
              </div>
              <div>
                <TopProducts />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Prediksi Penjualan (Moving Average)
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Prediksi Bulan Depan
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          Rp 7.850.000
                        </p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Berdasarkan rata-rata pergerakan 3 bulan terakhir,
                      prediksi penjualan bulan Juli 2026 diperkirakan mencapai
                      Rp 7.850.000
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">3 Bulan Lalu</p>
                      <p className="font-semibold text-gray-900">Rp 6.1M</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">2 Bulan Lalu</p>
                      <p className="font-semibold text-gray-900">Rp 7.2M</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Bulan Lalu</p>
                      <p className="font-semibold text-gray-900">Rp 6.8M</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <StockAlert />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Calendar />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col">
        <Logo />
        <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <SearchBar />
            <UserProfile name="Restu Anggia" role="Admin" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
