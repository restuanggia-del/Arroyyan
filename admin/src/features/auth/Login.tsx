import { useState, useEffect } from "react";
import {
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
  externalError?: string | null;
}

type View = "login" | "forgot" | "forgot_sent";

function BrandingPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#0249E1] via-[#1A5CE8] to-[#8FBBFA] p-14 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-72 h-72 bg-[#DAFB71] rounded-full -top-20 -left-20" />
        <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32" />
      </div>
      <div className="relative z-10 flex flex-col items-center lg:items-center">
        <div className="mb-5 rounded-[32px] bg-white p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.24),0_10px_25px_rgba(8,26,80,0.18)]">
          <img
            src="/logo-arroyyan.png"
            alt="Arroyyan logo"
            className="h-28 w-auto max-w-[260px] object-contain"
          />
        </div>
        <p className="text-white/80 text-lg leading-relaxed max-w-md text-center">
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
              <p className="text-white/85 font-medium">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
          <p className="text-xs text-white font-bold mb-1">Panel Admin</p>
          <p className="text-xs text-white/70 leading-relaxed">
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
        {/* Email */}
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

        {/* Password */}
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

          {/* ← Lupa password — sekarang berfungsi */}
          <button
            type="button"
            onClick={() => {
              setView("forgot");
              setForgotEmail(email);
              setForgotError("");
            }}
            className="text-sm text-[#0249E1] hover:text-[#023dbb] font-semibold cursor-pointer transition-colors"
          >
            Lupa password?
          </button>
        </div>

        {/* Submit */}
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

  const renderForgot = () => (
    <div className="w-full max-w-md">
      <button
        onClick={() => setView("login")}
        className="flex items-center gap-2 text-[#5b6a8f] hover:text-[#0249E1] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Kembali ke Login</span>
      </button>

      <div className="mb-8">
        <div className="w-14 h-14 clay-blue-soft rounded-2xl flex items-center justify-center mb-5">
          <Mail className="w-7 h-7 text-[#0249E1]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#10193a] mb-2">
          Lupa Password?
        </h2>
        <p className="text-[#5b6a8f] text-sm leading-relaxed">
          Masukkan email admin yang terdaftar. Kami akan mengirimkan link untuk
          membuat password baru.
        </p>
      </div>

      {forgotError && (
        <div className="mb-5 p-4 clay-inset-red border-0 rounded-2xl">
          <p className="text-sm text-[#ee3d5a] font-medium">{forgotError}</p>
        </div>
      )}

      <form onSubmit={handleForgotSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Email Admin
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa4d4]" />
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                setForgotError("");
              }}
              placeholder="Masukkan email admin"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 clay-inset focus:ring-2 focus:ring-[#0249E1]/40 outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={forgotLoading}
          className="w-full clay-blue clay-pressable text-white py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
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
      <div className="mt-6 p-4 clay-inset-sm border-0 rounded-2xl space-y-2">
        <p className="text-xs font-bold text-[#5b6a8f]">Catatan penting:</p>
        <ul className="text-xs text-[#5b6a8f] space-y-1">
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
      <div className="w-20 h-20 clay-green rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-3xl font-extrabold text-[#10193a] mb-3">
        Email Terkirim!
      </h2>
      <p className="text-[#5b6a8f] text-sm leading-relaxed mb-2">
        Link reset password telah dikirim ke:
      </p>
      <p className="text-[#023dbb] font-bold text-base mb-6 clay-blue-soft px-4 py-2 rounded-xl inline-block">
        {forgotEmail}
      </p>

      <div className="text-left p-4 clay-inset-amber border-0 rounded-2xl mb-8 space-y-2">
        <p className="text-sm font-bold text-[#8a5c07]">Langkah selanjutnya:</p>
        <ol className="text-sm text-[#8a5c07] space-y-1 list-decimal list-inside">
          <li>Buka email di inbox atau folder Spam/Junk</li>
          <li>
            Klik tombol <strong>"Reset Password"</strong> di email
          </li>
          <li>Buat password baru minimal 6 karakter</li>
          <li>Login kembali dengan password baru</li>
        </ol>
      </div>

      <p className="text-xs text-[#8fa4d4] mb-6">
        Link berlaku selama <strong>1 jam</strong>. Belum menerima email?
      </p>

      <div className="flex flex-col gap-3">
        {/* Kirim ulang */}
        <button
          onClick={() => {
            setView("forgot");
            setForgotError("");
          }}
          className="w-full clay-raised-sm clay-pressable border-0 text-[#0249E1] py-3 rounded-2xl font-bold transition-colors cursor-pointer"
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
          className="w-full clay-blue clay-pressable text-white py-3 rounded-2xl font-bold transition-all cursor-pointer"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0249E1] via-[#1A5CE8] to-[#8FBBFA] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl clay-raised-lg rounded-[36px] overflow-hidden grid grid-cols-1 lg:grid-cols-2">
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
