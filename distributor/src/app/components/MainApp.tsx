import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  User,
  LogOut,
  Wallet,
} from "lucide-react";
import { SalesUser } from "../services/SalesAppService";
import DashboardPage from "./DashboardPage";
import TransactionPage from "./TransactionPage";
import StockPage from "./StockPage";
import DistributionPage from "./DistributionPage";
import SetoranPage from "./SetoranPage";
import ProfilePage from "./ProfilePage";

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
  | "profile";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "transaction", label: "Jual", icon: ShoppingCart },
  { key: "stock", label: "Stok", icon: Package },
  { key: "distribution", label: "Distribusi", icon: Truck },
  { key: "setoran", label: "Setoran", icon: Wallet },
];

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

  const currentLabel =
    activeTab === "profile"
      ? "Profil"
      : (TABS.find((t) => t.key === activeTab)?.label ?? "Dashboard");

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
        return <TransactionPage salesId={localUser.salesId} />;
      case "stock":
        return <StockPage salesId={localUser.salesId} />;
      case "distribution":
        return <DistributionPage salesId={localUser.salesId} />;
      case "setoran":
        return <SetoranPage salesId={localUser.salesId} />;
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
    <div className="h-[100dvh] flex flex-col bg-gray-50 overflow-hidden relative">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-gradient-to-r from-blue-900 to-cyan-600 flex items-center px-4 gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <LayoutDashboard className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">
            {currentLabel}
          </p>
          <p className="text-[11px] text-white/75 leading-tight truncate">
            {localUser.namaSales}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="w-8.5 h-8.5 rounded-full bg-white/25 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          >
            {initials}
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {localUser.namaSales}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {localUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setActiveTab("profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <User className="w-4 h-4" /> Profil Saya
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden mt-14 mb-[60px]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {renderPage()}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-stretch h-[60px] pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                active ? "text-cyan-600" : "text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span
                className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
