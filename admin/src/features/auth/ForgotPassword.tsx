import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ForgotPasswordProps {
  initialEmail: string;
  onBack: () => void;
}

type SubView = "form" | "sent";

export function ForgotPassword({ initialEmail, onBack }: ForgotPasswordProps) {
  const [subView, setSubView] = useState<SubView>("form");
  const [forgotEmail, setForgotEmail] = useState(initialEmail);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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
        setSubView("sent");
      }
    } catch {
      setForgotError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (subView === "sent") {
    return (
      <div className="w-full max-w-md text-center">
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
          <p className="text-sm font-bold text-[#8a5c07]">
            Langkah selanjutnya:
          </p>
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
          <button
            onClick={() => {
              setSubView("form");
              setForgotError("");
            }}
            className="w-full clay-raised-sm clay-pressable border-0 text-[#0249E1] py-3 rounded-2xl font-bold transition-colors cursor-pointer"
          >
            Kirim Ulang Email
          </button>

          <button
            onClick={onBack}
            className="w-full clay-blue clay-pressable text-white py-3 rounded-2xl font-bold transition-all cursor-pointer"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <button
        onClick={onBack}
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
}
