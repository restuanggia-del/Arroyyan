import { useState, useEffect } from "react";
import {
  Droplet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldX,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
  onSwitchToRegister: () => void;
  externalError?: string | null;
}

type View = "login" | "forgot" | "forgot_sent";

function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-700 to-cyan-600 p-14 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-72 h-72 bg-white rounded-full -top-20 -left-20" />
        <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32" />
      </div>
      <div className="relative z-10">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl">
          <Droplet className="w-12 h-12 text-blue-600" fill="currentColor" />
        </div>
        <h1 className="text-5xl font-bold mb-4 leading-tight">ARROYYAN99</h1>
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
          <p className="text-xs text-cyan-100 font-medium mb-1">Panel Admin</p>
          <p className="text-xs text-cyan-200 leading-relaxed">
            Halaman ini hanya untuk akun Admin pabrik. Distributor menggunakan
            aplikasi mobile terpisah.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Login({
  onLogin,
  onSwitchToRegister,
  externalError,
}: LoginProps) {
  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotError("Masukkan email yang valid.");
      return;
    }

    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setForgotError("Gagal mengirim email. Coba beberapa saat lagi.");
      } else {
        setView("forgot_sent");
      }
    } catch {
      setForgotError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  const isAccessDenied =
    externalError?.toLowerCase().includes("distributor") ||
    externalError?.toLowerCase().includes("tidak dapat masuk") ||
    externalError?.toLowerCase().includes("tidak memiliki akses");

  const renderLogin = () => (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          Selamat Datang
        </h2>
        <p className="text-gray-500">
          Silakan login untuk melanjutkan ke sistem.
        </p>
      </div>

      {/* Error banner */}
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
              className={`text-sm ${isAccessDenied ? "text-red-700" : "text-orange-700"}`}
            >
              {externalError}
            </p>
            {isAccessDenied && (
              <p className="text-xs text-red-500 mt-2">
                Distributor dapat login melalui aplikasi mobile Arroyyan99.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
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

        {/* Password */}
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
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Ingat saya</span>
          </label>

          {/* ← Lupa password — sekarang berfungsi */}
          <button
            type="button"
            onClick={() => {
              setView("forgot");
              setForgotEmail(email);
              setForgotError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            Lupa password?
          </button>
        </div>

        {/* Submit */}
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
          Panel ini khusus untuk Admin Pabrik Arroyyan99
        </p>
      </div>
    </div>
  );

  const renderForgot = () => (
    <div className="w-full max-w-md">
      <button
        onClick={() => setView("login")}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Kembali ke Login</span>
      </button>

      <div className="mb-8">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Lupa Password?
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Masukkan email admin yang terdaftar. Kami akan mengirimkan link untuk
          membuat password baru.
        </p>
      </div>

      {forgotError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700">{forgotError}</p>
        </div>
      )}

      <form onSubmit={handleForgotSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Admin
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                setForgotError("");
              }}
              placeholder="Masukkan email admin"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={forgotLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {forgotLoading ? (
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
              Mengirim Email...
            </>
          ) : (
            "Kirim Link Reset Password"
          )}
        </button>
      </form>

      {/* Info tambahan */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
        <p className="text-xs font-medium text-gray-600">Catatan penting:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>
            • Link reset akan dikirim ke email yang terdaftar sebagai admin
          </li>
          <li>
            • Link berlaku selama <strong>1 jam</strong> setelah dikirim
          </li>
          <li>
            • Periksa folder <strong>Spam/Junk</strong> jika email tidak muncul
          </li>
          <li>• Hanya email admin yang terdaftar yang dapat direset</li>
        </ul>
      </div>
    </div>
  );

  const renderForgotSent = () => (
    <div className="w-full max-w-md text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Terkirim!</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-2">
        Link reset password telah dikirim ke:
      </p>
      <p className="text-blue-600 font-semibold text-base mb-6 bg-blue-50 px-4 py-2 rounded-xl inline-block">
        {forgotEmail}
      </p>

      <div className="text-left p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-8 space-y-2">
        <p className="text-sm font-semibold text-amber-800">
          Langkah selanjutnya:
        </p>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Buka email di inbox atau folder Spam/Junk</li>
          <li>
            Klik tombol <strong>"Reset Password"</strong> di email
          </li>
          <li>Buat password baru minimal 6 karakter</li>
          <li>Login kembali dengan password baru</li>
        </ol>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Link berlaku selama <strong>1 jam</strong>. Belum menerima email?
      </p>

      <div className="flex flex-col gap-3">
        {/* Kirim ulang */}
        <button
          onClick={() => {
            setView("forgot");
            setForgotError("");
          }}
          className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-3 rounded-2xl font-semibold transition-colors cursor-pointer"
        >
          Kirim Ulang Email
        </button>

        {/* Kembali ke login */}
        <button
          onClick={() => {
            setView("login");
            setForgotEmail("");
            setForgotError("");
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-2xl font-semibold shadow-lg transition-all cursor-pointer"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <BrandingPanel />
        <div className="flex items-center justify-center p-8 md:p-14">
          {view === "login" && renderLogin()}
          {view === "forgot" && renderForgot()}
          {view === "forgot_sent" && renderForgotSent()}
        </div>
      </div>
    </div>
  );
}
