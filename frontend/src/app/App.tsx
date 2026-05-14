import { useState, useEffect } from "react";
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
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  RefreshCw,
} from "lucide-react";
import { DistributionManagement } from "./components/DistributionManagement";
import { DistributorManagement } from "./components/DistributorManagement";
import { SalesTransaction } from "./components/SalesTransaction";
import { CustomerManagement } from "./components/CustomerManagement";
import { Reports } from "./components/Reports";
import { SalesPrediction } from "./components/SalesPrediction";
import { AuditLog } from "./components/AuditLog";
import { SystemSettings } from "./components/SystemSettings";
import { Register, RegisterData } from "./components/Register";
import { Login } from "./components/Login";
import {
  loginUser,
  getCurrentUserRole,
  registerDistributor,
} from "../services/authService";
import { getPendingDistributors } from "../services/distributorService";
import {
  getDashboardStats,
  getMonthlySales,
  DashboardStats,
} from "../services/reportService";
import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const calcMA = (values: number[], n: number): number => {
  if (values.length < n) return 0;
  const slice = values.slice(-n);
  return Math.round(slice.reduce((s, v) => s + v, 0) / n);
};

const formatRp = (n: number): string => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [distributorId, setDistributorId] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [pendingDistributorCount, setPendingDistributorCount] = useState(0);

  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    value: number;
    months: { label: string; value: number }[];
    nextMonth: string;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const userData = await getCurrentUserRole();
        if (userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          if (userData.role === "distributor")
            await fetchDistributorId(userData.id);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === "admin") {
      fetchPendingCount();
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && activeMenu === "dashboard") {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeMenu]);

  const fetchPendingCount = async () => {
    const { data } = await getPendingDistributors();
    if (data) setPendingDistributorCount(data.length);
  };

  const fetchDistributorId = async (userId: string) => {
    const { data } = await supabaseAdmin
      .from("distributors")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (data) setDistributorId(data.id);
  };

  const fetchDashboardData = async () => {
    setDashLoading(true);
    try {
      const [stats, monthly] = await Promise.all([
        getDashboardStats(),
        getMonthlySales(),
      ]);
      setDashStats(stats);

      const values = monthly.map((m) => m.penjualan);
      const predicted = calcMA(values, 3);
      const lastThree = monthly.slice(-3);

      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      const monthNames = [
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
      const nextMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      setPrediction({
        value: predicted,
        months: lastThree.map((m) => ({ label: m.bulan, value: m.penjualan })),
        nextMonth,
      });
    } catch (e) {
      console.error("Gagal fetch dashboard data:", e);
    }
    setDashLoading(false);
  };

  const handleLogin = async (email: string, password: string, _: boolean) => {
    const result = await loginUser(email, password);
    if (result.error) {
      alert("Login gagal: " + result.error.message);
      return;
    }

    const userData = await getCurrentUserRole();
    if (!userData) {
      alert("Gagal mendapatkan data user");
      return;
    }

    if (userData.role === "distributor" && !userData.is_approved) {
      alert("Akun belum disetujui admin. Silakan hubungi admin.");
      await supabase.auth.signOut();
      return;
    }

    setCurrentUser(userData);
    setIsAuthenticated(true);
    if (userData.role === "distributor") await fetchDistributorId(userData.id);
  };

  const handleRegister = async (data: RegisterData) => {
    const result = await registerDistributor(data);
    if (result.error) {
      alert("Register gagal: " + result.error.message);
      return;
    }
    alert("Pendaftaran berhasil! Silakan tunggu persetujuan admin.");
    setAuthView("login");
  };

  const handleMenuChange = (menuId: string) => {
    setActiveMenu(menuId);
    if (menuId === "distributor") fetchPendingCount();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDistributorId("");
    setAuthView("login");
    setActiveMenu("dashboard");
    setPendingDistributorCount(0);
    setDashStats(null);
    setPrediction(null);
  };

  if (!isAuthenticated) {
    return authView === "login" ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView("register")}
      />
    ) : (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthView("login")}
      />
    );
  }

  const userRole = currentUser?.role as "admin" | "distributor";

  const renderDashboard = () => (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600">
            Selamat datang kembali, {currentUser?.name}! Berikut ringkasan
            bisnis Anda hari ini.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={dashLoading}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${dashLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Penjualan Hari Ini"
          value={dashStats ? formatRp(dashStats.salesToday) : "—"}
          icon={DollarSign}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          loading={dashLoading}
        />
        <StatCard
          title="Penjualan Bulan Ini"
          value={dashStats ? formatRp(dashStats.salesThisMonth) : "—"}
          icon={TrendingUp}
          color="bg-gradient-to-br from-green-500 to-green-600"
          loading={dashLoading}
        />
        <StatCard
          title="Transaksi Hari Ini"
          value={
            dashStats ? `${dashStats.totalTransactionsToday} Transaksi` : "—"
          }
          icon={ShoppingCart}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          loading={dashLoading}
        />
        <StatCard
          title="Transaksi Bulan Ini"
          value={
            dashStats ? `${dashStats.totalTransactionsMonth} Transaksi` : "—"
          }
          icon={Package}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          loading={dashLoading}
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
              Prediksi Penjualan (Moving Average 3 Bulan)
            </h3>

            {dashLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ) : prediction && prediction.value > 0 ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Prediksi {prediction.nextMonth}
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatRp(prediction.value)}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Berdasarkan rata-rata 3 bulan terakhir dari data transaksi
                    nyata
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {prediction.months.map((m) => (
                    <div
                      key={m.label}
                      className="text-center p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {m.value > 0 ? formatRp(m.value) : "Rp 0"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
                <TrendingUp className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-700">
                  Belum ada data transaksi
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Prediksi akan muncul setelah ada riwayat penjualan
                </p>
              </div>
            )}
          </div>
        </div>
        <div>
          <StockAlert />
        </div>
      </div>

      {/* Kalender */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "distributor":
        return <DistributorManagement />;
      case "produk":
        return <ProductManagement />;
      case "stok":
        return <StockManagement />;
      case "distribusi":
        return <DistributionManagement currentUserId={currentUser?.id ?? ""} />;
      case "transaksi":
        return (
          <SalesTransaction
            role={userRole}
            distributorId={distributorId || undefined}
          />
        );
      case "pelanggan":
        return <CustomerManagement />;
      case "laporan":
        return <Reports />;
      case "prediksi":
        return <SalesPrediction />;
      case "log":
        return <AuditLog />;
      case "pengaturan":
        return <SystemSettings />;
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col">
        <Logo />
        <Sidebar
          activeMenu={activeMenu}
          onMenuChange={handleMenuChange}
          pendingDistributorCount={pendingDistributorCount}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <SearchBar />
            <UserProfile
              name={currentUser?.name ?? "User"}
              role={userRole === "admin" ? "Admin" : "Distributor"}
              onSettings={() => setActiveMenu("pengaturan")}
              onLogout={handleLogout}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
