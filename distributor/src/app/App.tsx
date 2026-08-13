import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import LoginPage from "./components/LoginPage";
import MainApp from "./components/MainApp";
import { checkSession, logoutSales, SalesUser } from "./services/SalesAppService";

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
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-900 to-cyan-600">
        <Loader2 className="w-9 h-9 text-white animate-spin" />
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
