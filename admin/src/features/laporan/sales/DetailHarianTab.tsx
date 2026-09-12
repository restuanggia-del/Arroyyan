import { RefreshCw, Info } from "lucide-react";
import { LaporanPenjualanResult } from "../../../services/laporanPenjualanService";
import { ProdukTableCard } from "../sales/ProdukTableCard";

interface DetailHarianTabProps {
  data: LaporanPenjualanResult | null;
  loading: boolean;
}

export function DetailHarianTab({ data, loading }: DetailHarianTabProps) {
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
    <div>
      <div className="clay-inset-amber border-0 rounded-lg p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Kolom nama sales menampilkan dus yang didistribusikan ke sales
          tersebut per hari. Tot. Keluar juga mencakup penjualan langsung dari
          stok pusat. Kolom Sisa Stock harian adalah kalkulasi berjalan (stok
          awal + produksi − keluar); baris TOTAL memakai stok gudang saat ini
          supaya sinkron dengan Laporan Global.
        </p>
      </div>
      {data.produk.every((p) => p.rows.length === 0) ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          Tidak ada aktivitas produk pada periode ini
        </p>
      ) : (
        data.produk.map((table) => (
          <ProdukTableCard
            key={table.product_id}
            table={table}
            salesColumns={data.sales_columns}
          />
        ))
      )}
    </div>
  );
}
