import { useState, useEffect } from "react";
import { Droplet, Mail, Lock, Eye, EyeOff, ShieldX } from "lucide-react";

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
  onSwitchToRegister: () => void;
  externalError?: string | null;
}

export function Login({
  onLogin,
  onSwitchToRegister,
  externalError,
}: LoginProps) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-700 to-cyan-600 p-14 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-72 h-72 bg-white rounded-full -top-20 -left-20" />
            <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32" />
          </div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl">
              <Droplet
                className="w-12 h-12 text-blue-600"
                fill="currentColor"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              ARROYYAN99
            </h1>
            <p className="text-cyan-100 text-lg leading-relaxed max-w-md">
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
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <p className="text-cyan-100">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-4 bg-white/10 border border-white/20 rounded-2xl">
              <p className="text-xs text-cyan-100 font-medium mb-1">
                🔐 Panel Admin
              </p>
              <p className="text-xs text-cyan-200 leading-relaxed">
                Halaman ini hanya untuk akun Admin pabrik. Distributor
                menggunakan aplikasi mobile terpisah.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Selamat Datang
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Silakan login untuk melanjutkan ke sistem.
              </p>
            </div>

            {externalError && (
              <div
                className={`mb-6 p-4 rounded-2xl border flex gap-3 ${
                  isAccessDenied
                    ? "bg-red-50 border-red-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <ShieldX
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isAccessDenied ? "text-red-500" : "text-orange-500"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      isAccessDenied ? "text-red-800" : "text-orange-800"
                    }`}
                  >
                    {isAccessDenied ? "Akses Ditolak" : "Login Gagal"}
                  </p>
                  <p
                    className={`text-sm ${
                      isAccessDenied ? "text-red-700" : "text-orange-700"
                    }`}
                  >
                    {externalError}
                  </p>
                  {isAccessDenied && (
                    <p className="text-xs text-red-500 mt-2">
                      💡 Distributor dapat login melalui aplikasi mobile
                      Arroyyan99.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email admin"
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                      errors.email
                        ? "border-red-300 focus:ring-2 focus:ring-red-400"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-2">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className={`w-full pl-12 pr-12 py-4 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                      errors.password
                        ? "border-red-300 focus:ring-2 focus:ring-red-400"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-2">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Ingat saya</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
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

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Daftarkan akun distributor baru?{" "}
                <button
                  onClick={onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <p className="text-xs text-blue-600">
                🔐 Panel ini khusus untuk Admin Pabrik Arroyyan99
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
