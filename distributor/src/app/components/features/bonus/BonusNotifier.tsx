import { useEffect, useState, useCallback, useRef } from "react";
import { PartyPopper, X } from "lucide-react";
import {
  getBonusProgress,
  getSeenBonusKeys,
  markBonusKeysSeen,
  BonusMilestone,
  BONUS_REFRESH_EVENT,
} from "../../../services";

interface BonusNotifierProps {
  salesId: string;
  onViewDetail?: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export default function BonusNotifier({
  salesId,
  onViewDetail,
}: BonusNotifierProps) {
  const [items, setItems] = useState<BonusMilestone[]>([]);
  const [totalDus, setTotalDus] = useState(0);
  const [periode, setPeriode] = useState("");
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const progress = await getBonusProgress(salesId);
      const seen = new Set(getSeenBonusKeys(salesId, progress.periode));
      const fresh = progress.achieved.filter((m) => !seen.has(m.key));
      if (fresh.length > 0) {
        setItems(fresh);
        setTotalDus(progress.totalDus);
        setPeriode(progress.periode);
      }
    } catch (err) {
      console.warn("[Bonus] gagal mengecek bonus:", err);
    } finally {
      checking.current = false;
    }
  }, [salesId]);

  useEffect(() => {
    check();
    const onSale = () => setTimeout(check, 400);
    window.addEventListener(BONUS_REFRESH_EVENT, onSale);
    return () => window.removeEventListener(BONUS_REFRESH_EVENT, onSale);
  }, [check]);

  if (items.length === 0) return null;

  const close = () => {
    markBonusKeysSeen(
      salesId,
      periode,
      items.map((m) => m.key),
    );
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl">
        <button
          onClick={close}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#111111]/40 hover:bg-black/5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71] flex items-center justify-center mb-3 shadow-[4px_4px_12px_rgba(163,190,225,0.5)]">
          <PartyPopper className="w-8 h-8 text-[#111111]" />
        </div>
        <p className="text-xl font-extrabold text-[#111111]">Selamat! 🎉</p>
        <p className="text-sm text-[#111111]/60 font-medium mt-1">
          Penjualanmu bulan ini sudah mencapai{" "}
          <span className="font-extrabold text-[#0249E1]">
            {fmt(totalDus)} dus
          </span>{" "}
          dan kamu mendapat bonus:
        </p>

        <div className="mt-4 space-y-2">
          {items.map((m) => (
            <div
              key={m.key}
              className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[#f0ff9e] to-[#DAFB71]"
            >
              <p className="text-base font-extrabold text-[#111111]">
                {m.mode === "ratio" && m.count > 1 ? `${m.count}× ` : ""}
                {m.rewardLabel}
              </p>
              <p className="text-[11px] font-semibold text-[#111111]/60">
                {m.mode === "ratio"
                  ? `Tiap kelipatan ${fmt(m.rule.threshold_dus)} dus`
                  : `Target ${fmt(m.targetDus)} dus tercapai`}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#111111]/40 font-medium mt-3">
          Bonus akan diberikan oleh admin saat rekap bonus periode ini.
        </p>

        <div className="mt-4 flex gap-2">
          {onViewDetail && (
            <button
              onClick={() => {
                close();
                onViewDetail();
              }}
              className="flex-1 rounded-2xl py-3 text-sm font-bold text-[#0249E1] bg-[#0249E1]/10 cursor-pointer"
            >
              Lihat Detail
            </button>
          )}
          <button
            onClick={close}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white bg-gradient-to-br from-[#4a86f4] to-[#0249E1] cursor-pointer"
          >
            Oke, Mantap!
          </button>
        </div>
      </div>
    </div>
  );
}
