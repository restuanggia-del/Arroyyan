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
} from "lucide-react";

interface RegisterProps {
  onRegister: (data: RegisterData) => void;
  onSwitchToLogin: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
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
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Nama distributor wajib diisi";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
      isValid = false;
    }

    if (!formData.phone) {
      newErrors.phone = "Nomor HP wajib diisi";
      isValid = false;
    } else if (!/^08\d{8,11}$/.test(formData.phone)) {
      newErrors.phone = "Format nomor HP tidak valid (08xxxxxxxxxx)";
      isValid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak sama";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) {
      setSubmitError(
        "Periksa kembali data yang diinputkan dan lengkapi field yang bertanda merah.",
      );
    } else {
      setSubmitError("");
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...registerData } = formData;
      onRegister(registerData);
    }
  };

  return (
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
              Sistem modern untuk pengelolaan distribusi dan point of sales Air
              Minum Dalam Kemasan secara efisien.
            </p>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white" />
                <p className="text-cyan-100">Distribusi Produk</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white" />
                <p className="text-cyan-100">Point Of Sales</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white" />
                <p className="text-cyan-100">Monitoring Penjualan</p>
              </div>
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
              <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5">
                {submitError}
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
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                        errors.name
                          ? "border-red-300 focus:ring-2 focus:ring-red-400"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
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
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
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
                    Nomor HP
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                        errors.phone
                          ? "border-red-300 focus:ring-2 focus:ring-red-400"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                  </div>

                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-2">{errors.phone}</p>
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
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
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
                  <p className="text-red-500 text-xs mt-2">{errors.address}</p>
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
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border bg-gray-50 focus:bg-white outline-none transition-all ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-2 focus:ring-red-400"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
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
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                Daftar Sekarang
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
  );
}
