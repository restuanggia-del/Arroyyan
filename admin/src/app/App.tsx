import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  RefreshCw,
} from "lucide-react";
import { Logo } from "../components/shared/Logo";
import { SearchBar } from "../components/shared/SearchBar";
import { UserProfile } from "../features/pengaturan/UserProfile";
import { Sidebar } from "./layouts/Sidebar";
import { StatCard } from "../components/shared/StatCard";
import { DashboardChart } from "../components/shared/DashboardChart";
import { TopProducts } from "../components/shared/TopProducts";
import { StockAlert } from "../components/shared/StockAlert";
import { Calendar } from "../components/shared/Calendar";
import { ProductManagement } from "../features/manajemen/produk/ProductManagement";
import { StockManagement } from "../features/manajemen/stok/StockManagement";
import { MaterialManagement } from "../features/manajemen/bahan/MaterialManagement";
import { DistributionManagement } from "../features/distribusi/DistributionManagement";
import { KaryawanManagement } from "../features/manajemen/distributor-karyawan/KaryawanManagement";
import { SalesManagement } from "../features/manajemen/sales/SalesManagement";
import { SalesTransaction } from "../features/transaksi/transaksi-penjualan/SalesTransaction";
import { TransaksiTitipan } from "../features/transaksi/transaksi-titipan/TransaksiTitipan";
import { PotonganSetoranManagement } from "../features/potongan-setoran/PotonganSetoranManagement";
import { BonusManagement } from "../features/bonus/BonusManagement";
import { HandlingFeeManagement } from "../features/handling-fee/HandlingFeeManagement";
import { InsentifProduksiManagement } from "../features/insentif/InsentifProduksiManagement";
import { FeeRekapanManagement } from "../features/fee-rekapan/FeeRekapanManagement";
import { LaporanBonus } from "../features/laporan/bonus/LaporanBonus";
import { LaporanHandlingFee } from "../features/laporan/handling-fee/LaporanHandlingFee";
import { LaporanInsentif } from "../features/laporan/insentif/LaporanInsentif";
import { LaporanSales } from "../features/laporan/sales/LaporanSales";
import { LaporanTandaTerimaInsentif } from "../features/laporan/tanda-terima-insentif/LaporanTandaTerimaInsentif";
import { LaporanGlobal } from "../features/laporan/global/LaporanGlobal";
import { CustomerManagement } from "../features/manajemen/customer/CustomerManagement";
import { Reports } from "../features/laporan/penjualan/Reports";
import { SalesPrediction } from "../features/laporan/sales/SalesPrediction";
import { AuditLog } from "../features/pengaturan/AuditLog";
import { SystemSettings } from "../features/pengaturan/SystemSettings";
import { Login } from "../features/auth/Login";
import { toast } from "sonner";
import {
  loginUser,
  getCurrentUserRole,
  assertAdminAccess,
} from "../services/authService";
import {
  getDashboardStats,
  getMonthlySales,
  DashboardStats,
} from "../services/reportService";
import { supabase } from "../lib/supabase";

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

const getMenuFromPath = (pathname: string): string => {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  return slug || "dashboard";
};

const getPathFromMenu = (menuId: string): string => {
  return menuId === "dashboard" ? "/" : `/${menuId}`;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    return getMenuFromPath(window.location.pathname);
  });

  const [loginError, setLoginError] = useState<string | null>(null);

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
        if (userData && userData.role === "admin") {
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } else {
          await supabase.auth.signOut();
        }
      }

      setAuthReady(true);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeMenu === "dashboard") fetchDashboardData();
  }, [isAuthenticated, activeMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextPath = getPathFromMenu(activeMenu);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
  }, [activeMenu]);

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
      setPrediction({
        value: predicted,
        months: lastThree.map((m) => ({ label: m.bulan, value: m.penjualan })),
        nextMonth: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      });
    } catch (e) {
      console.error("Gagal fetch dashboard:", e);
    }
    setDashLoading(false);
  };

  const handleLogin = async (email: string, password: string, _: boolean) => {
    setLoginError(null);

    const result = await loginUser(email, password);
    if (result.error) {
      const message = "Email atau password salah. Silakan coba lagi.";
      setLoginError(message);
      toast.error("Login Gagal", { description: message });
      return;
    }

    const userData = await getCurrentUserRole();
    if (!userData) {
      await supabase.auth.signOut();
      const message = "Gagal mendapatkan data akun. Hubungi administrator.";
      setLoginError(message);
      toast.error("Login Gagal", { description: message });
      return;
    }

    const access = assertAdminAccess(userData);
    if (!access.allowed) {
      await supabase.auth.signOut();
      setLoginError(access.message);
      toast.error("Akses Ditolak", {
        description: access.message ?? undefined,
      });
      return;
    }

    setCurrentUser(userData);
    setIsAuthenticated(true);
    setLoginError(null);
    toast.success("Login Berhasil", {
      description: `Selamat datang kembali, ${userData.name}!`,
    });
  };

  const handleMenuChange = (menuId: string) => {
    setActiveMenu(menuId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthReady(true);
    setCurrentUser(null);
    setActiveMenu("dashboard");
    setDashStats(null);
    setPrediction(null);
    setLoginError(null);
  };

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} externalError={loginError} />;
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "karyawan":
        return <KaryawanManagement />;
      case "sales":
        return <SalesManagement />;
      case "produk":
        return <ProductManagement />;
      case "stok":
        return <StockManagement />;
      case "bahan":
        return <MaterialManagement />;
      case "distribusi":
        return <DistributionManagement currentUserId={currentUser?.id ?? ""} />;
      case "transaksi":
        return <SalesTransaction role="admin" />;
      case "titipan":
        return <TransaksiTitipan />;
      case "potongan-setoran":
        return (
          <PotonganSetoranManagement currentUserId={currentUser?.id ?? ""} />
        );
      case "bonus":
        return <BonusManagement />;
      case "handling-fee":
        return <HandlingFeeManagement />;
      case "insentif":
        return <InsentifProduksiManagement />;
      case "fee-rekapan":
        return <FeeRekapanManagement />;
      case "pelanggan":
        return <CustomerManagement />;
      case "laporan":
        return <Reports />;
      case "laporan-bonus":
        return <LaporanBonus />;
      case "laporan-handling-fee":
        return <LaporanHandlingFee />;
      case "laporan-insentif":
        return <LaporanInsentif />;
      case "laporan-sales":
        return <LaporanSales />;
      case "laporan-tanda-terima-insentif":
        return <LaporanTandaTerimaInsentif />;
      case "laporan-global":
        return <LaporanGlobal />;
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
        <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <SearchBar onNavigate={handleMenuChange} />
            <UserProfile
              name={currentUser?.name ?? "User"}
              role="Admin"
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
