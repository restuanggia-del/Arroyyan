import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldX } from "lucide-react";
import { ForgotPassword } from "./ForgotPassword";

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
  externalError?: string | null;
}

type View = "login" | "forgot";

function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#eaf3ff] via-[#dce9fd] to-[#bdd8fb] p-14 text-[#10193a] relative overflow-hidden">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute w-72 h-72 bg-[#DAFB71] rounded-full -top-20 -left-20 blur-2xl" />
        <div className="absolute w-96 h-96 bg-[#8FBBFA] rounded-full -bottom-32 -right-32 blur-2xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center lg:items-center">
        <img
          src="/logo-arroyyan.png"
          alt="Arroyyan logo"
          className="h-32 w-auto max-w-[300px] object-contain mb-5 drop-shadow-[0_8px_20px_rgba(2,73,225,0.25)]"
        />
        <p className="text-[#2c3a63] text-lg leading-relaxed max-w-md text-center font-medium">
          Sistem Point of Sales & Distribusi Air Minum Dalam Kemasan modern
          untuk membantu pengelolaan bisnis lebih cepat dan efisien.
        </p>
        <div className="mt-12 space-y-4">
          {[
            "Manajemen Distribusi",
            "Sistem Point Of Sales",
            "Monitoring Penjualan",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#0249E1]" />
              <p className="text-[#10193a]/80 font-semibold">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 p-4 clay-raised-sm border-0 rounded-2xl">
          <p className="text-xs text-[#0249E1] font-bold mb-1">Panel Admin</p>
          <p className="text-xs text-[#5b6a8f] leading-relaxed">
            Halaman ini hanya untuk akun Admin pabrik. Distributor menggunakan
            aplikasi mobile terpisah.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Login({ onLogin, externalError }: LoginProps) {
  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (externalError) setIsLoading(false);
  }, [externalError]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };
    if (!email) {
      newErrors.email = "Email wajib diisi";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format email tidak valid";
      isValid = false;
    }
    if (!password) {
      newErrors.password = "Password wajib diisi";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      onLogin(email, password, rememberMe);
    }
  };

  const isAccessDenied =
    externalError?.toLowerCase().includes("distributor") ||
    externalError?.toLowerCase().includes("tidak dapat masuk") ||
    externalError?.toLowerCase().includes("tidak memiliki akses");

  const renderLogin = () => (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-[#10193a] mb-3">
          Selamat Datang
        </h2>
        <p className="text-[#5b6a8f]">
          Silakan login untuk melanjutkan ke sistem.
        </p>
      </div>

      {/* Error banner */}
      {externalError && (
        <div
          className={`mb-6 p-4 rounded-2xl border-0 flex gap-3 ${
            isAccessDenied ? "clay-inset-red" : "clay-inset-amber"
          }`}
        >
          <ShieldX
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isAccessDenied ? "text-[#ee3d5a]" : "text-[#e08e0a]"
            }`}
          />
          <div>
            <p
              className={`text-sm font-bold mb-1 ${
                isAccessDenied ? "text-[#c81f3d]" : "text-[#8a5c07]"
              }`}
            >
              {isAccessDenied ? "Akses Ditolak" : "Login Gagal"}
            </p>
            <p
              className={`text-sm ${isAccessDenied ? "text-[#c81f3d]" : "text-[#8a5c07]"}`}
            >
              {externalError}
            </p>
            {isAccessDenied && (
              <p className="text-xs text-[#c81f3d]/80 mt-2">
                Distributor dapat login melalui aplikasi mobile Arroyyan99.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa4d4]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email admin"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-0 clay-inset outline-none transition-all ${
                errors.email
                  ? "ring-2 ring-red-400"
                  : "focus:ring-2 focus:ring-[#0249E1]/40"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-2">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa4d4]" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className={`w-full pl-12 pr-12 py-4 rounded-2xl border-0 clay-inset outline-none transition-all ${
                errors.password
                  ? "ring-2 ring-red-400"
                  : "focus:ring-2 focus:ring-[#0249E1]/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa4d4] hover:text-[#10193a]"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 cursor-pointer" />
              ) : (
                <Eye className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-2">{errors.password}</p>
          )}
        </div>

        {/* Remember me + Lupa password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#0249E1] focus:ring-[#0249E1]/40"
            />
            <span className="text-sm text-[#5b6a8f] font-medium">
              Ingat saya
            </span>
          </label>

          <button
            type="button"
            onClick={() => setView("forgot")}
            className="text-sm text-[#0249E1] hover:text-[#023dbb] font-semibold cursor-pointer transition-colors"
          >
            Lupa password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full clay-blue clay-pressable text-white py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Memverifikasi...
            </>
          ) : (
            "Masuk"
          )}
        </button>
      </form>

      <div className="mt-6 p-3 clay-blue-soft rounded-xl text-center">
        <p className="text-xs text-[#023dbb] font-semibold">
          Panel ini khusus untuk Admin Pabrik Arroyyan99
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf3ff] via-[#dbe9fd] to-[#c3ddfb] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl clay-raised-lg rounded-[36px] overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <BrandingPanel />
        <div className="flex items-center justify-center p-8 md:p-14">
          {view === "login" ? (
            renderLogin()
          ) : (
            <ForgotPassword
              initialEmail={email}
              onBack={() => setView("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
