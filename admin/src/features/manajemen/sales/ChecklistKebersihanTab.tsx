import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Truck,
} from "lucide-react";
import {
  getChecklistOverview,
  getVehiclesForSales,
  getChecklistMatrix,
  ChecklistOverviewRow,
  ChecklistMatrixRow,
} from "../../../services/checklistKebersihanService";

const currentPeriode = () => new Date().toISOString().slice(0, 7);

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const exportMatrixToExcel = async (
  rows: ChecklistMatrixRow[],
  parafByDay: Record<number, string>,
  lastDay: number,
  meta: { namaSales: string; kendaraan: string; periode: string },
) => {
  const XLSX = await import("xlsx");

  const [year, month] = meta.periode.split("-");
  const wsData: (string | number)[][] = [];
  wsData.push(["FORM CHECKLIST KEBERSIHAN"]);
  wsData.push([]);
  wsData.push([`Tahun`, year]);
  wsData.push([`Bulan`, month]);
  wsData.push([`Sales`, meta.namaSales]);
  wsData.push([`Kendaraan`, meta.kendaraan]);
  wsData.push([]);

  const dayNumbers = Array.from({ length: lastDay }, (_, i) => i + 1);
  wsData.push(["No.", "Kegiatan", ...dayNumbers, "Keterangan"]);

  rows.forEach((row) => {
    const dayCells = dayNumbers.map((d) => {
      const cell = row.days[d];
      if (!cell) return "";
      return cell.isChecked ? "V" : "X";
    });
    const notes = dayNumbers
      .map((d) => row.days[d]?.keterangan)
      .filter((n): n is string => !!n)
      .join("; ");
    wsData.push([row.itemNo, row.itemName, ...dayCells, notes]);
  });

  wsData.push([]);
  wsData.push(["Paraf", ...dayNumbers.map((d) => parafByDay[d] ?? "")]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checklist");
  XLSX.writeFile(
    wb,
    `checklist-kebersihan-${meta.kendaraan}-${meta.periode}.xlsx`,
  );
};

export function ChecklistKebersihanTab() {
  const [periode, setPeriode] = useState(currentPeriode());
  const [overview, setOverview] = useState<ChecklistOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSalesId, setSelectedSalesId] = useState<string | null>(null);
  const [selectedSalesName, setSelectedSalesName] = useState<string>("");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const [matrixRows, setMatrixRows] = useState<ChecklistMatrixRow[]>([]);
  const [parafByDay, setParafByDay] = useState<Record<number, string>>({});
  const [lastDay, setLastDay] = useState(31);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getChecklistOverview(periode);
    if (error) setError("Gagal memuat data checklist kebersihan.");
    else setOverview(data || []);
    setLoading(false);
  }, [periode]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const salesOptions = useMemo(() => {
    const map = new Map<string, string>();
    overview.forEach((r) => map.set(r.salesId, r.namaSales));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [overview]);

  const openMatrixFor = useCallback(
    async (salesId: string, namaSales: string) => {
      setSelectedSalesId(salesId);
      setSelectedSalesName(namaSales);
      setSelectedVehicle(null);
      setMatrixRows([]);
      const { data } = await getVehiclesForSales(salesId);
      setVehicles(data);
      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    },
    [],
  );

  const loadMatrix = useCallback(async () => {
    if (!selectedSalesId || !selectedVehicle) return;
    setLoadingMatrix(true);
    setError(null);
    const { rows, parafByDay, lastDay, error } = await getChecklistMatrix(
      selectedSalesId,
      selectedVehicle,
      periode,
    );
    if (error) setError("Gagal memuat matriks checklist.");
    setMatrixRows(rows);
    setParafByDay(parafByDay);
    setLastDay(lastDay);
    setLoadingMatrix(false);
  }, [selectedSalesId, selectedVehicle, periode]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const handleExport = async () => {
    if (!selectedSalesId || !selectedVehicle) return;
    setExporting(true);
    try {
      await exportMatrixToExcel(matrixRows, parafByDay, lastDay, {
        namaSales: selectedSalesName,
        kendaraan: selectedVehicle,
        periode,
      });
    } finally {
      setExporting(false);
    }
  };

  const dayNumbers = Array.from({ length: lastDay }, (_, i) => i + 1);
  const showingMatrix = !!selectedSalesId;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Checklist Kebersihan Kendaraan
          </h2>
          <p className="text-sm text-gray-600">
            Rekap checklist kebersihan kendaraan (form F.7.3-1) yang diisi sales
            setiap hari.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bulan
            </label>
            <div className="flex items-center gap-2 clay-inset border-0 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="text-sm focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 clay-inset-red border-0 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!showingMatrix ? (
        <div className="clay-raised rounded-lg">
          <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {overview.length} entri checklist bulan ini
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat data checklist...</p>
            </div>
          ) : overview.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Belum ada checklist kebersihan bulan ini
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {salesOptions.map(({ id, name }) => {
                const rowsForSales = overview.filter((r) => r.salesId === id);
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-2 px-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {name}
                      </h3>
                      <button
                        onClick={() => openMatrixFor(id, name)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Lihat matriks bulanan &rarr;
                      </button>
                    </div>
                    <div className="space-y-2">
                      {rowsForSales.map((r) => {
                        const complete = r.totalChecked === r.totalItems;
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between border border-[rgba(140,172,214,0.35)] rounded-xl px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <Truck className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {r.kendaraan}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(r.tanggal)} · Paraf: {r.paraf}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                complete
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {complete ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {r.totalChecked}/{r.totalItems} item
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="clay-raised rounded-lg">
          <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSalesId(null)}
                className="p-2 clay-inset-sm border-0 rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedSalesName}
                </p>
                <p className="text-xs text-gray-500">
                  Matriks checklist bulan {periode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedVehicle ?? ""}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="clay-inset border-0 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {vehicles.length === 0 && <option value="">-</option>}
                {vehicles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                disabled={exporting || matrixRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 clay-blue clay-pressable text-white rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? "Mengekspor..." : "Export Excel"}
              </button>
            </div>
          </div>

          {loadingMatrix ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Memuat matriks...</p>
            </div>
          ) : !selectedVehicle ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Sales ini belum pernah mengisi checklist untuk kendaraan apa
                pun.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white border border-[rgba(140,172,214,0.35)] px-2 py-2 text-left w-8">
                      No.
                    </th>
                    <th className="sticky left-8 bg-white border border-[rgba(140,172,214,0.35)] px-2 py-2 text-left min-w-[220px]">
                      Kegiatan
                    </th>
                    {dayNumbers.map((d) => (
                      <th
                        key={d}
                        className="border border-[rgba(140,172,214,0.35)] px-1.5 py-2 text-center w-7"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr key={row.itemNo}>
                      <td className="sticky left-0 bg-white border border-[rgba(140,172,214,0.35)] px-2 py-2 text-gray-600">
                        {row.itemNo}
                      </td>
                      <td className="sticky left-8 bg-white border border-[rgba(140,172,214,0.35)] px-2 py-2 text-gray-800">
                        {row.itemName}
                      </td>
                      {dayNumbers.map((d) => {
                        const cell = row.days[d];
                        return (
                          <td
                            key={d}
                            title={cell?.keterangan || undefined}
                            className="border border-[rgba(140,172,214,0.35)] text-center"
                          >
                            {cell ? (
                              cell.isChecked ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={2}
                      className="sticky left-0 bg-white border border-[rgba(140,172,214,0.35)] px-2 py-2 font-medium text-gray-700"
                    >
                      Paraf
                    </td>
                    {dayNumbers.map((d) => (
                      <td
                        key={d}
                        className="border border-[rgba(140,172,214,0.35)] px-1 py-2 text-center text-gray-500"
                      >
                        {parafByDay[d] ? parafByDay[d].charAt(0) : ""}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3">
                Arahkan kursor ke tanda silang untuk melihat catatan yang
                ditulis sales pada hari itu.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
