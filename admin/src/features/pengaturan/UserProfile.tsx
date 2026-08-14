import {
  User,
  ChevronDown,
  Settings,
  LogOut,
  X,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

interface UserProfileProps {
  name: string;
  role: "Admin" | "Karyawan";
  onSettings: () => void;
  onLogout: () => void;
  userId?: string;
}

function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="clay-raised-lg rounded-[28px] w-full max-w-sm p-6">
        <div className="w-14 h-14 clay-inset-red rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-[#10193a] text-center mb-2">
          Yakin ingin keluar?
        </h3>
        <p className="text-sm text-[#5b6a8f] text-center mb-6">
          Kamu akan keluar dari sistem. Semua sesi aktif akan dihapus.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 clay-inset border-0 rounded-xl text-sm font-semibold text-[#10193a] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 clay-red clay-pressable text-white rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSettingsModal({
  currentName,
  onClose,
  onNameUpdated,
  userId,
}: {
  currentName: string;
  onClose: () => void;
  onNameUpdated: (newName: string) => void;
  userId?: string;
}) {
  const [name, setName] = useState(currentName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [pwError, setPwError] = useState("");

  const handleSaveName = async () => {
    if (!name.trim()) {
      setNameError("Nama tidak boleh kosong.");
      return;
    }
    if (name.trim() === currentName) {
      setNameError("Nama tidak berubah.");
      return;
    }

    setSavingName(true);
    setNameError("");

    try {
      let updateError: any = null;

      if (userId) {
        const { error } = await supabaseAdmin
          .from("users")
          .update({ name: name.trim() })
          .eq("id", userId);
        updateError = error;
      } else {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Tidak dapat menemukan sesi login.");

        const { error } = await supabaseAdmin
          .from("users")
          .update({ name: name.trim() })
          .eq("auth_user_id", authUser.id);
        updateError = error;
      }

      if (updateError) throw updateError;

      await supabaseAdmin.from("activity_logs").insert([
        {
          activity_type: "update_profile",
          description: `Admin mengubah nama dari "${currentName}" menjadi "${name.trim()}"`,
        },
      ]);

      onNameUpdated(name.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      console.error("[UserProfile] handleSaveName error:", err);
      setNameError(
        "Gagal menyimpan nama: " + (err.message ?? JSON.stringify(err)),
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    setPwError("");
    if (!currentPassword) {
      setPwError("Password saat ini wajib diisi.");
      return;
    }
    if (!newPassword) {
      setPwError("Password baru wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Konfirmasi password tidak cocok.");
      return;
    }

    setSavingPw(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser?.email) throw new Error("Gagal mendapatkan data user.");

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });
      if (signInErr) throw new Error("Password saat ini salah.");

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      await supabaseAdmin.from("activity_logs").insert([
        {
          activity_type: "update_password",
          description: "Admin mengubah password akun",
        },
      ]);

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      console.error("[UserProfile] handleSavePassword error:", err);
      setPwError(err.message ?? "Gagal mengubah password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="clay-raised-lg rounded-[28px] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(140,172,214,0.35)] sticky top-0 clay-raised rounded-t-[28px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#10193a]">
                Pengaturan Akun
              </h2>
              <p className="text-xs text-[#5b6a8f]">
                Kelola informasi akun admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5 text-[#5b6a8f]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[rgba(215,233,255,0.4)] rounded-xl p-4 border border-[rgba(140,172,214,0.35)]">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Informasi Profil
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#5b6a8f] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  className="w-full px-3 py-2.5 clay-inset border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                  placeholder="Masukkan nama lengkap"
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1">{nameError}</p>
                )}
                {nameSuccess && (
                  <p className="text-green-600 text-xs mt-1">
                    ✓ Nama berhasil diperbarui
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="w-full py-2.5 clay-blue clay-pressable text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingName ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Nama
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[rgba(215,233,255,0.4)] rounded-xl p-4 border border-[rgba(140,172,214,0.35)]">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" />
              Ubah Password
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "Password Saat Ini",
                  value: currentPassword,
                  setter: setCurrentPassword,
                  show: showCurrentPw,
                  toggleShow: () => setShowCurrentPw(!showCurrentPw),
                  placeholder: "••••••••",
                },
                {
                  label: "Password Baru",
                  value: newPassword,
                  setter: setNewPassword,
                  show: showNewPw,
                  toggleShow: () => setShowNewPw(!showNewPw),
                  placeholder: "Min. 6 karakter",
                },
                {
                  label: "Konfirmasi Password Baru",
                  value: confirmPassword,
                  setter: setConfirmPassword,
                  show: showConfirmPw,
                  toggleShow: () => setShowConfirmPw(!showConfirmPw),
                  placeholder: "Ulangi password baru",
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-[#5b6a8f] mb-1.5">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.show ? "text" : "password"}
                      value={field.value}
                      onChange={(e) => {
                        field.setter(e.target.value);
                        setPwError("");
                      }}
                      className="w-full pl-3 pr-10 py-2.5 clay-inset border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={field.placeholder}
                    />
                    <button
                      type="button"
                      onClick={field.toggleShow}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa4d4] hover:text-[#10193a] cursor-pointer"
                    >
                      {field.show ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
              {pwSuccess && (
                <p className="text-green-600 text-xs">
                  ✓ Password berhasil diubah
                </p>
              )}

              <button
                onClick={handleSavePassword}
                disabled={savingPw}
                className="w-full py-2.5 clay-purple clay-pressable text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingPw ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Mengubah...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Ubah Password
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700 text-center">
              Perubahan akan langsung tersimpan ke database sistem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserProfile({
  name: initialName,
  role,
  onSettings,
  onLogout,
  userId,
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [currentName, setCurrentName] = useState(initialName);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <div className="relative ml-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[rgba(215,233,255,0.55)] transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {currentName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-semibold text-[#10193a]">
              {currentName}
            </span>
            <span className="text-xs text-[#5b6a8f]">{role}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#8fa4d4] hidden md:block transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-52 clay-raised-lg rounded-xl py-2 z-50">
              <div className="px-4 py-2 mb-1">
                <p className="text-sm font-semibold text-[#10193a] truncate">
                  {currentName}
                </p>
                <p className="text-xs text-[#8fa4d4]">{role} — Arroyyan99</p>
              </div>
              <hr className="border-[rgba(140,172,214,0.2)] mb-1" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowAccountSettings(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-[#10193a] hover:bg-[rgba(215,233,255,0.5)] flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 clay-blue-soft rounded-lg flex items-center justify-center">
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Pengaturan Akun
              </button>

              <hr className="border-[rgba(140,172,214,0.2)] my-1" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 clay-inset-red rounded-lg flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                </div>
                Keluar
              </button>
            </div>
          </>
        )}
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {showAccountSettings && (
        <AccountSettingsModal
          currentName={currentName}
          userId={userId}
          onClose={() => setShowAccountSettings(false)}
          onNameUpdated={(newName) => setCurrentName(newName)}
        />
      )}
    </>
  );
}
