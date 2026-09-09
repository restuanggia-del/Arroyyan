import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Warehouse,
  Package,
  ShieldX,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { registerUser, PanelRegisterRole } from "../../services/authService";

interface RegisterProps {
  onBack: () => void;
  onRegistered: (email: string) => void;
}

interface RoleOption {
  value: PanelRegisterRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Akses penuh ke seluruh data & fitur sistem.",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    value: "admin_gudang",
    label: "Admin Gudang",
    description:
      "Manajemen Bahan, Handling Fee, Manajemen Stok, dan laporan terkait.",
    icon: <Warehouse className="w-5 h-5" />,
  },
  {
    value: "admin_produk",
    label: "Admin Produk",
    description:
      "Manajemen Stok, Insentif & Fee Penjualan, dan laporan terkait.",
    icon: <Package className="w-5 h-5" />,
  },
];

type FormErrors = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

const emptyErrors: FormErrors = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
};

export function Register({ onBack, onRegistered }: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<PanelRegisterRole | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = { ...emptyErrors };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Nama wajib diisi";
      isValid = false;
    }
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
    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok";
      isValid = false;
    }
    if (!role) {
      newErrors.role = "Pilih role akun terlebih dahulu";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm() || !role) return;

    setIsLoading(true);
    const { error } = await registerUser({ name, email, password, role });
    setIsLoading(false);

    if (error) {
      const message = error.message ?? "Gagal membuat akun. Coba lagi.";
      setSubmitError(message);
      toast.error("Registrasi Gagal", { description: message });
      return;
    }

    setSuccess(true);
    toast.success("Registrasi Berhasil", {
      description: `Akun ${name} berhasil dibuat. Silakan login.`,
    });
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 clay-inset-green rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#10193a] mb-2">
          Akun Berhasil Dibuat
        </h2>
        <p className="text-[#5b6a8f] mb-8">
          Akun untuk <span className="font-semibold">{email}</span> sudah aktif.
          Silakan login menggunakan email &amp; password yang baru saja
          didaftarkan.
        </p>
        <button
          onClick={() => onRegistered(email)}
          className="w-full clay-blue clay-pressable text-white py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#5b6a8f] hover:text-[#10193a] font-semibold mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </button>

      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-[#10193a] mb-2">
          Buat Akun Panel Admin
        </h2>
        <p className="text-[#5b6a8f]">
          Daftarkan akun baru beserta role-nya untuk mengakses panel ini.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-2xl border-0 clay-inset-red flex gap-3">
          <ShieldX className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#ee3d5a]" />
          <div>
            <p className="text-sm font-bold mb-1 text-[#c81f3d]">
              Registrasi Gagal
            </p>
            <p className="text-sm text-[#c81f3d]">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Nama Lengkap
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa4d4]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-0 clay-inset outline-none transition-all ${
                errors.name
                  ? "ring-2 ring-red-400"
                  : "focus:ring-2 focus:ring-[#0249E1]/40"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs mt-2">{errors.name}</p>
          )}
        </div>

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
              placeholder="Masukkan email"
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
              placeholder="Minimal 6 karakter"
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

        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa4d4]" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              className={`w-full pl-12 pr-12 py-4 rounded-2xl border-0 clay-inset outline-none transition-all ${
                errors.confirmPassword
                  ? "ring-2 ring-red-400"
                  : "focus:ring-2 focus:ring-[#0249E1]/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fa4d4] hover:text-[#10193a]"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5 cursor-pointer" />
              ) : (
                <Eye className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-2">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-[#10193a] mb-2">
            Role Akun
          </label>
          <div className="space-y-2.5">
            {ROLE_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setRole(opt.value)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border-0 text-left transition-all cursor-pointer ${
                  role === opt.value
                    ? "clay-blue text-white"
                    : "clay-inset text-[#10193a]"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    role === opt.value ? "text-white" : "text-[#0249E1]"
                  }`}
                >
                  {opt.icon}
                </div>
                <div>
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      role === opt.value ? "text-white/80" : "text-[#5b6a8f]"
                    }`}
                  >
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-red-500 text-xs mt-2">{errors.role}</p>
          )}
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
              Membuat akun...
            </>
          ) : (
            "Daftar Akun"
          )}
        </button>
      </form>
    </div>
  );
}
