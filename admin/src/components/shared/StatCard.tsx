import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-36 bg-gray-200 animate-pulse rounded mb-2" />
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
          )}
          {trend && !loading && (
            <p
              className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value} dari bulan lalu
            </p>
          )}
          {loading && (
            <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
          )}
        </div>
        <div
          className={`${color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
