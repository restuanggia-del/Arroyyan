import { useState } from "react";
import {
  Settings,
  Building2,
  MapPin,
  Save,
  FileText,
  Check,
} from "lucide-react";

interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  receiptHeader: string;
  receiptFooter: string;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "ARROYYAN99",
    address: "Tulang Bawang, Lampung",
    phone: "0821-xxxx-xxxx",
    email: "info@arroyyan99.com",
    receiptHeader: "Air Minum Dalam Kemasan",
    receiptFooter: "Terima kasih atas pembelian Anda!\nSemoga sehat selalu",
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    // Simpan pengaturan (dalam implementasi nyata, kirim ke backend)
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Struk
                </label>
                <input
                  type="text"
                  value={settings.receiptHeader}
                  onChange={(e) =>
                    handleChange("receiptHeader", e.target.value)
                  }
                  placeholder="Contoh: Air Minum Dalam Kemasan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Teks yang ditampilkan di bawah nama perusahaan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Struk
                </label>
                <textarea
                  value={settings.receiptFooter}
                  onChange={(e) =>
                    handleChange("receiptFooter", e.target.value)
                  }
                  rows={3}
                  placeholder="Contoh: Terima kasih atas pembelian Anda!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Teks penutup di bagian bawah struk (gunakan \n untuk baris
                  baru)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {isSaved && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Perubahan berhasil disimpan
                </span>
              </div>
            )}
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-5 h-5" />
              Simpan Perubahan
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Preview Struk</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 font-mono text-xs bg-gray-50">
              <div className="text-center mb-4">
                <h1 className="text-base font-bold mb-1">
                  {settings.companyName}
                </h1>
                <p className="text-gray-600">{settings.receiptHeader}</p>
                <p className="text-gray-600">{settings.address}</p>
                {settings.phone && (
                  <p className="text-gray-600">Tel: {settings.phone}</p>
                )}
              </div>

              <div className="border-t border-b border-gray-300 py-2 my-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Tanggal:</span>
                  <span>21/04/2026 14:30</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Kasir:</span>
                  <span>Admin</span>
                </div>
              </div>

              <table className="w-full mb-3 text-xs">
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

              <div className="text-center text-gray-600 whitespace-pre-line">
                {settings.receiptFooter}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Catatan Penting
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Perubahan akan diterapkan pada semua struk baru</li>
                  <li>• Pastikan informasi perusahaan sudah benar</li>
                  <li>
                    • Format struk menggunakan ukuran kertas thermal standar
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Informasi Sistem
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Versi Sistem</span>
                <span className="font-medium text-gray-900">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Terakhir Update</span>
                <span className="font-medium text-gray-900">21 Apr 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <span className="font-medium text-green-600">● Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
