import { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  FileText,
  Save,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

interface CompanySettings {
  id?: string;
  company_name: string;
  company_address: string;
  receipt_footer: string;
  // field tambahan yang disimpan di UI tapi belum di schema — kita extend pakai jsonb atau kolom terpisah
  // untuk sementara phone & email & receipt_header kita simpan di receipt_footer sebagai metadata
  // ATAU kita tambah kolom via SQL — solusi terbaik: tambah kolom di Supabase
}

interface UISettings {
  company_name: string;
  company_address: string;
  phone: string;
  email: string;
  receipt_header: string;
  receipt_footer: string;
}

const DEFAULT_SETTINGS: UISettings = {
  company_name: "ARROYYAN99",
  company_address: "Bogatama, Tulang Bawang, Lampung",
  phone: "",
  email: "",
  receipt_header: "Air Minum Dalam Kemasan",
  receipt_footer: "Terima kasih atas pembelian Anda!\nSemoga sehat selalu 💧",
};

// ─── HELPER: simpan field tambahan di receipt_footer sebagai JSON suffix ──────
// Format: teks_footer|||{"phone":"...","email":"...","receipt_header":"..."}
const encodeSettings = (ui: UISettings) => ({
  company_name: ui.company_name,
  company_address: ui.company_address,
  receipt_footer:
    ui.receipt_footer +
    "|||" +
    JSON.stringify({
      phone: ui.phone,
      email: ui.email,
      receipt_header: ui.receipt_header,
    }),
});

const decodeSettings = (raw: CompanySettings): UISettings => {
  const parts = (raw.receipt_footer ?? "").split("|||");
  let extra = {
    phone: "",
    email: "",
    receipt_header: "Air Minum Dalam Kemasan",
  };
  if (parts[1]) {
    try {
      extra = JSON.parse(parts[1]);
    } catch {
      /* ignore */
    }
  }
  return {
    company_name: raw.company_name ?? DEFAULT_SETTINGS.company_name,
    company_address: raw.company_address ?? DEFAULT_SETTINGS.company_address,
    receipt_footer: parts[0] ?? DEFAULT_SETTINGS.receipt_footer,
    phone: extra.phone ?? "",
    email: extra.email ?? "",
    receipt_header: extra.receipt_header ?? DEFAULT_SETTINGS.receipt_header,
  };
};

export function SystemSettings() {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from("system_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        setError("Gagal memuat pengaturan.");
      } else if (data) {
        setSettingsId(data.id);
        setSettings(decodeSettings(data as CompanySettings));
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const payload = encodeSettings(settings);

    let err;
    if (settingsId) {
      ({ error: err } = await supabaseAdmin
        .from("system_settings")
        .update(payload)
        .eq("id", settingsId));
    } else {
      const { data, error: insertErr } = await supabaseAdmin
        .from("system_settings")
        .insert([payload])
        .select()
        .single();
      err = insertErr;
      if (data) setSettingsId(data.id);
    }

    if (err) {
      setError("Gagal menyimpan: " + err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleChange = (field: keyof UISettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const previewDate = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (loading) {
    return (
      <div className="p-8 py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Memuat pengaturan sistem...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Pengaturan Sistem
        </h1>
        <p className="text-gray-600">
          Kelola informasi perusahaan dan format struk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Informasi Perusahaan
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={settings.company_address}
                  onChange={(e) =>
                    handleChange("company_address", e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="info@arroyyan99.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Format Struk
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Header Struk
                </label>
                <input
                  type="text"
                  value={settings.receipt_header}
                  onChange={(e) =>
                    handleChange("receipt_header", e.target.value)
                  }
                  placeholder="Contoh: Air Minum Dalam Kemasan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ditampilkan di bawah nama perusahaan pada struk
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Footer Struk
                </label>
                <textarea
                  value={settings.receipt_footer}
                  onChange={(e) =>
                    handleChange("receipt_footer", e.target.value)
                  }
                  rows={3}
                  placeholder="Contoh: Terima kasih atas pembelian Anda!"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Teks penutup di bagian bawah struk
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Berhasil disimpan ke database
                </span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Preview Struk</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 font-mono text-xs bg-gray-50">
              <div className="text-center mb-4">
                <p className="text-base font-bold">
                  {settings.company_name || "—"}
                </p>
                <p className="text-gray-500">{settings.receipt_header}</p>
                <p className="text-gray-500">{settings.company_address}</p>
                {settings.phone && (
                  <p className="text-gray-500">Tel: {settings.phone}</p>
                )}
              </div>

              <div className="border-t border-b border-gray-300 py-2 my-3 space-y-1">
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{previewDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>Admin</span>
                </div>
              </div>

              <table className="w-full mb-3">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1">Cup Sedang</td>
                    <td className="text-center py-1">10</td>
                    <td className="text-right py-1">50.000</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t border-gray-300 pt-2 mb-3">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rp 50.000</span>
                </div>
              </div>

              <div className="text-center text-gray-500 whitespace-pre-line">
                {settings.receipt_footer}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-2">
                  Catatan Penting
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Perubahan diterapkan pada semua struk baru</li>
                  <li>• Data disimpan langsung ke database</li>
                  <li>• Format thermal standar 58mm</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Informasi Sistem
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Versi Sistem</span>
                <span className="font-medium text-gray-900">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Terakhir Update</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Database</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Settings ID</span>
                <span className="font-mono text-xs text-gray-400">
                  {settingsId
                    ? settingsId.slice(0, 8) + "..."
                    : "Belum disimpan"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
