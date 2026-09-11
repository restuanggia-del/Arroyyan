import { useState } from "react";
import { Warehouse, Factory, ClipboardList } from "lucide-react";
import { LaporanStokTabel } from "../bahan/LaporanStokTabel";
import { LaporanProduksiHarian } from "../bahan/LaporanProduksiHarian";

type ReportTab = "gudang" | "sementara" | "harian";

export function LaporanBahan() {
  const [activeTab, setActiveTab] = useState<ReportTab>("gudang");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Bahan</h1>
        <p className="text-gray-600">
          Pantau sisa stok bahan di Gudang, di area Stok Sementara, dan rekap
          Produksi Harian
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)] flex-wrap">
        {[
          {
            id: "gudang" as const,
            label: "Laporan Bahan di Stok Gudang",
            icon: Warehouse,
          },
          {
            id: "sementara" as const,
            label: "Laporan Bahan di Stok Sementara",
            icon: Factory,
          },
          {
            id: "harian" as const,
            label: "Laporan Produksi Harian",
            icon: ClipboardList,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "harian" ? (
        <LaporanProduksiHarian />
      ) : (
        <LaporanStokTabel activeTab={activeTab} />
      )}
    </div>
  );
}
