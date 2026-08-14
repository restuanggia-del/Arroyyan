import { useEffect, useState, useCallback } from "react";
import {
  User,
  Phone,
  MapPin,
  LogOut,
  Pencil,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  History,
  TrendingUp,
  X,
  Receipt,
} from "lucide-react";
import {
  SalesUser,
  updateSalesProfile,
  getTransactionHistory,
  getKomisiSummary,
} from "../../../services";

interface ProfilePageProps {
  user: SalesUser;
  onLogout: () => void;
  onProfileUpdated: (updated: Partial<SalesUser>) => void;
}

type TxRow = Awaited<ReturnType<typeof getTransactionHistory>>[number];

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export default function ProfilePage({
  user,
  onLogout,
  onProfileUpdated,
}: ProfilePageProps) {
  const [tab, setTab] = useState<"profil" | "riwayat" | "komisi">("profil");
  const [showEdit, setShowEdit] = useState(false);

  const [history, setHistory] = useState<TxRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [komisi, setKomisi] = useState<Awaited<
    ReturnType<typeof getKomisiSummary>
  > | null>(null);
  const [loadingKomisi, setLoadingKomisi] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError("");
    try {
      const data = await getTransactionHistory(user.salesId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat riwayat.");
    } finally {
      setLoadingHistory(false);
    }
  }, [user.salesId]);

  const loadKomisi = useCallback(async () => {
    setLoadingKomisi(true);
    setError("");
    try {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString();
      const data = await getKomisiSummary(user.salesId, start, end);
      setKomisi(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat komisi.");
    } finally {
      setLoadingKomisi(false);
    }
  }, [user.salesId]);

  useEffect(() => {
    if (tab === "riwayat" && history.length === 0) loadHistory();
    if (tab === "komisi" && !komisi) loadKomisi();
  }, [tab]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4">
      <div className="bg-gradient-to-br from-[#4a86f4] to-[#0249E1] rounded-[28px] p-5 text-white mb-4 relative overflow-hidden shadow-[10px_10px_24px_rgba(2,55,150,0.35),-6px_-6px_16px_rgba(150,195,255,0.25)]">
        <div className="absolute w-28 h-28 rounded-full bg-[#DAFB71]/20 blur-2xl -top-6 -right-6" />
        <button
          onClick={() => setShowEdit(true)}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center cursor-pointer clay-pressable"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 text-lg font-bold">
          {user.namaSales.charAt(0).toUpperCase()}
        </div>
        <p className="font-bold text-lg">{user.namaSales}</p>
        <p className="text-sm text-white/80">{user.email}</p>
        {user.phone && (
          <div className="flex items-center gap-1.5 text-xs text-white/75 mt-2">
            <Phone className="w-3.5 h-3.5" /> {user.phone}
          </div>
        )}
        {user.address && (
          <div className="flex items-center gap-1.5 text-xs text-white/75 mt-1">
            <MapPin className="w-3.5 h-3.5" /> {user.address}
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-4 clay-inset-sm rounded-xl p-1">
        {(
          [
            { key: "profil", label: "Akun" },
            { key: "riwayat", label: "Riwayat" },
            { key: "komisi", label: "Komisi" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key
                ? "clay-raised-sm text-[#0249E1]"
                : "text-[#111111]/45"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {tab === "profil" && (
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-[#EE3D5A]/10 text-[#EE3D5A] py-3.5 rounded-xl font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      )}

      {tab === "riwayat" &&
        (loadingHistory ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#111111]/35">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-10 h-10 text-[#111111]/25 mx-auto mb-3" />
            <p className="text-sm text-[#111111]/35">Belum ada transaksi.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((t) => (
              <div
                key={t.fullId}
                className="clay-raised rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#111111]/35">
                    #{t.id} · {formatDate(t.createdAt)}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      t.paymentMethod === "kasbon"
                        ? "bg-[#EE3D5A]/12 text-[#EE3D5A]"
                        : t.paymentMethod === "cash"
                          ? "bg-[#DAFB71]/25 text-[#0249E1]"
                          : "bg-[#80B0EC]/25 text-[#0249E1]"
                    }`}
                  >
                    {t.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[#111111]/60 mb-1">{t.customer}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#111111]">
                    {formatRp(t.total)}
                  </p>
                  {t.komisi !== 0 && (
                    <p
                      className={`text-xs font-medium ${t.komisi > 0 ? "text-[#0249E1]" : "text-[#EE3D5A]"}`}
                    >
                      {t.komisi > 0 ? "+" : ""}
                      {formatRp(t.komisi)} komisi
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "komisi" &&
        (loadingKomisi ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#111111]/35">Memuat komisi...</p>
          </div>
        ) : komisi ? (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#111111] to-[#0249E1] rounded-[28px] p-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#DAFB71]" />
                <p className="text-sm text-white/85 font-medium">
                  Komisi Bulan Ini
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#DAFB71]">
                {formatRp(komisi.totalKomisi)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="clay-raised rounded-xl p-3.5">
                <p className="text-xs text-[#111111]/45 mb-1">Dus Terjual</p>
                <p className="text-base font-bold text-[#111111]">
                  {komisi.totalDus}
                </p>
              </div>
              <div className="clay-raised rounded-xl p-3.5">
                <p className="text-xs text-[#111111]/45 mb-1">
                  Omzet Harga Jual
                </p>
                <p className="text-base font-bold text-[#111111]">
                  {formatRp(komisi.totalOmzetJual)}
                </p>
              </div>
            </div>
            <div className="clay-raised rounded-xl p-3.5">
              <p className="text-xs text-[#111111]/45 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Omzet harga pabrik (dipakai laporan resmi):{" "}
                {formatRp(komisi.totalOmzetPabrik)}
              </p>
            </div>
          </div>
        ) : null)}

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShowEdit(false);
            onProfileUpdated(updated);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: SalesUser;
  onClose: () => void;
  onSaved: (updated: Partial<SalesUser>) => void;
}) {
  const [namaSales, setNamaSales] = useState(user.namaSales);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!namaSales.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: saveError } = await updateSalesProfile(
      user.salesId,
      user.userId,
      {
        nama_sales: namaSales.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
    );
    if (saveError) {
      setError((saveError as any).message ?? "Gagal menyimpan profil.");
      setSaving(false);
      return;
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="clay-raised-lg rounded-t-3xl w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
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
          <div className="px-5 py-4 space-y-4">
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
