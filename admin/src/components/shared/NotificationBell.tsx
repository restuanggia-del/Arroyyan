import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  ShoppingCart,
  Wallet,
  Users,
  Package,
  Settings,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  NotificationItem,
  NotificationKind,
  getRecentNotifications,
  subscribeToNewNotifications,
  countUnread,
  markNotificationsSeenNow,
} from "../../services/notificationService";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; bg: string; text: string; label: string }
> = {
  penjualan: {
    icon: ShoppingCart,
    bg: "bg-blue-100",
    text: "text-blue-600",
    label: "Penjualan",
  },
  keuangan: {
    icon: Wallet,
    bg: "bg-green-100",
    text: "text-green-600",
    label: "Keuangan",
  },
  karyawan_sales: {
    icon: Users,
    bg: "bg-purple-100",
    text: "text-purple-600",
    label: "Karyawan/Sales",
  },
  produk: {
    icon: Package,
    bg: "bg-orange-100",
    text: "text-orange-600",
    label: "Produk",
  },
  sistem: {
    icon: Settings,
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Sistem",
  },
  lainnya: {
    icon: Bell,
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: "Lainnya",
  },
};

const timeAgo = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const MAX_ITEMS = 30;

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    const { data } = await getRecentNotifications(MAX_ITEMS);
    const list = data ?? [];
    setItems(list);
    setUnreadCount(countUnread(list));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitial();

    const unsubscribe = subscribeToNewNotifications((newItem) => {
      setItems((prev) => {
        if (prev.some((p) => p.id === newItem.id)) return prev;
        return [newItem, ...prev].slice(0, MAX_ITEMS);
      });
      setUnreadCount((prev) => prev + 1);
      toast.info(newItem.description, {
        description: timeAgo(newItem.created_at),
      });
    });

    return () => unsubscribe();
  }, [fetchInitial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      markNotificationsSeenNow();
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-lg hover:bg-[rgba(215,233,255,0.55)] transition-colors cursor-pointer"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5 text-[#5b6a8f]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 clay-raised-lg rounded-xl z-50 max-h-[28rem] flex flex-col">
          <div className="px-4 py-3 border-b border-[rgba(140,172,214,0.25)] flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-[#10193a]">Notifikasi</h3>
            <button
              onClick={fetchInitial}
              className="p-1.5 rounded-lg hover:bg-[rgba(215,233,255,0.55)] transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#8fa4d4]" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="py-10 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Memuat notifikasi...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada notifikasi</p>
              </div>
            ) : (
              items.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-[rgba(215,233,255,0.4)] transition-colors border-b border-[rgba(140,172,214,0.12)] last:border-b-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}
                    >
                      <Icon className={`w-4 h-4 ${meta.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#10193a] leading-snug">
                        {item.description}
                      </p>
                      <p className="text-xs text-[#8fa4d4] mt-0.5">
                        {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
