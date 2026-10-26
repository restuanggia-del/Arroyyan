import { useEffect, useState, useCallback, useRef } from "react";
import {
  Phone,
  MapPin,
  LogOut,
  Pencil,
  RefreshCw,
  AlertCircle,
  History,
  TrendingUp,
  Receipt,
  Wallet,
  Banknote,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  SalesUser,
  getTransactionHistory,
  getKomisiSummary,
} from "../../../services";
import ProfileModal from "./ProfileModal";
import { parseDbDate } from "../../../lib/dateUtils";
import { supabase } from "../../../../utils/supabase/client";

interface ProfilePageProps {
  user: SalesUser;
  onLogout: () => void;
  onProfileUpdated: (updated: Partial<SalesUser>) => void;
}

type TxRow = Awaited<ReturnType<typeof getTransactionHistory>>[number];

const formatRp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

type Periode = "harian" | "mingguan" | "bulanan";

const PERIODE_OPTIONS: { key: Periode; label: string; cardLabel: string }[] = [
  { key: "harian", label: "Harian", cardLabel: "Komisi Hari Ini" },
  { key: "mingguan", label: "Mingguan", cardLabel: "Komisi Minggu Ini" },
  { key: "bulanan", label: "Bulanan", cardLabel: "Komisi Bulan Ini" },
];

const getPeriodeRange = (periode: Periode) => {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (periode === "harian") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
  } else if (periode === "mingguan") {
    const dayFromMonday = (now.getDay() + 6) % 7;
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayFromMonday,
    );
    end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
      23,
      59,
      59,
      999,
    );
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
};

const getPeriodeLabel = (periode: Periode) => {
  const { start, end } = getPeriodeRange(periode);
  if (periode === "harian") {
    return start.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (periode === "mingguan") {
    const a = start.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    const b = end.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${a} – ${b}`;
  }
  return start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

interface WithdrawalRow {
  id: string;
  jumlah: number;
  keterangan: string | null;
  created_at: string;
}

const getCommissionWithdrawals = async (
  salesId: string,
): Promise<WithdrawalRow[]> => {
  const { data, error } = await supabase
    .from("commission_withdrawals")
    .select("id, jumlah, keterangan, created_at")
    .eq("sales_id", salesId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ ...r, jumlah: Number(r.jumlah) }));
};

const createCommissionWithdrawal = async (
  salesId: string,
  jumlah: number,
  keterangan: string,
) => {
  const { data, error } = await supabase
    .from("commission_withdrawals")
    .insert([{ sales_id: salesId, jumlah, keterangan: keterangan || null }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("activity_logs").insert([
    {
      activity_type: "create_commission_withdrawal",
      description: `Sales menarik komisi ${formatRp(jumlah)}`,
    },
  ]);

  return data;
};

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

  const [periode, setPeriode] = useState<Periode>("bulanan");
  const [totalKomisiAll, setTotalKomisiAll] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [withdrawError, setWithdrawError] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const komisiReqId = useRef(0);

  const totalDitarik = withdrawals.reduce((s, w) => s + w.jumlah, 0);
  const saldoKomisi = Math.max(0, Math.round(totalKomisiAll - totalDitarik));

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
    const reqId = ++komisiReqId.current;
    setLoadingKomisi(true);
    setError("");
    try {
      const { start, end } = getPeriodeRange(periode);
      const allEnd = new Date();
      allEnd.setDate(allEnd.getDate() + 1);

      const [summary, all, wd] = await Promise.all([
        getKomisiSummary(user.salesId, start.toISOString(), end.toISOString()),
        getKomisiSummary(
          user.salesId,
          "2000-01-01T00:00:00.000Z",
          allEnd.toISOString(),
        ),
        getCommissionWithdrawals(user.salesId)
          .then((rows) => ({ rows, err: "" }))
          .catch((e: any) => ({
            rows: [] as WithdrawalRow[],
            err: e?.message ?? "Gagal memuat penarikan.",
          })),
      ]);

      if (reqId !== komisiReqId.current) return;

      setKomisi(summary);
      setTotalKomisiAll(all.totalKomisi);
      setWithdrawals(wd.rows);
      setWithdrawError(wd.err);
    } catch (err: any) {
      if (reqId !== komisiReqId.current) return;
      setError(err.message ?? "Gagal memuat komisi.");
    } finally {
      if (reqId === komisiReqId.current) setLoadingKomisi(false);
    }
  }, [user.salesId, periode]);

  useEffect(() => {
    if (tab === "riwayat" && history.length === 0) loadHistory();
  }, [tab]);

  useEffect(() => {
    if (tab === "komisi") loadKomisi();
  }, [tab, loadKomisi]);

  const formatDate = (d: string) =>
    parseDbDate(d).toLocaleDateString("id-ID", {
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
              <div key={t.fullId} className="clay-raised rounded-xl p-3.5">
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

      {tab === "komisi" && (
        <div className="space-y-3">
          {loadingKomisi && !komisi ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-7 h-7 text-[#111111]/25 animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#111111]/35">Memuat komisi...</p>
            </div>
          ) : komisi ? (
            <div
              className={`space-y-3 transition-opacity duration-200 ${
                loadingKomisi ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              <div className="bg-gradient-to-br from-[#111111] to-[#0249E1] rounded-[28px] p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#DAFB71]" />
                  <p className="text-sm text-white/85 font-medium">
                    {PERIODE_OPTIONS.find((o) => o.key === periode)?.cardLabel}
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-[#DAFB71]">
                  {formatRp(komisi.totalKomisi)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {getPeriodeLabel(periode)}
                </p>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/15">
                  {PERIODE_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => setPeriode(o.key)}
                      className={`flex-1 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors duration-200 ${
                        periode === o.key
                          ? "bg-[#DAFB71] text-[#111111]"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="clay-raised rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#111111]/45 mb-1 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" />
                      Saldo Komisi Tersedia
                    </p>
                    <p className="text-xl font-extrabold text-[#0249E1] truncate">
                      {formatRp(saldoKomisi)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(true)}
                    disabled={saldoKomisi <= 0 || !!withdrawError}
                    className="flex-shrink-0 clay-blue clay-pressable text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    Tarik
                  </button>
                </div>
                <p className="text-[11px] text-[#111111]/40 mt-2">
                  Total komisi {formatRp(totalKomisiAll)} · Sudah ditarik{" "}
                  {formatRp(totalDitarik)}
                </p>
                {withdrawError && (
                  <p className="text-[11px] text-[#EE3D5A] mt-1.5">
                    Fitur penarikan belum siap: {withdrawError}
                  </p>
                )}
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

              {/* Riwayat penarikan pada periode terpilih */}
              {(() => {
                const { start, end } = getPeriodeRange(periode);
                const rows = withdrawals.filter((w) => {
                  const t = parseDbDate(w.created_at).getTime();
                  return t >= start.getTime() && t <= end.getTime();
                });
                return (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-[#111111]/45 mb-2 px-1">
                      Penarikan {getPeriodeLabel(periode)}
                    </p>
                    {rows.length === 0 ? (
                      <div className="clay-inset-sm rounded-xl py-5 text-center">
                        <p className="text-xs text-[#111111]/35">
                          Belum ada penarikan di periode ini.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rows.map((w) => (
                          <div
                            key={w.id}
                            className="clay-raised rounded-xl p-3.5 flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#0249E1]/10 flex items-center justify-center flex-shrink-0">
                              <Banknote className="w-4.5 h-4.5 text-[#0249E1]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#111111]">
                                − {formatRp(w.jumlah)}
                              </p>
                              <p className="text-[11px] text-[#111111]/40 truncate">
                                {formatDate(w.created_at)}
                                {w.keterangan ? ` · ${w.keterangan}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : null}
        </div>
      )}

      {showWithdraw && (
        <WithdrawModal
          salesId={user.salesId}
          saldo={saldoKomisi}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false);
            loadKomisi();
          }}
        />
      )}

      {showEdit && (
        <ProfileModal
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

const SHEET_ANIM_MS = 320;

function WithdrawModal({
  salesId,
  saldo,
  onClose,
  onSuccess,
}: {
  salesId: string;
  saldo: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nominal = Math.floor(Number(jumlah) || 0);
  const sisa = saldo - nominal;

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOpen(true)),
    );
    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const animateClose = (after: () => void) => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(after, SHEET_ANIM_MS);
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (nominal <= 0) {
      setError("Masukkan jumlah komisi yang ingin ditarik.");
      return;
    }
    if (nominal > saldo) {
      setError(`Jumlah melebihi saldo tersedia (${formatRp(saldo)}).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createCommissionWithdrawal(salesId, nominal, keterangan);
      setDone(true);
      timerRef.current = setTimeout(() => animateClose(onSuccess), 900);
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan penarikan.");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) animateClose(onClose);
      }}
      className={`fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        open ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`clay-raised-lg rounded-t-3xl w-full transform-gpu will-change-transform transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
          <h2 className="font-bold text-[#111111]">Tarik Komisi</h2>
          <button
            onClick={() => !saving && animateClose(onClose)}
            className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5 text-[#111111]/45" />
          </button>
        </div>

        {done ? (
          <div className="py-12 text-center px-5">
            <CheckCircle2 className="w-12 h-12 text-[#0249E1] mx-auto mb-3" />
            <p className="font-semibold text-[#111111]">Penarikan tercatat</p>
            <p className="text-sm text-[#111111]/45">{formatRp(nominal)}</p>
          </div>
        ) : (
          <div className="px-5 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] space-y-4">
            {error && (
              <div className="p-3 clay-inset-sm border-0 rounded-xl flex gap-2 text-sm text-[#EE3D5A]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="clay-inset-sm rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#111111]/45">Saldo tersedia</span>
              <span className="text-sm font-bold text-[#0249E1]">
                {formatRp(saldo)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#111111]/45">
                  Jumlah Ditarik
                </label>
                <button
                  type="button"
                  onClick={() => setJumlah(String(saldo))}
                  className="text-xs font-semibold text-[#0249E1] cursor-pointer px-2 py-1 -my-1 rounded-lg"
                >
                  Tarik semua
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#111111]/35">
                  Rp
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={saldo}
                  value={jumlah}
                  onChange={(e) => {
                    setJumlah(e.target.value);
                    setError("");
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-3 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111]/45 mb-1.5">
                Keterangan (opsional)
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 clay-raised rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]"
              />
            </div>

            <div className="flex justify-between text-sm px-1">
              <span className="text-[#111111]/55">
                Sisa saldo setelah tarik
              </span>
              <span
                className={`font-semibold ${sisa < 0 ? "text-[#EE3D5A]" : "text-[#111111]"}`}
              >
                {formatRp(Math.max(sisa, 0))}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || nominal <= 0 || nominal > saldo}
              className="w-full clay-blue clay-pressable text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? "Menyimpan..." : `Tarik ${formatRp(nominal)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
