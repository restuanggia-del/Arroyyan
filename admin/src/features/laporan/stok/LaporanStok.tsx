import { useState } from "react";
import { RingkasanStokTab } from "../stok/RingkasanStokTab";
import { KartuStokTab } from "./KartuStokTab";

export function LaporanStok() {
  const [activeTab, setActiveTab] = useState<"ringkasan" | "kartu">(
    "ringkasan",
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Stok</h1>
        <p className="text-gray-600">
          Pantau jumlah stok produk yang ada di Manajemen Stok (pusat &amp;
          lapangan), dan lihat rincian kartu stok per transaksi
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[rgba(140,172,214,0.35)]">
        {[
          { id: "ringkasan", label: "Ringkasan Stok" },
          { id: "kartu", label: "Kartu Stok" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "ringkasan" | "kartu")}
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

      {activeTab === "ringkasan" ? <RingkasanStokTab /> : <KartuStokTab />}
    </div>
  );
}
