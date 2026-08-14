import { useState } from "react";
import { X, RefreshCw, AlertCircle, Award } from "lucide-react";
import {
  BonusRule,
  BonusRewardType,
  BonusAppliesTo,
  BonusRuleMode,
  REWARD_TYPE_LABEL,
  APPLIES_TO_LABEL,
  RULE_MODE_LABEL,
  createBonusRule,
  updateBonusRule,
} from "../../services/bonusService";

interface BonusRuleModalProps {
  rule?: BonusRule | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function BonusRuleModal({
  rule,
  onClose,
  onSaveSuccess,
}: BonusRuleModalProps) {
  const isEdit = !!rule;

  const [thresholdDus, setThresholdDus] = useState(rule?.threshold_dus ?? 0);
  const [rewardType, setRewardType] = useState<BonusRewardType>(
    rule?.reward_type ?? "dus_bonus",
  );
  const [rewardValue, setRewardValue] = useState(rule?.reward_value ?? 0);
  const [appliesTo, setAppliesTo] = useState<BonusAppliesTo>(
    rule?.applies_to ?? "umum",
  );
  const [ruleMode, setRuleMode] = useState<BonusRuleMode>(
    rule?.rule_mode ?? "threshold",
  );
  const [keterangan, setKeterangan] = useState(rule?.keterangan ?? "");
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleNumberChange =
    (setter: (v: number) => void) => (value: string) => {
      const v = value.replace(/\D/g, "");
      setter(v === "" ? 0 : parseInt(v, 10));
      setFormError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (thresholdDus <= 0) {
      setFormError("Threshold dus harus lebih dari 0.");
      return;
    }
    if (rewardValue < 0) {
      setFormError("Nilai reward tidak boleh negatif.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      threshold_dus: thresholdDus,
      reward_type: rewardType,
      reward_value: rewardValue,
      applies_to: appliesTo,
      rule_mode: ruleMode,
      keterangan: keterangan || null,
      is_active: isActive,
    };

    const { error } = isEdit
      ? await updateBonusRule(rule!.id, payload)
      : await createBonusRule(payload);

    if (error) {
      setFormError("Gagal menyimpan aturan bonus: " + (error as any).message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "Edit Aturan Bonus" : "Tambah Aturan Bonus"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mode Aturan <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={ruleMode}
              onChange={(e) => setRuleMode(e.target.value as BonusRuleMode)}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
            >
              {Object.entries(RULE_MODE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {ruleMode === "ratio"
                ? "Reward diberikan berkelipatan otomatis, mis. tiap 100 dus dapat 1 dus bonus (950 dus -> 9 dus bonus)."
                : "Reward diberikan sekali saat total dus terjual mencapai angka ini (tidak berkelipatan)."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ruleMode === "ratio"
                ? "Per Berapa Dus"
                : "Threshold (jumlah dus terjual)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={thresholdDus === 0 ? "" : thresholdDus}
              onChange={(e) =>
                handleNumberChange(setThresholdDus)(e.target.value)
              }
              placeholder={
                ruleMode === "ratio" ? "Contoh: 100" : "Contoh: 3000"
              }
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
            <p className="text-xs text-gray-400 mt-1">
              {ruleMode === "ratio"
                ? "Reward diulang tiap kelipatan angka ini tercapai dalam 1 periode (bulan)."
                : "Bonus diberikan jika total dus terjual karyawan dalam 1 periode (bulan) mencapai angka ini."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jenis Reward <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={rewardType}
                onChange={(e) =>
                  setRewardType(e.target.value as BonusRewardType)
                }
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
              >
                {Object.entries(REWARD_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nilai Reward {ruleMode === "ratio" ? "per Kelipatan" : ""}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={rewardValue === 0 ? "" : rewardValue}
                onChange={(e) =>
                  handleNumberChange(setRewardValue)(e.target.value)
                }
                placeholder={
                  rewardType === "uang"
                    ? "Nominal Rp"
                    : rewardType === "kaos"
                      ? "Jumlah kaos"
                      : "Jumlah dus bonus"
                }
                className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Berlaku Untuk <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as BonusAppliesTo)}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
            >
              {Object.entries(APPLIES_TO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              "Bonus Khusus Saja" hanya berlaku untuk karyawan yang ditandai
              centang bonus khusus di Manajemen Karyawan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Keterangan
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Bonus 1 dus tiap kelipatan 500 dus terjual"
              rows={2}
              className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(140,172,214,0.5)] text-blue-600 focus:ring-[#0249E1]/40 cursor-pointer"
            />
            <span className="text-sm text-gray-700">Aturan aktif</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 clay-amber clay-pressable text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Simpan Aturan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
