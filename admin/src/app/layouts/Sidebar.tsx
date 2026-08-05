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
  Boxes,
  Wallet,
  Wallet2,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "karyawan",
      label: "Manajemen Karyawan",
      icon: <UserCheck className="w-5 h-5" />,
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
      id: "bahan",
      label: "Manajemen Bahan",
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      id: "pelanggan",
      label: "Manajemen Pelanggan",
      icon: <Users className="w-5 h-5" />,
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
      id: "titipan",
      label: "Transaksi Titipan (Kasbon)",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: "potongan-setoran",
      label: "Potongan & Setoran",
      icon: <Wallet2 className="w-5 h-5" />,
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
          </button>
        ))}
      </nav>
    </aside>
  );
}
