import { Users, Star } from "lucide-react";

interface CustomerStatsCardsProps {
  loading: boolean;
  totalCustomers: number;
  totalSubscribed: number;
}

export function CustomerStatsCards({
  loading,
  totalCustomers,
  totalSubscribed,
}: CustomerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="clay-raised rounded-xl p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Total Pelanggan</p>
        <p className="text-2xl font-bold text-gray-900">
          {loading ? "—" : totalCustomers}
        </p>
      </div>
      <div className="clay-raised rounded-xl p-6">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
          <Star className="w-6 h-6 text-amber-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Pelanggan Langganan</p>
        <p className="text-2xl font-bold text-gray-900">
          {loading ? "—" : totalSubscribed}
        </p>
      </div>
    </div>
  );
}
