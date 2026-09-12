import {
  ProdukHarianTable,
  SalesColumn,
} from "../../../services/laporanPenjualanService";
import { formatDate } from "../../../lib/dateUtils";
import { formatRp, formatDus } from "../../../lib/formatters";
import { productLabel } from "./laporanSalesShared";

interface ProdukTableCardProps {
  table: ProdukHarianTable;
  salesColumns: SalesColumn[];
}

export function ProdukTableCard({ table, salesColumns }: ProdukTableCardProps) {
  return (
    <div className="clay-raised rounded-lg mb-6 overflow-hidden">
      <div className="border-b border-[rgba(140,172,214,0.35)] px-5 py-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          Catatan Penjualan — {productLabel(table)}
        </h3>
      </div>
      {table.rows.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          Tidak ada aktivitas produk ini pada periode ini
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[rgba(215,233,255,0.4)] border-b border-[rgba(140,172,214,0.35)] text-gray-600">
                <th className="text-left py-2 px-3 font-semibold">Tanggal</th>
                <th className="text-right py-2 px-3 font-semibold">
                  Stok Awal
                </th>
                <th className="text-right py-2 px-3 font-semibold">Produksi</th>
                {salesColumns.map((s) => (
                  <th
                    key={s.actor_id}
                    className="text-right py-2 px-3 font-semibold"
                  >
                    {s.nama}
                  </th>
                ))}
                <th className="text-right py-2 px-3 font-semibold">Bonus</th>
                <th className="text-right py-2 px-3 font-semibold">Retur</th>
                <th className="text-right py-2 px-3 font-semibold">Sodaqoh</th>
                <th className="text-right py-2 px-3 font-semibold">Pribadi</th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Tot. Keluar
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Terjual
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-blue-50">
                  Sisa Stock
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Jumlah (Rp)
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Dibayar
                </th>
                <th className="text-right py-2 px-3 font-semibold bg-green-50">
                  Bon
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr
                  key={r.tanggal}
                  className="border-b border-[rgba(140,172,214,0.2)] hover:bg-[rgba(215,233,255,0.5)]"
                >
                  <td className="py-2 px-3 text-gray-600">
                    {formatDate(r.tanggal)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.stok_awal_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.produksi_dus)}
                  </td>
                  {salesColumns.map((s) => (
                    <td key={s.actor_id} className="py-2 px-3 text-right">
                      {formatDus(r.distribusi[s.actor_id] ?? 0)}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.bonus_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.retur_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.sodaqoh_dus)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {formatDus(r.pribadi_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.total_keluar_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.terjual_dus)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium bg-blue-50/50">
                    {formatDus(r.sisa_stock_dus)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.jumlah_rp)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.dibayar_rp)}
                  </td>
                  <td className="py-2 px-3 text-right bg-green-50/50">
                    {formatRp(r.bon_rp)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[rgba(140,172,214,0.4)] bg-[rgba(215,233,255,0.4)] font-semibold">
                <td className="py-2.5 px-3">TOTAL</td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.stok_awal_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.produksi_dus)}
                </td>
                {salesColumns.map((s) => (
                  <td key={s.actor_id} className="py-2.5 px-3 text-right">
                    {formatDus(table.total.distribusi[s.actor_id] ?? 0)}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.bonus_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.retur_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.sodaqoh_dus)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {formatDus(table.total.pribadi_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.total_keluar_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.terjual_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-blue-100">
                  {formatDus(table.total.sisa_stock_dus)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.jumlah_rp)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.dibayar_rp)}
                </td>
                <td className="py-2.5 px-3 text-right bg-green-100 text-green-800">
                  {formatRp(table.total.bon_rp)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
