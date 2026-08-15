import { useState, useEffect } from "react";
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
  Briefcase,
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
        id: "sales",
        label: "Manajemen Sales",
        icon: <Briefcase className="w-5 h-5" />,
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
    label: "Distribusi ke Sales",
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
        label: "Laporan Transaksi",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        id: "laporan-sales",
        label: "Laporan Penjualan",
        icon: <HandCoins className="w-5 h-5" />,
      },
      {
        id: "laporan-bonus",
        label: "Laporan Bonus",
        icon: <Award className="w-5 h-5" />,
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

  useEffect(() => {
    const parent = menuItems.find((item) =>
      item.children?.some((child) => child.id === activeMenu),
    );
    if (parent && !expandedGroups[parent.id]) {
      setExpandedGroups((prev) => ({ ...prev, [parent.id]: true }));
    }
  }, [activeMenu]);

  return (
    <aside className="w-64 clay-sidebar h-screen flex flex-col overflow-hidden rounded-r-[32px] shadow-[10px_0_28px_rgba(15,23,42,0.10)]">
      <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto overscroll-contain">
        {menuItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isExpanded = expandedGroups[item.id];
          const isParentActive =
            hasChildren &&
            item.children!.some((child) => activeMenu === child.id);

          return (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(item.id);
                  } else {
                    onMenuChange(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm rounded-2xl transition-all cursor-pointer clay-pressable ${
                  activeMenu === item.id || isParentActive
                    ? "clay-sidebar-item-active font-semibold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                </span>
                {hasChildren && (
                  <span className="text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>

              {hasChildren && isExpanded && (
                <div className="py-1 pl-3">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onMenuChange(child.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer clay-pressable ${
                        activeMenu === child.id
                          ? "clay-sidebar-item-active font-semibold"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/80"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      <span className="flex-1 text-left">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200/80 bg-white/40 px-4 py-3">
        <div className="rounded-2xl bg-slate-50/80 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span className="font-medium">Versi Sistem</span>
            <span className="font-bold text-slate-900">v1.0.0</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Database</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
