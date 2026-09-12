import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getRekapanSetoran,
  RekapanSetoran,
} from "../../../services/rekapanSetoranService";
import { currentPeriode, formatDate } from "../../../lib/dateUtils";
import { formatRp } from "../../../lib/formatters";
import {
  exportRekapanSetoranToExcel,
  exportRekapanSetoranToPDF,
} from "./laporanGlobalExportUtils";
import { SetoranBox, SetoranRow } from "../global/SetoranComponents";

export function RekapanSetoranTab() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [data, setData] = useState<RekapanSetoran | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await getRekapanSetoran(p);
    if (error)
      setError("Gagal memuat rekapan setoran: " + (error as any).message);
    setData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(periode);
  }, [periode, fetchReport]);

  const handleExportPDF = async () => {
    if (!data) return;
    setExportingType("pdf");
    try {
      await exportRekapanSetoranToPDF(data, periode);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data) return;
    setExportingType("excel");
    try {
      await exportRekapanSetoranToExcel(data, periode);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div>
      <div className="clay-raised rounded-xl mb-6">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Periode
              </label>
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={
                loading ||
                !data ||
                (exportingType !== null && exportingType !== "pdf")
              }
              className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "pdf" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <File className="w-4 h-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={
                loading ||
                !data ||
                (exportingType !== null && exportingType !== "excel")
              }
              className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {exportingType === "excel" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 clay-inset-red border-0 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      ) : !data ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Gagal memuat data
        </p>
      ) : (
        <div className="space-y-6">
          <SetoranBox
            title="Hasil Penjualan & Pembayaran Titipan"
            totalLabel="TOTAL DANA"
            total={data.total_dana}
          >
            <SetoranRow
              label={`Penjualan Bulan ${periode}`}
              value={data.penjualan_bulan_ini}
            />
            {data.titipan_lama.map((t) => (
              <SetoranRow
                key={t.periode_asal}
                label={`Titipan Bulan ${t.periode_asal}`}
                value={t.jumlah}
              />
            ))}
            {data.titipan_lama.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada pembayaran titipan lama bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title="Pembayaran via Transfer"
            totalLabel="TOTAL TRANSFER"
            total={data.total_transfer}
          >
            <SetoranRow
              label={`Penjualan Bulan ${periode}`}
              value={data.transfer_penjualan}
            />
            {data.transfer_titipan.map((t, i) => (
              <SetoranRow
                key={i}
                label={`${formatDate(t.tanggal_bayar)} — Titipan ${t.nama}`}
                value={t.jumlah_transfer}
              />
            ))}
            {data.transfer_titipan.length === 0 &&
              data.transfer_penjualan === 0 && (
                <p className="text-xs text-gray-400 italic px-4 py-2">
                  Tidak ada pembayaran via transfer bulan ini.
                </p>
              )}
          </SetoranBox>

          <SetoranBox
            title="Potongan"
            totalLabel="TOTAL POTONGAN"
            total={data.total_potongan}
          >
            {data.potongan.map((p) => (
              <SetoranRow key={p.kategori} label={p.label} value={p.jumlah} />
            ))}
            {data.potongan.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada potongan bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title={`Titipan/Bon Sales Bulan ${periode} (belum collect)`}
            totalLabel="TOTAL"
            total={data.total_titipan_sales}
          >
            {data.titipan_sales_bulan_ini.map((t) => (
              <SetoranRow key={t.karyawan_id} label={t.nama} value={t.jumlah} />
            ))}
            {data.titipan_sales_bulan_ini.length === 0 && (
              <p className="text-xs text-gray-400 italic px-4 py-2">
                Tidak ada titipan/bon baru bulan ini.
              </p>
            )}
          </SetoranBox>

          <SetoranBox
            title="Insentif"
            totalLabel="TOTAL INSENTIF"
            total={data.insentif.total_insentif}
          >
            <SetoranRow
              label="Insentif Produksi"
              value={data.insentif.total_produksi}
            />
            <SetoranRow
              label="Fee Penjualan"
              value={data.insentif.total_fee_penjualan}
            />
            <SetoranRow label="Handling" value={data.insentif.total_handling} />
            <SetoranRow
              label="Fee Rekapan"
              value={data.insentif.total_fee_rekapan}
            />
            <SetoranRow
              label="Bonus Target"
              value={data.insentif.total_bonus_target}
            />
          </SetoranBox>

          <div className="rounded-xl overflow-hidden border-2 border-green-300">
            <div className="bg-green-500 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-lg">SISA DANA PENJUALAN</span>
              <span className="font-bold text-xl">
                {formatRp(data.sisa_dana_penjualan)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 px-1">
            Sisa Dana Penjualan = Total Dana − Potongan − Titipan/Bon baru bulan
            ini (belum collect) − Total Insentif − Pembayaran via Transfer. Ini
            proyeksi otomatis dari data yang sudah tersimpan, bukan pengganti
            pencatatan setoran aktual di menu Potongan &amp; Setoran.
          </p>
        </div>
      )}
    </div>
  );
}
