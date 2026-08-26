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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [localUser, setLocalUser] = useState<SalesUser>(user);

  const handleProfileUpdated = (updated: Partial<SalesUser>) => {
    setLocalUser((prev) => ({ ...prev, ...updated }));
    onProfileUpdated?.(updated);
  };

  const requestLogout = () => setShowLogoutConfirm(true);

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
            onLogout={requestLogout}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col clay-page-bg overflow-hidden relative">
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-gradient-to-r from-[#0249E1] to-[#4a86f4] rounded-b-[28px] flex items-center px-5 gap-3 shadow-[0_10px_24px_rgba(2,55,150,0.35)]">
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
            className="clay-pressable w-9 h-9 rounded-2xl bg-gradient-to-br from-[#202b52] to-[#0c1330] flex items-center justify-center text-[#DAFB71] text-xs font-extrabold cursor-pointer shadow-[3px_3px_8px_rgba(4,8,26,0.4),-2px_-2px_6px_rgba(120,150,230,0.2)]"
          >
            {initials}
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-11 w-52 bg-gradient-to-br from-white to-[#eef5ff] rounded-2xl shadow-[10px_10px_24px_rgba(2,30,90,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#8cacd6]/20">
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
                    setActiveTab("profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#0249E1]/5 cursor-pointer"
                >
                  <User className="w-4 h-4" /> Profil Saya
                </button>
                <div className="border-t border-[#8cacd6]/20" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    requestLogout();
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
        <div className="relative bg-gradient-to-br from-white to-[#eef5ff] rounded-[28px] shadow-[10px_10px_24px_rgba(2,30,90,0.28),-8px_-8px_20px_rgba(255,255,255,0.9)] h-[64px] flex items-stretch px-2">
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
              className="clay-pressable w-16 h-16 rounded-full bg-gradient-to-br from-[#4a86f4] to-[#0249e1] shadow-[8px_8px_18px_rgba(2,55,150,0.45),-4px_-4px_12px_rgba(150,195,255,0.35)] flex items-center justify-center cursor-pointer"
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

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white to-[#eef5ff] rounded-[28px] w-full max-w-xs p-6 shadow-[10px_10px_24px_rgba(2,30,90,0.28),-8px_-8px_20px_rgba(255,255,255,0.9)]">
            <div className="w-12 h-12 rounded-2xl bg-[#EE3D5A]/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-[#EE3D5A]" />
            </div>
            <h3 className="text-center font-bold text-[#111111] text-base mb-1">
              Keluar dari akun?
            </h3>
            <p className="text-center text-sm text-[#111111]/50 mb-6">
              Anda perlu login kembali untuk mengakses Portal Sales.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm text-[#111111]/70 bg-white shadow-[4px_4px_10px_rgba(2,30,90,0.12),-4px_-4px_10px_rgba(255,255,255,0.9)] cursor-pointer"
              >
                Tidak
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white bg-gradient-to-br from-[#f4657d] to-[#EE3D5A] shadow-[4px_4px_10px_rgba(238,61,90,0.35),-2px_-2px_8px_rgba(255,255,255,0.3)] cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
