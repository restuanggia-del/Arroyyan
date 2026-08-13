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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-700 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute w-72 h-72 rounded-full bg-white/5 -top-20 -right-20" />
      <div className="absolute w-48 h-48 rounded-full bg-white/5 -bottom-12 -left-12" />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/30">
            <Droplet className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-blue-900 to-cyan-600 bg-clip-text text-transparent">
            ARROYYAN99
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Portal Sales</p>
          <p className="text-xs text-gray-400">
            Bogatama, Tulang Bawang, Lampung
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-br from-blue-900 to-cyan-600 shadow-lg shadow-cyan-500/30 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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

        <p className="text-xs text-gray-400 text-center leading-relaxed mt-6">
          Belum punya akun sales?
          <br />
          Hubungi administrator pabrik untuk pendaftaran.
        </p>
      </div>
    </div>
  );
}
