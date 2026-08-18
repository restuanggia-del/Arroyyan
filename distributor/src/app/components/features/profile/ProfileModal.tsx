import { useState } from "react";
import {
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import {
  SalesUser,
  updateSalesProfile,
  updateSalesPassword,
} from "../../../services";

interface ProfileModalProps {
  user: SalesUser;
  onClose: () => void;
  onSaved: (updated: Partial<SalesUser>) => void;
}

export default function ProfileModal({
  user,
  onClose,
  onSaved,
}: ProfileModalProps) {
  const [namaSales, setNamaSales] = useState(user.namaSales);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!namaSales.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }

    const wantsPasswordChange =
      currentPassword || newPassword || confirmPassword;
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError(
          "Lengkapi ketiga kolom password, atau kosongkan semuanya jika tidak ingin mengganti password.",
        );
        return;
      }
      if (newPassword.length < 6) {
        setError("Password baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Konfirmasi password baru tidak cocok.");
        return;
      }
    }

    setSaving(true);
    setError("");

    const { error: profileError } = await updateSalesProfile(
      user.salesId,
      user.userId,
      {
        nama_sales: namaSales.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
    );
    if (profileError) {
      setError((profileError as any).message ?? "Gagal menyimpan profil.");
      setSaving(false);
      return;
    }

    if (wantsPasswordChange) {
      const { error: passwordError } = await updateSalesPassword(
        user.email,
        currentPassword,
        newPassword,
      );
      if (passwordError) {
        setError(
          `Profil tersimpan, tapi gagal mengganti password: ${passwordError.message}`,
        );
        setSaving(false);
        return;
      }
    }

    setDone(true);
    setTimeout(() => {
      onSaved({
        namaSales: namaSales.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
    }, 700);
  };

  const passwordInputClass =
    "w-full px-3 py-2.5 pr-10 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="clay-raised-lg rounded-t-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)] flex-shrink-0">
          <h2 className="font-bold text-[#111111]">Edit Profil</h2>
          <button
            onClick={onClose}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        {done ? (
          <div className="py-12 text-center px-5">
            <CheckCircle2 className="w-12 h-12 text-[#0249E1] mx-auto mb-3" />
            <p className="font-semibold text-[#111111]">Profil diperbarui</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Nama
              </label>
              <input
                type="text"
                value={namaSales}
                onChange={(e) => setNamaSales(e.target.value)}
                className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                No. HP
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Alamat
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>

            <div className="border-t border-[rgba(140,172,214,0.35)] pt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <KeyRound className="w-3.5 h-3.5 text-[#111111]/40" />
                <p className="text-xs font-semibold text-[#111111]/60 uppercase tracking-wide">
                  Ubah Password
                </p>
              </div>
              <p className="text-xs text-[#111111]/40 mb-3">
                Kosongkan bagian ini jika tidak ingin mengganti password.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className={passwordInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111111]/40 cursor-pointer"
                    >
                      {showCurrent ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      className={passwordInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111111]/40 cursor-pointer"
                    >
                      {showNew ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={passwordInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111111]/40 cursor-pointer"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full clay-blue clay-pressable text-white py-3.5 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
