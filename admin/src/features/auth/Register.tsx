import { useState } from "react";
import {
  Droplet,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface RegisterProps {
  onRegister: (data: RegisterData) => Promise<{ error: any } | void>;
  onSwitchToLogin: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

function SuccessModal({
  name,
  onLogin,
}: {
  name: string;
  onLogin: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-[fadeInUp_0.3s_ease]">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pendaftaran Berhasil!
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          Hai <span className="font-semibold text-gray-700">{name}</span>, akun
          distributor Anda telah berhasil didaftarkan.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              Status: Menunggu Persetujuan
            </p>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Akun Anda saat ini berstatus <strong>NONAKTIF</strong>. Admin pabrik
            akan meninjau dan menyetujui akun Anda sebelum dapat digunakan di
            aplikasi mobile distributor.
          </p>
        </div>

        <div className="text-left mb-6 space-y-2">
          {[
            { step: "1", text: "Tunggu konfirmasi persetujuan dari admin" },
            { step: "2", text: "Unduh aplikasi mobile Arroyyan99" },
            {
              step: "3",
              text: "Login dengan email & password yang didaftarkan",
            },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg transition-all duration-300 cursor-pointer"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    </div>
  );
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };

  const validateForm = () => {
    let isValid = true;
    const e = {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.name.trim()) {
      e.name = "Nama distributor wajib diisi";
      isValid = false;
    }
    if (!formData.email) {
      e.email = "Email wajib diisi";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = "Format email tidak valid";
      isValid = false;
    }
    if (!formData.phone) {
      e.phone = "Nomor HP wajib diisi";
      isValid = false;
    } else if (!/^08\d{8,11}$/.test(formData.phone)) {
      e.phone = "Format nomor HP tidak valid (08xxxxxxxxxx)";
      isValid = false;
    }
    if (!formData.address.trim()) {
      e.address = "Alamat wajib diisi";
      isValid = false;
    }
    if (!formData.password) {
      e.password = "Password wajib diisi";
      isValid = false;
    } else if (formData.password.length < 6) {
      e.password = "Password minimal 6 karakter";
      isValid = false;
    }
    if (!formData.confirmPassword) {
      e.confirmPassword = "Konfirmasi password wajib diisi";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = "Password tidak sama";
      isValid = false;
    }

    setErrors(e);
    if (!isValid)
      setSubmitError(
        "Periksa kembali data yang diinputkan dan lengkapi field yang bertanda merah.",
      );
    else setSubmitError("");
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    const { confirmPassword, ...registerData } = formData;
    const result = await onRegister(registerData);

    if (result && (result as any).error) {
      const msg =
        (result as any).error?.message ?? "Pendaftaran gagal. Coba lagi.";
      setSubmitError(
        msg.includes("already registered") || msg.includes("already exists")
          ? "Email ini sudah terdaftar. Gunakan email lain atau login."
          : msg,
      );
      setIsSubmitting(false);
      return;
    }

    setRegisteredName(formData.name);
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  const inputClass = (field: keyof typeof errors) =>
    `w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
      errors[field]
        ? "border-red-300 focus:ring-2 focus:ring-red-400"
        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
    }`;

  return (
    <>
      {showSuccess && (
        <SuccessModal name={registeredName} onLogin={onSwitchToLogin} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center p-6">
        <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
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
              <h1 className="text-5xl font-bold mb-4">ARROYYAN99</h1>
              <p className="text-cyan-100 text-lg leading-relaxed max-w-md">
                Sistem modern untuk pengelolaan distribusi dan point of sales
                Air Minum Dalam Kemasan secara efisien.
              </p>
              <div className="mt-12 space-y-4">
                {[
                  "Distribusi Produk",
                  "Point Of Sales",
                  "Monitoring Penjualan",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white" />
                    <p className="text-cyan-100">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 bg-white/10 border border-white/20 rounded-2xl">
                <p className="text-xs text-cyan-100 font-medium mb-1">
                  Catatan
                </p>
                <p className="text-xs text-cyan-200 leading-relaxed">
                  Setelah mendaftar, akun akan diverifikasi oleh admin pabrik
                  sebelum dapat digunakan.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 lg:p-10">
            <div className="w-full max-w-2xl">
              <button
                onClick={onSwitchToLogin}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Kembali ke Login</span>
              </button>

              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Daftar Distributor
                </h2>
                <p className="text-gray-500">
                  Lengkapi data berikut untuk membuat akun baru.
                </p>
              </div>

              {submitError && (
                <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Distributor
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Masukkan nama distributor"
                        className={inputClass("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-2">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="email@example.com"
                        className={inputClass("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-2">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor HP
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inputClass("phone")}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-2">
                        {errors.phone}
                      </p>
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
                        value={formData.password}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                        placeholder="••••••••"
                        className={`${inputClass("password")} pr-12`}
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
                      <p className="text-red-500 text-xs mt-2">
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Lengkap
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={3}
                      placeholder="Masukkan alamat lengkap"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none resize-none transition-all ${
                        errors.address
                          ? "border-red-300 focus:ring-2 focus:ring-red-400"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-2">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      placeholder="Ulangi password"
                      className={`${inputClass("confirmPassword")} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />{" "}
                      Mendaftarkan...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Sudah punya akun?{" "}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
