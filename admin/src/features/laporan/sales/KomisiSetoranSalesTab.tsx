import { RefreshCw } from "lucide-react";
import { LaporanPenjualanResult } from "../../../services/laporanPenjualanService";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp, formatDus } from "../../../lib/formatters";
import { ItemBox } from "./ItemBox";

interface KomisiSetoranSalesTabProps {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}

export function KomisiSetoranSalesTab({
  data,
  loading,
}: KomisiSetoranSalesTabProps) {
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

  const totalSetoranSales =
    data.setoran_sales.total_cash + data.setoran_sales.total_transfer;

  return (
    <div className="space-y-6">
      <div className="clay-raised rounded-xl overflow-hidden">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-5 py-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Komisi Sales Bulan Ini
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Dihitung otomatis dari selisih harga jual sales vs harga pabrik, per
            transaksi.
          </p>
        </div>
        {data.komisi_sales.rows.length === 0 ? (
          <p className="text-xs text-gray-400 italic px-5 py-4">
            Belum ada transaksi sales pada periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[rgba(215,233,255,0.4)] border-b border-[rgba(140,172,214,0.35)] text-gray-600 text-xs">
                  <th className="text-left py-2.5 px-4 font-semibold">Sales</th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Dus Terjual
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Omzet (Harga Pabrik)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold">
                    Omzet (Harga Jual)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold bg-green-50">
                    Komisi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.komisi_sales.rows.map((r) => (
                  <tr
                    key={r.sales_id}
                    className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                  >
                    <td className="py-2.5 px-4 font-medium text-gray-900">
                      {r.nama_sales}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {formatDus(r.total_dus_terjual)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {formatRp(r.total_omzet_pabrik)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {formatRp(r.total_omzet_jual)}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-semibold bg-green-50/50 ${
                        r.total_komisi >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {formatRp(r.total_komisi)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[rgba(140,172,214,0.4)] bg-[rgba(215,233,255,0.4)] font-semibold">
                  <td className="py-2.5 px-4" colSpan={4}>
                    TOTAL KOMISI SALES
                  </td>
                  <td className="py-2.5 px-4 text-right bg-green-100 text-green-800">
                    {formatRp(data.komisi_sales.total_komisi)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400 px-5 py-3 border-t border-[rgba(140,172,214,0.2)]">
          Catatan: laporan omzet resmi perusahaan (di tab "Detail Harian per
          Produk" &amp; "Rincian Setoran") menggunakan kolom Omzet (Harga
          Pabrik) di atas — bukan harga jual sales.
        </p>
      </div>

      <ItemBox
        title="Setoran Sales ke Admin"
        totalLabel="Total Setoran (Cash + Transfer)"
        total={totalSetoranSales}
        emptyText="Belum ada setoran sales bulan ini."
        rows={data.setoran_sales.items.map((s) => ({
          left: s.keterangan || s.nama_sales,
          right: `${formatDate(s.tanggal)} · ${s.nama_sales} · Cash ${formatRp(s.jumlah_cash)} / Transfer ${formatRp(s.jumlah_transfer)}`,
          jumlah: s.jumlah_cash + s.jumlah_transfer,
        }))}
      />
    </div>
  );
}
