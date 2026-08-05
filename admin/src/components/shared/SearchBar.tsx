import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Package,
  Users,
  ShoppingCart,
  User,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type ResultCategory = "produk" | "karyawan" | "pelanggan" | "transaksi";

interface SearchResult {
  id: string;
  category: ResultCategory;
  title: string;
  subtitle: string;
  meta?: string;
}

interface SearchBarProps {
  onNavigate: (menu: string) => void;
}

const categoryConfig: Record<
  ResultCategory,
  { label: string; icon: React.ReactNode; color: string; menu: string }
> = {
  produk: {
    label: "Produk",
    icon: <Package className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-50",
    menu: "produk",
  },
  karyawan: {
    label: "Karyawan",
    icon: <Users className="w-4 h-4" />,
    color: "text-purple-600 bg-purple-50",
    menu: "karyawan",
  },
  pelanggan: {
    label: "Pelanggan",
    icon: <User className="w-4 h-4" />,
    color: "text-green-600 bg-green-50",
    menu: "pelanggan",
  },
  transaksi: {
    label: "Transaksi",
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-orange-600 bg-orange-50",
    menu: "transaksi",
  },
};

const searchAll = async (query: string): Promise<SearchResult[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  const [prodRes, karyawanRes, custRes, trxRes] = await Promise.all([
    // Produk
    supabaseAdmin
      .from("products")
      .select("id, product_name, category, price, is_active")
      .ilike("product_name", `%${q}%`)
      .limit(3),

    supabaseAdmin
      .from("karyawan")
      .select("id, nama, phone, address, is_active")
      .ilike("nama", `%${q}%`)
      .limit(3),

    supabaseAdmin
      .from("customers")
      .select("id, customer_name, phone, is_subscribed")
      .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(3),

    supabaseAdmin
      .from("transactions")
      .select(
        "id, total_price, payment_method, created_at, customers(customer_name)",
      )
      .or(`id.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  for (const p of (prodRes.data ?? []) as any[]) {
    results.push({
      id: p.id,
      category: "produk",
      title: p.product_name,
      subtitle: `${p.category === "cup" ? "Cup" : "Botol"} · ${p.is_active ? "Aktif" : "Nonaktif"}`,
      meta: `Rp ${(p.price ?? 0).toLocaleString("id-ID")}`,
    });
  }

  for (const d of (karyawanRes.data ?? []) as any[]) {
    results.push({
      id: d.id,
      category: "karyawan",
      title: d.nama,
      subtitle: d.phone ?? d.address ?? "—",
      meta: d.is_active ? "Aktif" : "Nonaktif",
    });
  }

  for (const c of (custRes.data ?? []) as any[]) {
    results.push({
      id: c.id,
      category: "pelanggan",
      title: c.customer_name,
      subtitle: c.phone ?? "—",
      meta: c.is_subscribed ? "⭐ Langganan" : "Reguler",
    });
  }

  for (const t of (trxRes.data ?? []) as any[]) {
    const customerName = (t.customers as any)?.customer_name ?? "Umum";
    results.push({
      id: t.id,
      category: "transaksi",
      title: `#${t.id.slice(0, 8).toUpperCase()}`,
      subtitle: customerName,
      meta: `Rp ${(t.total_price ?? 0).toLocaleString("id-ID")}`,
    });
  }

  return results;
};

export function SearchBar({ onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
    const found = await searchAll(q);
    setResults(found);
    setLoading(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (result: SearchResult) => {
    const config = categoryConfig[result.category];
    onNavigate(config.menu);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const grouped = Object.entries(categoryConfig)
    .map(([cat, config]) => ({
      category: cat as ResultCategory,
      config,
      items: results.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari produk, transaksi, karyawan, pelanggan..."
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-[420px] overflow-y-auto"
        >
          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Mencari...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">
                Tidak ada hasil untuk "{query}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Coba kata kunci yang berbeda
              </p>
            </div>
          ) : (
            <div className="py-2">
              {grouped.map(({ category, config, items }) => {
                const groupOffset = results.findIndex(
                  (r) => r.category === category,
                );

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {items.map((result, localIdx) => {
                      const globalIdx = groupOffset + localIdx;
                      const isActive = globalIdx === activeIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                            isActive ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}
                          >
                            {config.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result.meta && (
                              <span className="text-xs font-medium text-gray-600">
                                {result.meta}
                              </span>
                            )}
                            <ArrowRight
                              className={`w-3.5 h-3.5 transition-colors ${
                                isActive ? "text-blue-500" : "text-gray-300"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              <div className="border-t border-gray-100 mt-2 pt-2 pb-1 px-4">
                <p className="text-xs text-gray-400 text-center">
                  {results.length} hasil ditemukan · Klik untuk buka halaman
                  terkait
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
