import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  User,
  LogOut,
  Wallet,
  Plus,
  History,
  Users,
} from "lucide-react";
import { SalesUser } from "../../services";
import DashboardPage from "../features/dashboard/DashboardPage";
import TransactionPage from "../features/transaction/TransactionPage";
import StockPage from "../features/stock/StockPage";
import DistributionPage from "../features/distribution/DistributionPage";
import SetoranPage from "../features/setoran/SetoranPage";
import ProfilePage from "../features/profile/ProfilePage";
import TransactionHistory from "../features/history/TransactionHistory";
import CustomerPage from "../features/customer/CustomerPage";

interface MainAppProps {
  user: SalesUser;
  onLogout: () => void;
  onProfileUpdated?: (updated: Partial<SalesUser>) => void;
}

type TabKey =
  | "dashboard"
  | "transaction"
  | "stock"
  | "distribution"
  | "setoran"
  | "profile"
  | "history"
  | "customers";

const SIDE_TABS_LEFT: {
  key: TabKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "stock", label: "Stok", icon: Package },
];
const SIDE_TABS_RIGHT: {
  key: TabKey;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { key: "distribution", label: "Distribusi", icon: Truck },
  { key: "setoran", label: "Setoran", icon: Wallet },
];

const titleMap: Record<TabKey, string> = {
  dashboard: "Dashboard",
  transaction: "Transaksi Baru",
  stock: "Stok Saya",
  distribution: "Distribusi",
  setoran: "Setoran",
  profile: "Profil",
  history: "Riwayat Transaksi",
  customers: "Pelanggan",
};

export default function MainApp({
  user,
  onLogout,
  onProfileUpdated,
}: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [showMenu, setShowMenu] = useState(false);
  const [localUser, setLocalUser] = useState<SalesUser>(user);

  const handleProfileUpdated = (updated: Partial<SalesUser>) => {
    setLocalUser((prev) => ({ ...prev, ...updated }));
    onProfileUpdated?.(updated);
  };

  const initials = localUser.namaSales
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            user={localUser}
            onNavigate={(t) => setActiveTab(t as TabKey)}
          />
        );
      case "transaction":
        return (
          <TransactionPage
            salesId={localUser.salesId}
            onNavigate={(t) => setActiveTab(t as TabKey)}
          />
        );
      case "stock":
        return <StockPage salesId={localUser.salesId} />;
      case "distribution":
        return <DistributionPage salesId={localUser.salesId} />;
      case "setoran":
        return <SetoranPage salesId={localUser.salesId} />;
      case "history":
        return <TransactionHistory salesId={localUser.salesId} />;
      case "customers":
        return <CustomerPage salesId={localUser.salesId} mode="manage" />;
      case "profile":
        return (
          <ProfilePage
            user={localUser}
            onLogout={onLogout}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F4F7FE] overflow-hidden relative">
      {/* Top bar — gradient identitas Portal Sales */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-gradient-to-r from-[#0249E1] to-[#80B0EC] rounded-b-[28px] flex items-center px-5 gap-3 shadow-lg shadow-[#0249E1]/15">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-extrabold text-white leading-tight truncate">
            {titleMap[activeTab]}
          </p>
          <p className="text-[11px] text-white/80 font-medium leading-tight truncate">
            {localUser.namaSales}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="w-9 h-9 rounded-2xl bg-[#111111] flex items-center justify-center text-[#DAFB71] text-xs font-extrabold cursor-pointer"
          >
            {initials}
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-black/5 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5">
                  <p className="text-sm font-bold text-[#111111] truncate">
                    {localUser.namaSales}
                  </p>
                  <p className="text-xs text-[#111111]/50 truncate">
                    {localUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("history");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#F4F7FE] cursor-pointer"
                >
                  <History className="w-4 h-4" /> Riwayat Transaksi
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("customers");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#F4F7FE] cursor-pointer"
                >
                  <Users className="w-4 h-4" /> Kelola Pelanggan
                </button>
                <div className="border-t border-black/5" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#F4F7FE] cursor-pointer"
                >
                  <User className="w-4 h-4" /> Profil Saya
                </button>
                <div className="border-t border-black/5" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#EE3D5A] hover:bg-[#EE3D5A]/5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden mt-16 mb-[84px]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {renderPage()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-2 px-4">
        <div className="relative bg-white rounded-[28px] shadow-xl shadow-black/10 h-[64px] flex items-stretch px-2">
          {SIDE_TABS_LEFT.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-[#0249E1]" : "text-[#111111]/35"}`}
                />
                <span
                  className={`text-[10px] ${active ? "font-bold text-[#0249E1]" : "font-medium text-[#111111]/35"}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          <div className="w-16 flex-shrink-0" />

          {SIDE_TABS_RIGHT.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-[#0249E1]" : "text-[#111111]/35"}`}
                />
                <span
                  className={`text-[10px] ${active ? "font-bold text-[#0249E1]" : "font-medium text-[#111111]/35"}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          <div className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center gap-1">
            <button
              onClick={() => setActiveTab("transaction")}
              className="w-16 h-16 rounded-full bg-[#111111] shadow-lg shadow-black/25 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              {activeTab === "transaction" ? (
                <ShoppingCart className="w-6 h-6 text-[#DAFB71]" />
              ) : (
                <Plus className="w-6 h-6 text-[#DAFB71]" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
