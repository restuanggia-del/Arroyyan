import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  History,
  Settings,
  UserCheck,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
  pendingDistributorCount?: number;
}

export function Sidebar({
  activeMenu,
  onMenuChange,
  pendingDistributorCount = 0,
}: SidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "distributor",
      label: "Manajemen Distributor",
      icon: <UserCheck className="w-5 h-5" />,
      badge: pendingDistributorCount > 0 ? pendingDistributorCount : undefined,
    },
    {
      id: "produk",
      label: "Manajemen Produk",
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: "stok",
      label: "Manajemen Stok",
      icon: <Warehouse className="w-5 h-5" />,
    },
    {
      id: "distribusi",
      label: "Distribusi",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "transaksi",
      label: "Transaksi Penjualan",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: "pelanggan",
      label: "Pelanggan",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "prediksi",
      label: "Prediksi Penjualan",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: "log",
      label: "Audit & Log",
      icon: <History className="w-5 h-5" />,
    },
    {
      id: "pengaturan",
      label: "Pengaturan Sistem",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuChange(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors cursor-pointer ${
              activeMenu === item.id
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {/* Badge notifikasi untuk pending distributor */}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
