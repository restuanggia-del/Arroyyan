import { Truck, Package, Users, CheckCircle } from "lucide-react";
import { formatNumber } from "../../../lib/formatters";

interface Props {
  loading: boolean;
  totalDistribusi: number;
  totalQty: number;
  jumlahSales: number;
  totalDiterima: number;
}

export function DistribusiSalesSummaryCards({
  loading,
  totalDistribusi,
  totalQty,
  jumlahSales,
  totalDiterima,
}: Props) {
  const val = (v: string) => (loading ? "—" : v);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="clay-raised rounded-lg p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-sm text-gray-600 mb-1">Total Distribusi</h3>
        <p className="text-2xl font-bold text-gray-900">
          {val(formatNumber(totalDistribusi))}
        </p>
      </div>
      <div className="clay-raised rounded-lg p-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <Package className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-sm text-gray-600 mb-1">
          Total Barang Didistribusi
        </h3>
        <p className="text-2xl font-bold text-gray-900">
          {val(`${formatNumber(totalQty)} unit`)}
        </p>
      </div>
      <div className="clay-raised rounded-lg p-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-sm text-gray-600 mb-1">Sales Menerima</h3>
        <p className="text-2xl font-bold text-gray-900">
          {val(formatNumber(jumlahSales))}
        </p>
      </div>
      <div className="clay-raised rounded-lg p-6">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-orange-600" />
        </div>
        <h3 className="text-sm text-gray-600 mb-1">Sudah Diterima</h3>
        <p className="text-2xl font-bold text-gray-900">
          {val(
            `${formatNumber(totalDiterima)} / ${formatNumber(totalDistribusi)}`,
          )}
        </p>
      </div>
    </div>
  );
}
