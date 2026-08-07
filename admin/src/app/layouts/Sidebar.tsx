import { useState } from "react";
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
  Award,
  HardHat,
  Factory,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  HandCoins,
  ClipboardCheck,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      manajemen: false,
      transaksi: false,
      "komisi-keuangan": false,
      laporan: false,
    },
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "manajemen",
      label: "Manajemen",
      icon: <Users className="w-5 h-5" />,
      children: [
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
      ],
    },
    {
      id: "distribusi",
      label: "Distribusi",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "transaksi",
      label: "Transaksi",
      icon: <ShoppingCart className="w-5 h-5" />,
      children: [
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
      ],
    },
    {
      id: "komisi-keuangan",
      label: "Komisi & Keuangan",
      icon: <Wallet2 className="w-5 h-5" />,
      children: [
        {
          id: "potongan-setoran",
          label: "Potongan & Setoran",
          icon: <Wallet2 className="w-5 h-5" />,
        },
        {
          id: "bonus",
          label: "Bonus Karyawan",
          icon: <Award className="w-5 h-5" />,
        },
        {
          id: "handling-fee",
          label: "Handling Fee",
          icon: <HardHat className="w-5 h-5" />,
        },
        {
          id: "insentif",
          label: "Insentif & Fee Penjualan",
          icon: <Factory className="w-5 h-5" />,
        },
        {
          id: "fee-rekapan",
          label: "Fee Rekapan",
          icon: <FileSpreadsheet className="w-5 h-5" />,
        },
      ],
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: <FileText className="w-5 h-5" />,
      children: [
        {
          id: "laporan",
          label: "Laporan Penjualan",
          icon: <FileText className="w-5 h-5" />,
        },
        {
          id: "laporan-bonus",
          label: "Laporan Bonus",
          icon: <Award className="w-5 h-5" />,
        },
        {
          id: "laporan-sales",
          label: "Laporan Sales",
          icon: <HandCoins className="w-5 h-5" />,
        },
        {
          id: "laporan-handling-fee",
          label: "Laporan Handling Fee",
          icon: <HardHat className="w-5 h-5" />,
        },
        {
          id: "laporan-insentif",
          label: "Laporan Insentif",
          icon: <Factory className="w-5 h-5" />,
        },
        {
          id: "laporan-tanda-terima-insentif",
          label: "Tanda Terima Insentif",
          icon: <ClipboardCheck className="w-5 h-5" />,
        },
        {
          id: "laporan-global",
          label: "Laporan Global",
          icon: <FileText className="w-5 h-5" />,
        },
      ],
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
      label: "Pengaturan",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isExpanded = expandedGroups[item.id];
          const isParentActive =
            hasChildren &&
            item.children!.some((child) => activeMenu === child.id);

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(item.id);
                  } else {
                    onMenuChange(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between gap-3 px-6 py-3 text-sm transition-colors cursor-pointer ${
                  activeMenu === item.id || isParentActive
                    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                </span>
                {hasChildren && (
                  <span className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>

              {hasChildren && isExpanded && (
                <div className="bg-gray-50/70 py-1">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onMenuChange(child.id)}
                      className={`w-full flex items-center gap-3 px-8 py-2.5 text-sm transition-colors cursor-pointer ${
                        activeMenu === child.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                      <span className="flex-1 text-left">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
