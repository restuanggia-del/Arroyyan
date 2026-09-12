import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getKartuStokSemuaProduk,
  KartuStokProduk,
} from "../../../services/laporanStokService";
import { today, firstOfMonth, formatDate } from "../../../lib/dateUtils";
import {
  exportKartuStokToExcel,
  exportKartuStokToPDF,
} from "../stok/laporanKartuStokExportUtils";

const CATEGORY_LABEL: Record<string, string> = {
  cup: "Cup",
  botol: "Botol",
  galon: "Galon",
};

export function KartuStokTab() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [produk, setProduk] = useState<KartuStokProduk[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getKartuStokSemuaProduk(start, end);
    if (error) setError("Gagal memuat kartu stok: " + (error as any).message);
    setProduk(data || []);
    if (data && data.length > 0) {
      setSelectedId((prev) =>
        data.some((p) => p.product_id === prev) ? prev : data[0].product_id,
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [startDate, endDate, fetchData]);

  const selected = useMemo(
    () => produk.find((p) => p.product_id === selectedId) ?? null,
    [produk, selectedId],
  );

  const handleExportPDF = async () => {
    setExportingType("pdf");
    try {
      await exportKartuStokToPDF(produk, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingType("excel");
    try {
      await exportKartuStokToExcel(produk, startDate, endDate);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="clay-raised rounded-xl">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-end gap-3 flex-wrap">
          <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Pergerakan Sejak
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <span className="text-gray-400 mb-2.5">—</span>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Lihat Produk
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
            >
              {produk.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                  {p.size ? ` ${p.size}` : ""} —{" "}
                  {CATEGORY_LABEL[p.category] ?? p.category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={
              loading ||
              produk.length === 0 ||
              (exportingType !== null && exportingType !== "pdf")
            }
            className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {exportingType === "pdf" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <File className="w-4 h-4" />
            )}
            Export PDF (Semua Produk)
          </button>
          <button
            onClick={handleExportExcel}
            disabled={
              loading ||
              produk.length === 0 ||
              (exportingType !== null && exportingType !== "excel")
            }
            className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {exportingType === "excel" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export Excel (Semua Produk)
          </button>
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs text-gray-400 mb-4">
          Kartu stok per transaksi, formatnya mengikuti form fisik "Kartu Stok"
          (Dok. No. F.8.6-2). Kolom "Sisa" dihitung berjalan dari seluruh
          histori, jadi tetap akurat meskipun rentang tanggal di atas
          dipersempit. Tombol Export menghasilkan 1 dokumen berisi kartu stok
          semua produk aktif sekaligus.
        </p>

        {error && (
          <div className="mb-4 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Memuat kartu stok...</p>
          </div>
        ) : !selected ? (
          <p className="text-center text-gray-400 py-12 text-sm">
            Belum ada produk aktif
          </p>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Gudang:{" "}
                <span className="font-medium text-gray-800">Produk</span>
              </p>
              <p className="text-sm text-gray-500">
                Nama Barang:{" "}
                <span className="font-medium text-gray-800">
                  {selected.product_name}
                  {selected.size ? ` ${selected.size}` : ""}
                  {selected.isi_per_dus
                    ? ` @ ${selected.isi_per_dus} pcs`
                    : ""}{" "}
                  ({CATEGORY_LABEL[selected.category] ?? selected.category})
                </span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[rgba(140,172,214,0.35)]">
                    {["Tanggal", "Uraian", "Masuk", "Keluar", "Sisa"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(140,172,214,0.2)] bg-[rgba(215,233,255,0.4)]">
                    <td className="py-2 px-3 whitespace-nowrap">
                      {formatDate(startDate)}
                    </td>
                    <td className="py-2 px-3 font-medium">Stok Awal</td>
                    <td className="py-2 px-3 text-right"></td>
                    <td className="py-2 px-3 text-right"></td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {selected.stok_awal}
                    </td>
                  </tr>
                  {selected.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-gray-400 py-8 text-sm"
                      >
                        Tidak ada transaksi pada rentang tanggal ini
                      </td>
                    </tr>
                  ) : (
                    selected.rows.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="py-2 px-3">{r.uraian}</td>
                        <td className="py-2 px-3 text-right text-green-700">
                          {r.masuk || ""}
                        </td>
                        <td className="py-2 px-3 text-right text-red-600">
                          {r.keluar || ""}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {r.sisa}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
