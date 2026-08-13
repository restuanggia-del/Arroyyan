import { useState } from "react";
import { Droplet, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { loginSales, SalesUser } from "../services/SalesAppService";

interface LoginPageProps {
  onLogin: (user: SalesUser) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setError("");
    setLoading(true);

    const { data, error: loginError } = await loginSales(
      email.trim(),
      password,
    );
    if (loginError || !data) {
      setError(
        loginError?.message ?? "Login gagal. Periksa email dan password Anda.",
      );
      setLoading(false);
      return;
    }

    onLogin(data);
  };

  return (
    <div className="min-h-screen bg-[#0249E1] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0249E1] via-[#0249E1] to-[#80B0EC]" />
      <div className="absolute w-80 h-80 rounded-full bg-[#DAFB71]/20 blur-3xl -top-24 -right-16" />
      <div className="absolute w-64 h-64 rounded-full bg-white/10 blur-2xl -bottom-16 -left-16" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-[#111111] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/20 rotate-3">
            <Droplet className="w-8 h-8 text-[#DAFB71] fill-[#DAFB71]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            ARROYYAN99
          </h1>
          <p className="text-sm text-white/80 font-medium mt-0.5">
            Portal Sales
          </p>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl p-7">
          {error && (
            <div className="mb-5 p-3 bg-[#EE3D5A]/10 border border-[#EE3D5A]/25 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#EE3D5A] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#EE3D5A] font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111]/60 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-[#F4F7FE] border-2 border-transparent rounded-2xl text-sm font-medium text-[#111111] focus:outline-none focus:border-[#0249E1] focus:bg-white transition-colors"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111]/60 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-12 bg-[#F4F7FE] border-2 border-transparent rounded-2xl text-sm font-medium text-[#111111] focus:outline-none focus:border-[#0249E1] focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#111111]/40 hover:text-[#111111] cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white bg-[#111111] hover:bg-[#0249E1] shadow-lg shadow-black/10 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-white/70 text-center leading-relaxed mt-6 font-medium">
          Belum punya akun sales?
          <br />
          Hubungi administrator pabrik untuk pendaftaran.
        </p>
      </div>
    </div>
  );
}
