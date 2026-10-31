import {
  Calendar,
  File,
  FileSpreadsheet,
  RefreshCw,
  Search,
} from "lucide-react";
import { StatusFilter } from "./distribusiSalesUtils";

interface Props {
  startDate: string;
  endDate: string;
  salesFilter: string;
  statusFilter: StatusFilter;
  search: string;
  salesOptions: { id: string; name: string }[];
  loading: boolean;
  exportingType: "pdf" | "excel" | null;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onSalesChange: (v: string) => void;
  onStatusChange: (v: StatusFilter) => void;
  onSearchChange: (v: string) => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

const inputClass =
  "px-3 py-2 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40";

export function DistribusiSalesFilters({
  startDate,
  endDate,
  salesFilter,
  statusFilter,
  search,
  salesOptions,
  loading,
  exportingType,
  onStartDateChange,
  onEndDateChange,
  onSalesChange,
  onStatusChange,
  onSearchChange,
  onExportPdf,
  onExportExcel,
}: Props) {
  return (
    <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-end justify-between flex-wrap gap-4">
      <div className="flex items-end gap-3 flex-wrap">
        <Calendar className="w-5 h-5 text-gray-500 mb-2.5" />
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <span className="text-gray-400 mb-2.5">—</span>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sales</label>
          <select
            value={salesFilter}
            onChange={(e) => onSalesChange(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Sales</option>
            {salesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className={inputClass}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Dikirim</option>
            <option value="received">Diterima</option>
          </select>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">Cari</label>
          <Search className="w-4 h-4 text-gray-400 absolute left-3 bottom-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="No., sales, produk..."
            className={`pl-9 ${inputClass}`}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onExportPdf}
          disabled={
            loading || (exportingType !== null && exportingType !== "pdf")
          }
          className="clay-red clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          {exportingType === "pdf" ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <File className="w-4 h-4" />
          )}
          Export PDF
        </button>
        <button
          onClick={onExportExcel}
          disabled={
            loading || (exportingType !== null && exportingType !== "excel")
          }
          className="clay-green clay-pressable text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          {exportingType === "excel" ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Export Excel
        </button>
      </div>
    </div>
  );
}
