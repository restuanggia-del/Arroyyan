import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Award,
  Calculator,
  Save,
  Pencil,
} from "lucide-react";
import {
  BonusRule,
  BonusRecord,
  BonusPreviewRow,
  getBonusRules,
  deleteBonusRule,
  getBonusRecords,
  deleteBonusRecord,
  calculateBonusPreview,
  saveBonusRecords,
  REWARD_TYPE_LABEL,
  APPLIES_TO_LABEL,
} from "../../services/bonusService";
import { BonusRuleModal } from "./BonusRuleModal";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatDus = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 2 });

const currentPeriode = () => new Date().toISOString().slice(0, 7);

type PreviewState = (BonusPreviewRow & { catatan: string })[];

export function BonusManagement() {
  const [activeTab, setActiveTab] = useState<"aturan" | "rekap">("aturan");

  // --- Aturan Bonus ---
  const [rules, setRules] = useState<BonusRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<BonusRule | null>(
    null,
  );
  const [ruleActionLoading, setRuleActionLoading] = useState<string | null>(
    null,
  );

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    setRulesError(null);
    const { data, error } = await getBonusRules();
    if (error) setRulesError("Gagal memuat aturan bonus.");
    setRules(data || []);
    setLoadingRules(false);
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleRuleSaveSuccess = () => {
    setIsRuleModalOpen(false);
    setEditingRule(null);
    fetchRules();
  };

  const handleDeleteRuleConfirm = async () => {
    if (!confirmDeleteRule) return;
    setRuleActionLoading(confirmDeleteRule.id);
    const target = confirmDeleteRule;
    setConfirmDeleteRule(null);

    const { error } = await deleteBonusRule(target.id);
    if (error) {
      alert("Gagal menghapus aturan: " + (error as any).message);
    } else {
      setRules((prev) => prev.filter((r) => r.id !== target.id));
    }
    setRuleActionLoading(null);
  };

  // --- Rekap Bonus per Periode ---
  const [periode, setPeriode] = useState(currentPeriode());
  const [preview, setPreview] = useState<PreviewState>([]);
  const [savedRecords, setSavedRecords] = useState<BonusRecord[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rekapError, setRekapError] = useState<string | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [confirmDeleteRecord, setConfirmDeleteRecord] =
    useState<BonusRecord | null>(null);
  const [recordActionLoading, setRecordActionLoading] = useState<string | null>(
    null,
  );

  const fetchSavedRecords = useCallback(async (p: string) => {
    setLoadingSaved(true);
    const { data, error } = await getBonusRecords(p);
    if (error) setRekapError("Gagal memuat rekap bonus tersimpan.");
    setSavedRecords(data || []);
    setLoadingSaved(false);
  }, []);

  useEffect(() => {
    setPreview([]);
    fetchSavedRecords(periode);
  }, [periode, fetchSavedRecords]);

  const handleCalculate = async () => {
    setCalculating(true);
    setRekapError(null);
    const { data, error } = await calculateBonusPreview(periode);
    if (error) {
      setRekapError("Gagal menghitung bonus: " + (error as any).message);
      setCalculating(false);
      return;
    }
    setPreview((data || []).map((row) => ({ ...row, catatan: "" })));
    setCalculating(false);
  };

  const updatePreviewRow = (
    karyawanId: string,
    field: "bonus_dus" | "bonus_kaos" | "bonus_target_rp" | "catatan",
    value: string,
  ) => {
    setPreview((prev) =>
      prev.map((row) => {
        if (row.karyawan_id !== karyawanId) return row;
        if (field === "catatan") return { ...row, catatan: value };
        const num = value.replace(/\D/g, "");
        return { ...row, [field]: num === "" ? 0 : parseInt(num, 10) };
      }),
    );
  };

  const handleSaveRekap = async () => {
    if (preview.length === 0) return;
    setSaving(true);
    setRekapError(null);

    const { error } = await saveBonusRecords(
      periode,
      preview.map((row) => ({
        karyawan_id: row.karyawan_id,
        total_dus_terjual: row.total_dus_terjual,
        bonus_dus: row.bonus_dus,
        bonus_kaos: row.bonus_kaos,
        bonus_target_rp: row.bonus_target_rp,
        catatan: row.catatan || null,
      })),
    );

    if (error) {
      setRekapError("Gagal menyimpan rekap bonus: " + (error as any).message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setPreview([]);
    fetchSavedRecords(periode);
  };

  const handleDeleteRecordConfirm = async () => {
    if (!confirmDeleteRecord) return;
    setRecordActionLoading(confirmDeleteRecord.id);
    const target = confirmDeleteRecord;
    setConfirmDeleteRecord(null);

    const { error } = await deleteBonusRecord(target.id);
    if (error) {
      alert("Gagal menghapus rekap: " + (error as any).message);
    } else {
      setSavedRecords((prev) => prev.filter((r) => r.id !== target.id));
    }
    setRecordActionLoading(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Bonus Karyawan
          </h1>
          <p className="text-gray-600">
            Atur aturan threshold bonus dan hitung rekap bonus penjualan per
            periode
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "aturan", label: "Aturan Bonus" },
          { id: "rekap", label: "Rekap Bonus per Periode" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "aturan" | "rekap")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "aturan" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingRule(null);
                setIsRuleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Aturan
            </button>
          </div>

          {rulesError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{rulesError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loadingRules ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[
                        "Threshold (dus)",
                        "Jenis Reward",
                        "Nilai",
                        "Berlaku Untuk",
                        "Status",
                        "Aksi",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rules.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-gray-500 text-sm"
                        >
                          Belum ada aturan bonus. Tambahkan aturan pertama.
                        </td>
                      </tr>
                    ) : (
                      rules.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                            {formatDus(r.threshold_dus)} dus
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              {REWARD_TYPE_LABEL[r.reward_type]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {r.reward_type === "uang"
                              ? formatRp(r.reward_value)
                              : `${r.reward_value} ${r.reward_type === "kaos" ? "pcs" : "dus"}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {APPLIES_TO_LABEL[r.applies_to]}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                r.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {r.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ruleActionLoading === r.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingRule(r);
                                    setIsRuleModalOpen(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteRule(r)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "rekap" && (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Periode
                </label>
                <input
                  type="month"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {calculating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                Hitung Bonus Periode Ini
              </button>
              {preview.length > 0 && (
                <button
                  onClick={handleSaveRekap}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Rekap
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hasil hitung otomatis berdasarkan total dus terjual (dari
              transaksi penjualan) yang cocok dengan Aturan Bonus. Nilai bonus
              dus/kaos/uang di bawah bisa diedit manual sebelum disimpan.
            </p>
          </div>

          {rekapError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{rekapError}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview Hasil Hitung — Periode {periode}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Belum tersimpan. Klik "Simpan Rekap" di atas untuk menyimpan.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[
                        "Karyawan",
                        "Total Dus Terjual",
                        "Bonus Dus",
                        "Bonus Kaos",
                        "Bonus Uang (Rp)",
                        "Catatan",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr
                        key={row.karyawan_id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {row.nama}
                          {row.bonus_khusus && (
                            <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                              Bonus Khusus
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {formatDus(row.total_dus_terjual)}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.bonus_dus === 0 ? "" : row.bonus_dus}
                            onChange={(e) =>
                              updatePreviewRow(
                                row.karyawan_id,
                                "bonus_dus",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.bonus_kaos === 0 ? "" : row.bonus_kaos}
                            onChange={(e) =>
                              updatePreviewRow(
                                row.karyawan_id,
                                "bonus_kaos",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              row.bonus_target_rp === 0
                                ? ""
                                : row.bonus_target_rp
                            }
                            onChange={(e) =>
                              updatePreviewRow(
                                row.karyawan_id,
                                "bonus_target_rp",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={row.catatan}
                            onChange={(e) =>
                              updatePreviewRow(
                                row.karyawan_id,
                                "catatan",
                                e.target.value,
                              )
                            }
                            placeholder="opsional"
                            className="w-40 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Rekap Tersimpan — Periode {periode}
              </h2>
            </div>
            {loadingSaved ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[
                        "Karyawan",
                        "Total Dus Terjual",
                        "Bonus Dus",
                        "Bonus Kaos",
                        "Bonus Uang",
                        "Catatan",
                        "Aksi",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savedRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-gray-500 text-sm"
                        >
                          Belum ada rekap bonus tersimpan untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      savedRecords.map((rec) => (
                        <tr
                          key={rec.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {rec.karyawan?.nama ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {formatDus(Number(rec.total_dus_terjual))}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {rec.bonus_dus}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {rec.bonus_kaos}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-green-700">
                            {formatRp(Number(rec.bonus_target_rp))}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                            {rec.catatan || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {recordActionLoading === rec.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteRecord(rec)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {isRuleModalOpen && (
        <BonusRuleModal
          rule={editingRule}
          onClose={() => {
            setIsRuleModalOpen(false);
            setEditingRule(null);
          }}
          onSaveSuccess={handleRuleSaveSuccess}
        />
      )}

      {confirmDeleteRule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Aturan Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {formatDus(confirmDeleteRule.threshold_dus)} dus →{" "}
                {REWARD_TYPE_LABEL[confirmDeleteRule.reward_type]}
              </span>
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              Data yang sudah dihapus tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteRule(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteRuleConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Hapus Rekap Bonus Ini?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              <span className="font-medium">
                {confirmDeleteRecord.karyawan?.nama ?? ""}
              </span>{" "}
              — periode {confirmDeleteRecord.periode}
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              Data yang sudah dihapus tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteRecord(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteRecordConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
