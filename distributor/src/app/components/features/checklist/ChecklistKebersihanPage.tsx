import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Truck,
  CalendarDays,
  CheckCircle2,
  Circle,
  RefreshCw,
  AlertCircle,
  Save,
  History,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { SalesUser } from "../../../services";
import {
  CHECKLIST_KEBERSIHAN_ITEMS,
  buildEmptyItems,
  getVehiclesUsed,
  getChecklistByDate,
  getChecklistHistory,
  saveChecklist,
  ChecklistItemValue,
  VehicleChecklist,
} from "../../../services/checklistKebersihanService";

interface ChecklistKebersihanPageProps {
  user: SalesUser;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const currentPeriode = () => new Date().toISOString().slice(0, 7);

const formatTanggal = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTanggalShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

export default function ChecklistKebersihanPage({
  user,
}: ChecklistKebersihanPageProps) {
  const [tanggal, setTanggal] = useState(todayStr());
  const [kendaraan, setKendaraan] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [paraf, setParaf] = useState(user.namaSales);
  const [keteranganUmum, setKeteranganUmum] = useState("");
  const [items, setItems] = useState<ChecklistItemValue[]>(buildEmptyItems());
  const [existingId, setExistingId] = useState<string | null>(null);

  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [history, setHistory] = useState<VehicleChecklist[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [detailChecklist, setDetailChecklist] =
    useState<VehicleChecklist | null>(null);

  const checkedCount = useMemo(
    () => items.filter((i) => i.isChecked).length,
    [items],
  );

  const loadVehicles = useCallback(async () => {
    try {
      const list = await getVehiclesUsed(user.salesId);
      setVehicleOptions(list);
      if (!kendaraan && list.length > 0) setKendaraan(list[0]);
    } catch {}
  }, [user.salesId]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getChecklistHistory(user.salesId, currentPeriode());
      setHistory(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat riwayat checklist.");
    } finally {
      setLoadingHistory(false);
    }
  }, [user.salesId]);

  useEffect(() => {
    loadVehicles();
    loadHistory();
  }, [loadVehicles, loadHistory]);

  const loadEntryForSelection = useCallback(async () => {
    if (!kendaraan.trim()) {
      setItems(buildEmptyItems());
      setExistingId(null);
      setKeteranganUmum("");
      return;
    }
    setLoadingEntry(true);
    setError("");
    try {
      const existing = await getChecklistByDate(
        user.salesId,
        kendaraan.trim(),
        tanggal,
      );
      if (existing) {
        setItems(existing.items);
        setKeteranganUmum(existing.keteranganUmum);
        setParaf(existing.paraf || user.namaSales);
        setExistingId(existing.id);
      } else {
        setItems(buildEmptyItems());
        setKeteranganUmum("");
        setParaf(user.namaSales);
        setExistingId(null);
      }
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data checklist.");
    } finally {
      setLoadingEntry(false);
    }
  }, [kendaraan, tanggal, user.salesId, user.namaSales]);

  useEffect(() => {
    loadEntryForSelection();
  }, [loadEntryForSelection]);

  const toggleItem = (itemNo: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.itemNo === itemNo ? { ...it, isChecked: !it.isChecked } : it,
      ),
    );
  };

  const updateItemNote = (itemNo: number, note: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.itemNo === itemNo ? { ...it, keterangan: note } : it,
      ),
    );
  };

  const handleSave = async () => {
    setError("");
    setSuccessMsg("");
    if (!kendaraan.trim()) {
      setError("Nomor polisi / kendaraan wajib diisi.");
      return;
    }
    if (!paraf.trim()) {
      setError("Paraf wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      await saveChecklist(user.salesId, {
        kendaraan: kendaraan.trim(),
        tanggal,
        paraf: paraf.trim(),
        keteranganUmum,
        items,
      });
      setSuccessMsg(
        existingId
          ? "Checklist berhasil diperbarui."
          : "Checklist berhasil disimpan.",
      );
      loadVehicles();
      loadHistory();
      loadEntryForSelection();
    } catch (err: any) {
      setError(err.message ?? "Gagal menyimpan checklist.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="bg-gradient-to-br from-[#4a86f4] to-[#0249E1] rounded-[28px] p-5 text-white relative overflow-hidden shadow-[10px_10px_24px_rgba(2,55,150,0.35),-6px_-6px_16px_rgba(150,195,255,0.25)]">
        <div className="absolute w-28 h-28 rounded-full bg-[#DAFB71]/20 blur-2xl -top-6 -right-6" />
        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#DAFB71]" />
          </div>
          <div>
            <p className="font-extrabold text-base">Checklist Kebersihan</p>
            <p className="text-xs text-white/80 font-medium">
              Kendaraan operasional — diisi setiap hari
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 clay-inset-sm rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#EE3D5A] flex-shrink-0" />
          <p className="text-sm text-[#EE3D5A] font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-3 clay-inset-sm rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2fae63] flex-shrink-0" />
          <p className="text-sm text-[#2fae63] font-medium">{successMsg}</p>
        </div>
      )}

      <div className="clay-raised rounded-3xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              max={todayStr()}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-1.5">
              <Truck className="w-3.5 h-3.5" /> Kendaraan
            </label>
            <input
              type="text"
              list="vehicle-options"
              value={kendaraan}
              onChange={(e) => setKendaraan(e.target.value.toUpperCase())}
              placeholder="cth. BE 8075 SN"
              className="w-full px-3 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 uppercase"
            />
            <datalist id="vehicle-options">
              {vehicleOptions.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
        </div>

        {existingId && (
          <p className="text-xs text-[#0249E1]/70 font-medium">
            Checklist untuk tanggal &amp; kendaraan ini sudah pernah diisi —
            perubahan akan memperbarui data yang sama.
          </p>
        )}
      </div>

      <div className="clay-raised rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111111]">
            Daftar Pemeriksaan
          </h3>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              checkedCount === CHECKLIST_KEBERSIHAN_ITEMS.length
                ? "bg-[#2fae63]/10 text-[#2fae63]"
                : "bg-[#EE3D5A]/10 text-[#EE3D5A]"
            }`}
          >
            {checkedCount}/{CHECKLIST_KEBERSIHAN_ITEMS.length} bersih
          </span>
        </div>

        {loadingEntry ? (
          <div className="py-10 text-center">
            <RefreshCw className="w-6 h-6 text-[#0249E1]/30 animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#111111]/40 font-medium">
              Memuat data...
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <ChecklistItemRow
                key={item.itemNo}
                item={item}
                onToggle={() => toggleItem(item.itemNo)}
                onNoteChange={(note) => updateItemNote(item.itemNo, note)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="clay-raised rounded-3xl p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-1.5">
            Catatan Tambahan (opsional)
          </label>
          <textarea
            value={keteranganUmum}
            onChange={(e) => setKeteranganUmum(e.target.value)}
            rows={2}
            placeholder="Kondisi umum kendaraan, kendala, dll."
            className="w-full px-3 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-1.5">
            Paraf
          </label>
          <input
            type="text"
            value={paraf}
            onChange={(e) => setParaf(e.target.value)}
            className="w-full px-3 py-2.5 clay-inset-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loadingEntry}
          className="w-full flex items-center justify-center gap-2 clay-blue clay-pressable text-white py-3 rounded-2xl text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {existingId ? "Perbarui Checklist" : "Simpan Checklist"}
        </button>
      </div>

      <div className="clay-raised rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#0249E1]" />
          <h3 className="text-sm font-bold text-[#111111]">
            Riwayat Bulan Ini
          </h3>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center">
            <RefreshCw className="w-6 h-6 text-[#111111]/25 animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#111111]/35">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-[#111111]/35 text-center py-6">
            Belum ada checklist yang diisi bulan ini.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => {
              const done = h.items.filter((i) => i.isChecked).length;
              const complete = done === h.items.length;
              return (
                <button
                  key={h.id}
                  onClick={() => setDetailChecklist(h)}
                  className="w-full flex items-center justify-between clay-raised-sm rounded-xl p-3 cursor-pointer text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">
                      {formatTanggalShort(h.tanggal)} · {h.kendaraan}
                    </p>
                    <p className="text-xs text-[#111111]/40">
                      Paraf: {h.paraf || "-"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      complete
                        ? "bg-[#2fae63]/10 text-[#2fae63]"
                        : "bg-[#EE3D5A]/10 text-[#EE3D5A]"
                    }`}
                  >
                    {done}/{h.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {detailChecklist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="clay-raised-lg rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(140,172,214,0.35)]">
              <div>
                <h2 className="font-bold text-[#111111]">
                  {detailChecklist.kendaraan}
                </h2>
                <p className="text-xs text-[#111111]/45">
                  {formatTanggal(detailChecklist.tanggal)}
                </p>
              </div>
              <button
                onClick={() => setDetailChecklist(null)}
                className="p-1.5 clay-raised-sm clay-pressable rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-[#111111]/45" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              {detailChecklist.items.map((it) => (
                <div
                  key={it.itemNo}
                  className="flex items-start gap-2.5 clay-raised-sm rounded-xl p-3"
                >
                  {it.isChecked ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#2fae63] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-[#EE3D5A] flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-[#111111] font-medium">
                      {it.itemName}
                    </p>
                    {it.keterangan && (
                      <p className="text-xs text-[#111111]/45 mt-0.5">
                        {it.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {detailChecklist.keteranganUmum && (
                <div className="clay-inset-sm rounded-xl p-3 mt-2">
                  <p className="text-[11px] font-bold text-[#111111]/45 uppercase tracking-wide mb-1">
                    Catatan
                  </p>
                  <p className="text-sm text-[#111111]/70">
                    {detailChecklist.keteranganUmum}
                  </p>
                </div>
              )}
              <p className="text-xs text-[#111111]/40 text-right pt-1">
                Paraf: {detailChecklist.paraf || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistItemRow({
  item,
  onToggle,
  onNoteChange,
}: {
  item: ChecklistItemValue;
  onToggle: () => void;
  onNoteChange: (note: string) => void;
}) {
  const [showNote, setShowNote] = useState(!!item.keterangan);

  return (
    <div className="clay-raised-sm rounded-xl p-3">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5 cursor-pointer"
        >
          {item.isChecked ? (
            <CheckCircle2 className="w-6 h-6 text-[#2fae63]" />
          ) : (
            <Circle className="w-6 h-6 text-[#111111]/25" />
          )}
        </button>
        <button onClick={onToggle} className="flex-1 text-left cursor-pointer">
          <p className="text-sm font-medium text-[#111111]">
            {item.itemNo}. {item.itemName}
          </p>
        </button>
        <button
          onClick={() => setShowNote((s) => !s)}
          className="flex-shrink-0 p-1 cursor-pointer"
        >
          {showNote ? (
            <ChevronUp className="w-4 h-4 text-[#111111]/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#111111]/30" />
          )}
        </button>
      </div>
      {showNote && (
        <input
          type="text"
          value={item.keterangan}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Catatan untuk item ini (opsional)"
          className="w-full mt-2 px-3 py-2 clay-inset-sm border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
        />
      )}
    </div>
  );
}
