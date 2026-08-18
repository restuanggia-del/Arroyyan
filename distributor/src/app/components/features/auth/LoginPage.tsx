import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { loginSales, SalesUser } from "../../../services";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-white via-[#EAF4FE] to-[#BFE3FB]">
      <div className="absolute w-80 h-80 rounded-full bg-[#DAFB71]/25 blur-3xl -top-24 -right-16" />
      <div className="absolute w-64 h-64 rounded-full bg-[#0249E1]/8 blur-2xl -bottom-16 -left-16" />
      <div className="absolute w-40 h-40 rounded-full bg-[#80B0EC]/20 blur-2xl top-1/3 -left-10" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-7">
          <img
            src="/logo-arroyyan.png"
            alt="Arroyyan99"
            className="w-36 h-36 mx-auto mb-1 object-contain drop-shadow-[0_10px_18px_rgba(2,73,225,0.3)]"
          />
          <p className="text-sm text-[#111111]/55 font-medium mt-0.5">
            Portal Sales
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-[#eef5ff] rounded-[32px] p-7 shadow-[10px_10px_26px_rgba(2,73,225,0.18),-8px_-8px_20px_rgba(255,255,255,0.9)]">
          {error && (
            <div className="mb-5 p-3 clay-inset-sm rounded-2xl flex items-start gap-2">
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
                className="w-full px-4 py-3.5 clay-inset rounded-2xl text-sm font-medium text-[#111111] border-0 focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 transition-all"
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
                  className="w-full px-4 py-3.5 pr-12 clay-inset rounded-2xl text-sm font-medium text-[#111111] border-0 focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 transition-all"
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
              className="clay-pressable w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-br from-[#4a86f4] to-[#0249e1] shadow-[8px_8px_18px_rgba(2,55,150,0.4),-6px_-6px_14px_rgba(150,195,255,0.35)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
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

        <p className="text-xs text-[#111111]/45 text-center leading-relaxed mt-6 font-medium">
          Belum punya akun sales?
          <br />
          Hubungi administrator pabrik untuk pendaftaran.
        </p>
      </div>
    </div>
  );
}
