import { useState } from "react";
import { RekapProdukTab } from "../global/RekapProdukTab";
import { RekapanSetoranTab } from "../global/RekapanSetoranTab";

export function LaporanGlobal() {
  const [activeTab, setActiveTab] = useState<"produk" | "setoran">("produk");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Laporan Global
        </h1>
        <p className="text-gray-600">
          Rekap stok &amp; penjualan per produk, dan proyeksi sisa dana
          penjualan per bulan
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {[
          { id: "produk", label: "Rekap Produk" },
          { id: "setoran", label: "Rekapan Setoran" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "produk" | "setoran")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "produk" ? <RekapProdukTab /> : <RekapanSetoranTab />}
    </div>
  );
}
