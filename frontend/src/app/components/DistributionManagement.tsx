import { useState } from "react";
import {
  Truck,
  Plus,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { DistributionModal } from "./DistributionModal";

interface Distribution {
  id: string;
  date: string;
  distributorName: string;
  distributorAddress: string;
  productName: string;
  quantity: number;
  status: "pending" | "dalam_perjalanan" | "selesai";
  notes: string;
}

const distributionHistory: Distribution[] = [
  {
    id: "1",
    date: "2026-04-21 14:30",
    distributorName: "Distributor Jakarta Pusat",
    distributorAddress: "Jl. Sudirman No. 123, Jakarta Pusat",
    productName: "Arroyyan99 Cup Sedang",
    quantity: 500,
    status: "selesai",
    notes: "Pengiriman sukses, diterima oleh Pak Budi",
  },
  {
    id: "2",
    date: "2026-04-21 10:15",
    distributorName: "Distributor Bandung",
    distributorAddress: "Jl. Dago No. 45, Bandung",
    productName: "Arroyyan99 Botol Kecil",
    quantity: 300,
    status: "dalam_perjalanan",
    notes: "Estimasi tiba 22 April 2026",
  },
  {
    id: "3",
    date: "2026-04-20 16:45",
    distributorName: "Distributor Surabaya",
    distributorAddress: "Jl. Pemuda No. 78, Surabaya",
    productName: "Arroyyan99 Cup Kecil",
    quantity: 400,
    status: "selesai",
    notes: "Pengiriman lengkap",
  },
  {
    id: "4",
    date: "2026-04-20 09:00",
    distributorName: "Distributor Semarang",
    distributorAddress: "Jl. Pandanaran No. 90, Semarang",
    productName: "Arroyyan99 Botol Sedang",
    quantity: 250,
    status: "pending",
    notes: "Menunggu konfirmasi pengiriman",
  },
];

export function DistributionManagement() {
  const [distributions, setDistributions] =
    useState<Distribution[]>(distributionHistory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "dalam_perjalanan" | "selesai"
  >("all");

  const handleAddDistribution = () => {
    setIsModalOpen(true);
  };

  const handleSaveDistribution = (distribution: Distribution) => {
    setDistributions([distribution, ...distributions]);
    setIsModalOpen(false);
  };

  const filteredDistributions = distributions.filter(
    (dist) => filterStatus === "all" || dist.status === filterStatus,
  );

  const totalDistribusiHariIni = distributions.filter((d) =>
    d.date.startsWith("2026-04-21"),
  ).length;

  const totalDalamPerjalanan = distributions.filter(
    (d) => d.status === "dalam_perjalanan",
  ).length;

  const totalSelesai = distributions.filter(
    (d) => d.status === "selesai",
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selesai":
        return "bg-green-100 text-green-700";
      case "dalam_perjalanan":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "selesai":
        return <CheckCircle className="w-4 h-4" />;
      case "dalam_perjalanan":
        return <Truck className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "selesai":
        return "Selesai";
      case "dalam_perjalanan":
        return "Dalam Perjalanan";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Distribusi ke Distributor
        </h1>
        <p className="text-gray-600">
          Kelola pengiriman barang dari pabrik ke distributor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Distribusi Hari Ini</h3>
          <p className="text-2xl font-bold text-gray-900">
            {totalDistribusiHariIni}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-2xl font-bold text-gray-900">
            {distributions.filter((d) => d.status === "pending").length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Dalam Perjalanan</h3>
          <p className="text-2xl font-bold text-gray-900">
            {totalDalamPerjalanan}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Selesai</h3>
          <p className="text-2xl font-bold text-gray-900">{totalSelesai}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Riwayat Distribusi
              </h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="dalam_perjalanan">Dalam Perjalanan</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>

            <button
              onClick={handleAddDistribution}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Buat Distribusi Baru
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredDistributions.map((distribution) => (
              <div
                key={distribution.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {distribution.distributorName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(distribution.status)}`}
                        >
                          {getStatusIcon(distribution.status)}
                          {getStatusText(distribution.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{distribution.distributorAddress}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Produk</p>
                          <p className="font-medium text-gray-900">
                            {distribution.productName}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Jumlah</p>
                          <p className="font-medium text-gray-900">
                            {distribution.quantity} unit
                          </p>
                        </div>
                      </div>
                      {distribution.notes && (
                        <div className="mt-3 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <span className="font-medium text-blue-900">
                            Catatan:
                          </span>{" "}
                          {distribution.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{distribution.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredDistributions.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada data distribusi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <DistributionModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDistribution}
        />
      )}
    </div>
  );
}
