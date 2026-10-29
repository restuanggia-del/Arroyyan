import { useEffect, useState, useCallback } from "react";
import { Gift, CheckCircle2, Target, RefreshCw, Sparkles } from "lucide-react";
import {
  getBonusProgress,
  BonusProgress,
  BONUS_REFRESH_EVENT,
  REWARD_TITLE,
  formatRewardValue,
} from "../../../services";

interface BonusCardProps {
  salesId: string;
}

const fmt = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export default function BonusCard({ salesId }: BonusCardProps) {
  const [data, setData] = useState<BonusProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setData(await getBonusProgress(salesId));
    } catch (err) {
      console.warn("[Bonus] gagal memuat progres bonus:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [salesId]);

  useEffect(() => {
    load();
    window.addEventListener(BONUS_REFRESH_EVENT, load);
    return () => window.removeEventListener(BONUS_REFRESH_EVENT, load);
  }, [load]);

  if (loading) {
    return (
      <div className="clay-raised rounded-3xl p-5 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-[#0249E1]/30 animate-spin" />
        <p className="text-sm text-[#111111]/40 font-medium">Memuat bonus...</p>
      </div>
    );
  }

  // Tidak ada aturan bonus untuk sales / gagal dimuat → kartu disembunyikan
  if (failed || !data || !data.hasRules) return null;

  const { next, achieved, totals, milestones, totalDus } = data;
  const hasAnyReward =
    totals.dus_bonus > 0 || totals.kaos > 0 || totals.uang > 0;

  // Progres menuju target terdekat
  const prevTarget = next
    ? Math.max(
        0,
        ...milestones
          .filter((m) => m.mode === "threshold" && m.achieved)
          .map((m) => m.targetDus),
        next.mode === "ratio" ? next.targetDus - next.rule.threshold_dus : 0,
      )
    : 0;
  const span = next ? Math.max(next.targetDus - prevTarget, 1) : 1;
  const pct = next
    ? Math.max(4, Math.min(100, ((totalDus - prevTarget) / span) * 100))
    : 100;

  const thresholdMilestones = milestones.filter((m) => m.mode === "threshold");
  const ratioMilestones = milestones.filter((m) => m.mode === "ratio");

  return (
    <div className="clay-raised rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71] rounded-2xl flex items-center justify-center shadow-[3px_3px_8px_rgba(163,190,225,0.5),-2px_-2px_6px_rgba(255,255,255,0.8)]">
          <Gift className="w-5 h-5 text-[#111111]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#111111]">Bonus Penjualan</p>
          <p className="text-[11px] text-[#111111]/45 font-medium">
            Periode {data.periodeLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-[#0249E1] leading-none">
            {fmt(totalDus)}
          </p>
          <p className="text-[10px] font-bold text-[#111111]/45 uppercase tracking-wide">
            dus terjual
          </p>
        </div>
      </div>

      {hasAnyReward && (
        <div className="rounded-2xl p-3.5 bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#111111]" />
            <p className="text-xs font-extrabold text-[#111111]">
              Selamat! Kamu mendapat bonus
            </p>
          </div>
          <div className="space-y-1">
            {achieved.map((m) => (
              <p key={m.key} className="text-sm font-bold text-[#111111]">
                {m.mode === "ratio" && m.count > 1 ? `${m.count}× ` : ""}
                {m.rewardLabel}
                <span className="text-[11px] font-medium text-[#111111]/60">
                  {" "}
                  •{" "}
                  {m.mode === "ratio"
                    ? `tiap ${fmt(m.rule.threshold_dus)} dus`
                    : `capai ${fmt(m.targetDus)} dus`}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {next ? (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#0249E1]" />
              Target berikutnya
            </p>
            <p className="text-[11px] font-bold text-[#111111]/50">
              {fmt(totalDus)} / {fmt(next.targetDus)} dus
            </p>
          </div>
          <div className="h-3 rounded-full clay-inset-sm overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4a86f4] to-[#0249E1] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[#111111]/60 font-medium mt-2">
            Tinggal{" "}
            <span className="font-extrabold text-[#0249E1]">
              {fmt(next.remainingDus)} dus
            </span>{" "}
            lagi untuk mendapat{" "}
            <span className="font-extrabold text-[#111111]">
              {next.rewardLabel}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-xs font-bold text-[#0249E1]">
          🎉 Semua target bonus periode ini sudah tercapai!
        </p>
      )}

      <div>
        <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-2">
          Daftar target bonus
        </p>
        <div className="space-y-2">
          {thresholdMilestones.map((m) => (
            <div
              key={m.key}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
                m.achieved ? "clay-inset-sm" : "bg-white/40"
              }`}
            >
              <CheckCircle2
                className={`w-4.5 h-4.5 flex-shrink-0 ${
                  m.achieved ? "text-[#0249E1]" : "text-[#111111]/20"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#111111]">
                  {fmt(m.targetDus)} dus → {m.rewardLabel}
                </p>
                <p className="text-[10px] text-[#111111]/40 font-medium">
                  {REWARD_TITLE[m.rule.reward_type]} •{" "}
                  {m.superseded
                    ? "digantikan target yang lebih tinggi"
                    : m.achieved
                      ? "tercapai"
                      : `kurang ${fmt(m.remainingDus)} dus`}
                </p>
              </div>
            </div>
          ))}
          {ratioMilestones.map((m) => (
            <div
              key={m.key}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
                m.achieved ? "clay-inset-sm" : "bg-white/40"
              }`}
            >
              <CheckCircle2
                className={`w-4.5 h-4.5 flex-shrink-0 ${
                  m.achieved ? "text-[#0249E1]" : "text-[#111111]/20"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#111111]">
                  Tiap {fmt(m.rule.threshold_dus)} dus →{" "}
                  {formatRewardValue(m.rule.reward_type, m.rule.reward_value)}
                </p>
                <p className="text-[10px] text-[#111111]/40 font-medium">
                  Berulang •{" "}
                  {m.count > 0
                    ? `sudah ${m.count}× tercapai`
                    : "belum tercapai"}
                  , kelipatan berikutnya kurang {fmt(m.remainingDus)} dus
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
