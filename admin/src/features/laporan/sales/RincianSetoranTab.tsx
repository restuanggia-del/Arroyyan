import { RefreshCw } from "lucide-react";
import { LaporanPenjualanResult } from "../../../services/laporanPenjualanService";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp, formatDus } from "../../../lib/formatters";
import { ItemBox } from "./ItemBox";

interface RincianSetoranTabProps {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}

export function RincianSetoranTab({ data, loading }: RincianSetoranTabProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Memuat laporan...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="text-center text-gray-400 py-12 text-sm">
        Gagal memuat data
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <ItemBox
        title="Potongan BBM"
        totalLabel="Total Potongan BBM"
        total={data.potongan.total_bbm}
        emptyText="Tidak ada potongan BBM bulan ini."
        rows={data.potongan.bbm.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Potongan Uang Makan"
        totalLabel="Total Uang Makan"
        total={data.potongan.total_uang_makan}
        emptyText="Tidak ada potongan uang makan bulan ini."
        rows={data.potongan.uang_makan.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Potongan Lain-lain"
        totalLabel="Total Lain-lain"
        total={data.potongan.total_lain_lain}
        emptyText="Tidak ada potongan lain-lain bulan ini."
        rows={data.potongan.lain_lain.map((p) => ({
          left: p.keterangan ?? "—",
          right: `${formatDate(p.tanggal)} · ${p.nama_karyawan}`,
          jumlah: p.jumlah,
        }))}
      />
      <ItemBox
        title="Pembayaran via Transfer"
        totalLabel="Total Transfer"
        total={data.transfer.total}
        emptyText="Tidak ada pembayaran via transfer bulan ini."
        rows={data.transfer.items.map((t) => ({
          left: t.keterangan,
          right: formatDate(t.tanggal),
          jumlah: t.jumlah,
        }))}
      />
      <ItemBox
        title="Setoran ke Owner"
        totalLabel="Total Setoran"
        total={data.setoran_owner.total}
        emptyText="Belum ada setoran ke owner bulan ini."
        rows={data.setoran_owner.items.map((s) => ({
          left: s.keterangan || s.nama_karyawan,
          right: `${formatDate(s.tanggal)} · ${s.nama_karyawan}`,
          jumlah: s.jumlah,
        }))}
      />

      <div className="clay-raised rounded-xl overflow-hidden mb-4">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-4 py-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Titip ke Toko-toko / Bon Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Otomatis dari transaksi titipan (kasbon) yang dibuat pada periode
            ini.
          </p>
        </div>
        {data.titipan.per_sales.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-4 py-3">
            Tidak ada transaksi titipan bulan ini.
          </p>
        ) : (
          data.titipan.per_sales.map((b) => (
            <div
              key={b.actor_id}
              className="border-b border-[rgba(140,172,214,0.2)] last:border-b-0"
            >
              <div className="px-4 py-2 bg-[rgba(215,233,255,0.4)] flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  Titipan {b.nama}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDus(b.total_dus)} dus · {formatRp(b.total_rp)}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {b.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-1.5"
                  >
                    <span className="text-xs text-gray-600">
                      {formatDate(it.tanggal)} — {it.keterangan}
                    </span>
                    <span className="text-xs text-gray-800">
                      {formatDus(it.dus)} dus · {formatRp(it.rp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div className="flex items-center justify-between px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <span className="text-sm font-bold text-gray-800">
            TOTAL TITIPAN DAN BON
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatDus(data.titipan.total_dus)} dus ·{" "}
            {formatRp(data.titipan.total_rp)}
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[rgba(140,172,214,0.35)] mt-6">
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-600">Total Penjualan</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatRp(data.ringkasan.total_penjualan_rp)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-orange-50">
            <span className="text-sm text-gray-700">Total Potongan</span>
            <span className="text-sm font-semibold text-orange-700">
              {formatRp(data.ringkasan.total_potongan_semua)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-yellow-100">
            <span className="text-sm font-bold text-gray-800">
              Sisa Penjualan
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatRp(data.ringkasan.sisa_penjualan_rp)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-4 bg-green-500">
            <span className="font-bold text-white">Dibulatkan</span>
            <span className="font-bold text-white text-lg">
              {formatRp(data.ringkasan.dibulatkan_rp)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 px-1 pt-2">
        Total Potongan = Potongan (BBM + Uang Makan + Lain-lain) + Pembayaran
        via Transfer + Setoran ke Owner + Titip ke Toko-toko/Bon bulan ini. Sisa
        Penjualan = Total Penjualan − Total Potongan.
      </p>
    </div>
  );
}
