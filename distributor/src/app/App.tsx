import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import LoginPage from "./components/features/auth/LoginPage";
import MainApp from "./components/layout/MainApp";
import { checkSession, logoutSales, SalesUser } from "./services";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SalesUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await checkSession();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = (userData: SalesUser) => {
    setUser(userData);
    setIsAuthenticated(true);
    toast.success(`Selamat datang, ${userData.namaSales}!`);
  };

  const handleLogout = async () => {
    await logoutSales();
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logout berhasil");
  };

  const handleProfileUpdated = (updated: Partial<SalesUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0249E1] via-[#1A5CE8] to-[#8FBBFA]">
        <div className="w-16 h-16 rounded-[26px] flex items-center justify-center bg-gradient-to-br from-[#202b52] to-[#0c1330] shadow-[8px_8px_18px_rgba(4,8,26,0.45),-6px_-6px_14px_rgba(120,150,230,0.25)]">
          <Loader2 className="w-8 h-8 text-[#DAFB71] animate-spin" />
        </div>
        <p className="text-sm text-white/80">Memuat sesi...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <MainApp user={user!} onLogout={handleLogout} onProfileUpdated={handleProfileUpdated} />
      )}
    </>
  );
}
