import { useState, useEffect } from "react";
import {
  Settings,
  ShoppingBag,
  TrendingUp,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  saveSubscriptionThreshold,
  SubscriptionThreshold,
} from "../../../services/subscriptionSettingsService";

interface SubscriptionThresholdPanelProps {
  threshold: SubscriptionThreshold;
  onSaved: (t: SubscriptionThreshold) => void;
}

export function SubscriptionThresholdPanel({
  threshold,
  onSaved,
}: SubscriptionThresholdPanelProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    min_total_price:
      threshold.min_total_price !== null
        ? String(threshold.min_total_price)
        : "",
    min_total_qty:
      threshold.min_total_qty !== null ? String(threshold.min_total_qty) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      min_total_price:
        threshold.min_total_price !== null
          ? String(threshold.min_total_price)
          : "",
      min_total_qty:
        threshold.min_total_qty !== null ? String(threshold.min_total_qty) : "",
    });
  }, [threshold]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload: SubscriptionThreshold = {
      min_total_price:
        form.min_total_price !== "" ? Number(form.min_total_price) : null,
      min_total_qty:
        form.min_total_qty !== "" ? Number(form.min_total_qty) : null,
    };

    const { error } = await saveSubscriptionThreshold(payload);
    if (error) {
      setError((error as any).message ?? "Gagal menyimpan pengaturan.");
    } else {
      onSaved(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const summaryLabel = (() => {
    const parts: string[] = [];
    if (threshold.min_total_price) {
      parts.push(
        `≥ Rp ${Number(threshold.min_total_price).toLocaleString("id-ID")}`,
      );
    }
    if (threshold.min_total_qty) {
      parts.push(`≥ ${threshold.min_total_qty} pcs`);
    }
    return parts.length > 0 ? parts.join(" atau ") : "Belum dikonfigurasi";
  })();

  return (
    <div className="clay-raised rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[rgba(215,233,255,0.5)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              Pengaturan Auto-Upgrade ke Langganan
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{summaryLabel}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-[rgba(140,172,214,0.2)] px-6 py-5 space-y-5">
          <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl flex gap-2.5">
            <Zap className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-800 leading-relaxed">
              <span className="font-semibold">Cara kerja:</span> Setiap kali
              transaksi baru berhasil disimpan, sistem otomatis menjumlahkan{" "}
              <em>seluruh riwayat</em> belanja pelanggan tersebut. Jika memenuhi{" "}
              <span className="font-semibold">salah satu</span> syarat di bawah,
              status pelanggan langsung diubah menjadi{" "}
              <span className="font-semibold">Langganan</span>. Admin tetap bisa
              mengubah status secara manual lewat tombol Edit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[rgba(140,172,214,0.35)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  Total Belanja (Rp)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.min_total_price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, min_total_price: e.target.value }))
                  }
                  className="w-full pl-10 pr-3 py-2.5 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="cth: 500000"
                />
              </div>
              <p className="text-xs text-gray-400">
                Kosongkan jika tidak digunakan
              </p>
            </div>

            <div className="border border-[rgba(140,172,214,0.35)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  Total Pembelian (Pcs)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={form.min_total_qty}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, min_total_qty: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-12"
                  placeholder="cth: 10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  pcs
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Kosongkan jika tidak digunakan
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 clay-inset-red border-0 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 clay-purple clay-pressable disabled:opacity-60 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Tersimpan!" : "Simpan Pengaturan"}
          </button>
        </div>
      )}
    </div>
  );
}
