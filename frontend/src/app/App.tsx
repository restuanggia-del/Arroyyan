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
import { DollarSign, TrendingUp, ShoppingCart, Package } from "lucide-react";
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
import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [currentUser, setCurrentUser] = useState<any>(null);
  // distributorId = UUID dari tabel distributors (berbeda dari users.id)
  const [distributorId, setDistributorId] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [pendingDistributorCount, setPendingDistributorCount] = useState(0);

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
          if (userData.role === "distributor") {
            await fetchDistributorId(userData.id);
          }
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

  const fetchPendingCount = async () => {
    const { data } = await getPendingDistributors();
    if (data) setPendingDistributorCount(data.length);
  };

  // Ambil distributor.id (UUID tabel distributors) dari users.id
  const fetchDistributorId = async (userId: string) => {
    const { data } = await supabaseAdmin
      .from("distributors")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (data) setDistributorId(data.id);
  };

  const handleLogin = async (
    email: string,
    password: string,
    _rememberMe: boolean,
  ) => {
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

    if (userData.role === "distributor") {
      await fetchDistributorId(userData.id);
    }
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

  // distributorId untuk dipakai di komponen yang butuh
  // Untuk admin: distributorId kosong, komponen tetap bisa render tapi
  // transaksi sebaiknya dilakukan oleh distributor
  const activeDistributorId = distributorId;

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
        return activeDistributorId ? (
          <SalesTransaction distributorId={activeDistributorId} />
        ) : (
          <div className="p-8">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Transaksi Penjualan
              </h2>
              <p className="text-gray-600 text-sm">
                Fitur transaksi penjualan hanya tersedia untuk akun distributor.
                Distributor dapat login dan melakukan transaksi dari akun
                mereka.
              </p>
            </div>
          </div>
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
        return (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Selamat datang kembali, {currentUser?.name}! Berikut ringkasan
                bisnis Anda hari ini.
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
                      Berdasarkan rata-rata pergerakan 3 bulan terakhir
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      ["3 Bulan Lalu", "Rp 6.1M"],
                      ["2 Bulan Lalu", "Rp 7.2M"],
                      ["Bulan Lalu", "Rp 6.8M"],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="text-center p-3 bg-gray-50 rounded-lg"
                      >
                        <p className="text-xs text-gray-600 mb-1">{label}</p>
                        <p className="font-semibold text-gray-900">{val}</p>
                      </div>
                    ))}
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
              role={currentUser?.role === "admin" ? "Admin" : "Distributor"}
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
