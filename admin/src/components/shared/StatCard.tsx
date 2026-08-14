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
    <div className="clay-raised clay-pressable rounded-3xl p-6 transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#5b6a8f] font-medium mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-36 clay-inset-sm animate-pulse rounded-xl mb-2" />
          ) : (
            <h3 className="text-2xl font-extrabold text-[#10193a] mb-2">
              {value}
            </h3>
          )}
          {trend && !loading && (
            <p
              className={`text-xs font-semibold ${trend.isPositive ? "text-[#1fb262]" : "text-[#ee3d5a]"}`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value} dari bulan lalu
            </p>
          )}
          {loading && (
            <div className="h-3 w-24 clay-inset-sm animate-pulse rounded-lg" />
          )}
        </div>
        <div
          className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[4px_4px_10px_rgba(2,55,150,0.3),-3px_-3px_8px_rgba(150,195,255,0.25)]`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
