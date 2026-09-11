import { useState, useEffect } from "react";
import {
  X,
  Factory,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getActiveMaterials,
  Material,
} from "../../../services/materialService";
import { getActiveProducts, Product } from "../../../services/productService";
import {
  recordProduksiHarian,
  ProduksiBahanRowInput,
} from "../../../services/produksiHarianService";

interface ProduksiHarianModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

interface BahanRowState {
  materialId: string;
  rejectItems: { reason: string; qty: number }[];
  sampelQty: number;
  rejectBahanQty: number;
  rejectBahanReason: string;
  sisaQty: number;
  expanded: boolean;
}

const REJECT_PRODUKSI_REASON_SUGGESTIONS = [
  "Lid miring",
  "Bocor",
  "Kurang air",
  "Segel tidak rapat",
  "Kemasan penyok/rusak",
  "Lainnya",
];

const REJECT_BAHAN_REASON_SUGGESTIONS = [
  "Kardus sobek/basah",
  "Lid cacat pabrik",
  "Cup retak",
  "Straw rusak",
  "Lainnya",
];

const emptyBahanRow = (): BahanRowState => ({
  materialId: "",
  rejectItems: [{ reason: "", qty: 0 }],
  sampelQty: 0,
  rejectBahanQty: 0,
  rejectBahanReason: "",
  sisaQty: 0,
  expanded: false,
});

const numInput = (v: number) => (v === 0 ? "" : String(v));
const parseNum = (v: string) => {
  const digits = v.replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
};

export function ProduksiHarianModal({
  onClose,
  onSaveSuccess,
}: ProduksiHarianModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tanggal, setTanggal] = useState(today());
  const [productId, setProductId] = useState("");
  const [jumlahDus, setJumlahDus] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [bahanRows, setBahanRows] = useState<BahanRowState[]>([
    emptyBahanRow(),
  ]);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      const [matRes, prodRes] = await Promise.all([
        getActiveMaterials(),
        getActiveProducts(),
      ]);
      setMaterials(matRes.data || []);
      setProducts(prodRes.data || []);
      setLoadingData(false);
    };
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const jumlahPcsHasilProduksi = selectedProduct?.isi_per_dus
    ? jumlahDus * selectedProduct.isi_per_dus
    : 0;

  const addBahanRow = () => setBahanRows((prev) => [...prev, emptyBahanRow()]);
  const removeBahanRow = (idx: number) =>
    setBahanRows((prev) => prev.filter((_, i) => i !== idx));
  const updateBahanRow = (idx: number, patch: Partial<BahanRowState>) =>
    setBahanRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );

  const addRejectItem = (rowIdx: number) =>
    setBahanRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? { ...r, rejectItems: [...r.rejectItems, { reason: "", qty: 0 }] }
          : r,
      ),
    );
  const removeRejectItem = (rowIdx: number, itemIdx: number) =>
    setBahanRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? {
              ...r,
              rejectItems: r.rejectItems.filter((_, j) => j !== itemIdx),
            }
          : r,
      ),
    );
  const updateRejectItem = (
    rowIdx: number,
    itemIdx: number,
    patch: Partial<{ reason: string; qty: number }>,
  ) =>
    setBahanRows((prev) =>
      prev.map((r, i) =>
        i === rowIdx
          ? {
              ...r,
              rejectItems: r.rejectItems.map((item, j) =>
                j === itemIdx ? { ...item, ...patch } : item,
              ),
            }
          : r,
      ),
    );

  const getMaterial = (id: string) => materials.find((m) => m.id === id);
  const getPcsPerUnit = (m?: Material) => {
    const isi = Number(m?.isi_per_satuan) || 0;
    return isi > 0 ? isi : 1;
  };
  const getAwalPcs = (m?: Material) => {
    if (!m) return 0;
    return (Number(m.stock_sementara) || 0) * getPcsPerUnit(m);
  };

  const rowSummary = (row: BahanRowState) => {
    const mat = getMaterial(row.materialId);
    const awalPcs = getAwalPcs(mat);
    const rejectPcs = row.rejectItems.reduce(
      (s, r) => s + (Number(r.qty) || 0),
      0,
    );
    const sampelPcs = Number(row.sampelQty) || 0;
    const rejectBahanPcs = Number(row.rejectBahanQty) || 0;
    const sisaPcs = Number(row.sisaQty) || 0;
    const totalOutPcs = awalPcs - sisaPcs;
    const netUsagePcs = totalOutPcs - rejectPcs - sampelPcs - rejectBahanPcs;
    const overSisa = sisaPcs > awalPcs;
    const overAlokasi = rejectPcs + sampelPcs + rejectBahanPcs > totalOutPcs;
    return {
      mat,
      awalPcs,
      rejectPcs,
      sampelPcs,
      rejectBahanPcs,
      sisaPcs,
      netUsagePcs,
      overSisa,
      overAlokasi,
    };
  };

  const activeRows = bahanRows.filter((r) => r.materialId);
  const anyRowError = activeRows.some((r) => {
    const s = rowSummary(r);
    return s.overSisa || s.overAlokasi;
  });
  const hasHasilProduksi = !!productId && jumlahDus > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasHasilProduksi && activeRows.length === 0) {
      setFormError(
        "Isi minimal Hasil Produksi atau salah satu baris Bahan yang Dipakai.",
      );
      return;
    }
    if (anyRowError) {
      setFormError(
        "Periksa baris bahan yang ditandai merah — Sisa/Reject/Sampel/Reject Bahan melebihi Stok Sementara yang tersedia.",
      );
      return;
    }

    setSaving(true);

    const payload: ProduksiBahanRowInput[] = activeRows.map((r) => ({
      materialId: r.materialId,
      rejectItems: r.rejectItems
        .filter((item) => (Number(item.qty) || 0) > 0)
        .map((item) => ({
          reason: item.reason || "Lainnya",
          qtyPcs: Number(item.qty) || 0,
        })),
      sampelPcs: Number(r.sampelQty) || 0,
      rejectBahanPcs: Number(r.rejectBahanQty) || 0,
      rejectBahanReason: r.rejectBahanReason || "Lainnya",
      sisaPcs: Number(r.sisaQty) || 0,
    }));

    const { error } = await recordProduksiHarian({
      tanggal,
      productId: hasHasilProduksi ? productId : null,
      jumlahDus: hasHasilProduksi ? jumlahDus : 0,
      catatan,
      bahanRows: payload,
    });

    if (error) {
      setFormError("Gagal menyimpan sesi produksi: " + (error as any).message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="border-b border-[rgba(140,172,214,0.35)] px-6 py-4 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Factory className="w-5 h-5 text-gray-400" />
              Pemakaian Produksi
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Satu sesi bisa mencakup beberapa bahan sekaligus dan hasil
              produksinya
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(215,233,255,0.55)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="p-3 clay-inset-red border-0 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Memuat data bahan &amp; produk...
            </div>
          ) : (
            <>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tanggal Produksi
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40"
                />
              </div>

              {/* Hasil Produksi */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Hasil Produksi
                </h3>
                <div className="grid grid-cols-[1fr_140px] gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Produk yang dihasilkan
                    </label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full px-3 py-2.5 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 cursor-pointer"
                    >
                      <option value="">Tidak ada</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} {p.size ? `(${p.size})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Jumlah (Dus)
                    </label>
                    <input
                      type="text"
                      value={numInput(jumlahDus)}
                      onChange={(e) => setJumlahDus(parseNum(e.target.value))}
                      disabled={!productId}
                      placeholder="0"
                      className="w-full px-3 py-2.5 clay-inset border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 disabled:opacity-50"
                    />
                  </div>
                </div>
                {selectedProduct && jumlahDus > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {selectedProduct.isi_per_dus ? (
                      <>
                        {jumlahDus.toLocaleString("id-ID")} dus ×{" "}
                        {selectedProduct.isi_per_dus.toLocaleString("id-ID")}{" "}
                        pcs ={" "}
                        <span className="text-gray-600 font-medium">
                          {jumlahPcsHasilProduksi.toLocaleString("id-ID")} pcs
                        </span>{" "}
                        — otomatis menambah Stok Pabrik.
                      </>
                    ) : (
                      "Isi per dus belum diatur di Manajemen Produk."
                    )}
                  </p>
                )}
              </div>

              {/* Bahan yang Dipakai */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Bahan yang Dipakai
                  </h3>
                  <button
                    type="button"
                    onClick={addBahanRow}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bahan
                  </button>
                </div>

                <datalist id="reject-produksi-reasons">
                  {REJECT_PRODUKSI_REASON_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                <datalist id="reject-bahan-reasons">
                  {REJECT_BAHAN_REASON_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>

                <div className="space-y-3">
                  {bahanRows.map((row, idx) => {
                    const summary = rowSummary(row);
                    const hasIssue = summary.overSisa || summary.overAlokasi;
                    const usedElsewhere = bahanRows.some(
                      (r, i) =>
                        i !== idx &&
                        r.materialId === row.materialId &&
                        r.materialId,
                    );
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 ${
                          hasIssue ? "clay-inset-red" : "clay-inset-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={row.materialId}
                            onChange={(e) =>
                              updateBahanRow(idx, {
                                materialId: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 bg-white/70 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30 cursor-pointer"
                          >
                            <option value="">Pilih bahan</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nama_bahan} (Sementara: {m.stock_sementara}{" "}
                                {m.satuan})
                              </option>
                            ))}
                          </select>
                          {bahanRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBahanRow(idx)}
                              className="p-2 text-gray-400 hover:text-red-600 cursor-pointer"
                              title="Hapus baris bahan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {usedElsewhere && (
                          <p className="text-xs text-amber-600 mt-1.5">
                            Bahan ini sudah dipakai di baris lain.
                          </p>
                        )}

                        {row.materialId && (
                          <>
                            <div className="flex items-center justify-between mt-3 gap-4">
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                Stok Awal:{" "}
                                <span className="text-gray-700 font-medium">
                                  {summary.awalPcs.toLocaleString("id-ID")} pcs
                                </span>
                              </p>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <label className="text-xs text-gray-500 whitespace-nowrap">
                                  Sisa Bahan (pcs)
                                </label>
                                <input
                                  type="text"
                                  value={numInput(row.sisaQty)}
                                  onChange={(e) =>
                                    updateBahanRow(idx, {
                                      sisaQty: parseNum(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-28 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateBahanRow(idx, {
                                  expanded: !row.expanded,
                                })
                              }
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-3 cursor-pointer"
                            >
                              {row.expanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                              Reject / Sampel / Reject Bahan
                            </button>

                            {row.expanded && (
                              <div className="mt-3 pt-3 border-t border-[rgba(140,172,214,0.3)] space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs text-gray-500">
                                      Reject hasil produksi (pcs)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addRejectItem(idx)}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Alasan
                                    </button>
                                  </div>
                                  <div className="space-y-1.5">
                                    {row.rejectItems.map((item, itemIdx) => (
                                      <div
                                        key={itemIdx}
                                        className="flex items-center gap-2"
                                      >
                                        <input
                                          type="text"
                                          list="reject-produksi-reasons"
                                          value={item.reason}
                                          onChange={(e) =>
                                            updateRejectItem(idx, itemIdx, {
                                              reason: e.target.value,
                                            })
                                          }
                                          placeholder="Lid miring, bocor, dll"
                                          className="flex-1 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                        />
                                        <input
                                          type="text"
                                          value={numInput(item.qty)}
                                          onChange={(e) =>
                                            updateRejectItem(idx, itemIdx, {
                                              qty: parseNum(e.target.value),
                                            })
                                          }
                                          placeholder="0"
                                          className="w-16 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                        />
                                        {row.rejectItems.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeRejectItem(idx, itemIdx)
                                            }
                                            className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                  <label className="text-xs text-gray-500 whitespace-nowrap">
                                    Sampel (pcs)
                                  </label>
                                  <input
                                    type="text"
                                    value={numInput(row.sampelQty)}
                                    onChange={(e) =>
                                      updateBahanRow(idx, {
                                        sampelQty: parseNum(e.target.value),
                                      })
                                    }
                                    placeholder="0"
                                    className="w-28 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1.5">
                                    Reject bahan (pcs) — rusak sebelum sempat
                                    dipakai
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={numInput(row.rejectBahanQty)}
                                      onChange={(e) =>
                                        updateBahanRow(idx, {
                                          rejectBahanQty: parseNum(
                                            e.target.value,
                                          ),
                                        })
                                      }
                                      placeholder="0"
                                      className="w-16 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                    />
                                    <input
                                      type="text"
                                      list="reject-bahan-reasons"
                                      value={row.rejectBahanReason}
                                      onChange={(e) =>
                                        updateBahanRow(idx, {
                                          rejectBahanReason: e.target.value,
                                        })
                                      }
                                      placeholder="Kardus sobek/basah, dll"
                                      className="flex-1 px-3 py-1.5 bg-white/70 border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0249E1]/30"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <p
                              className={`text-xs mt-3 pt-3 border-t border-[rgba(140,172,214,0.3)] ${
                                hasIssue ? "text-red-600" : "text-gray-500"
                              }`}
                            >
                              Pemakaian bersih:{" "}
                              <span
                                className={`font-semibold ${
                                  hasIssue ? "text-red-700" : "text-gray-800"
                                }`}
                              >
                                {Math.max(
                                  summary.netUsagePcs,
                                  0,
                                ).toLocaleString("id-ID")}{" "}
                                pcs
                              </span>{" "}
                              <span className="text-gray-400">
                                (awal {summary.awalPcs.toLocaleString("id-ID")}{" "}
                                − sisa {summary.sisaPcs.toLocaleString("id-ID")}{" "}
                                − reject{" "}
                                {summary.rejectPcs.toLocaleString("id-ID")} −
                                sampel{" "}
                                {summary.sampelPcs.toLocaleString("id-ID")} −
                                reject bahan{" "}
                                {summary.rejectBahanPcs.toLocaleString("id-ID")}
                                )
                              </span>
                              {hasIssue && (
                                <span className="block mt-1">
                                  Melebihi Stok Sementara yang tersedia.
                                </span>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Catatan
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Produksi batch pagi"
                  rows={2}
                  className="w-full px-4 py-2.5 clay-inset border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0249E1]/40 resize-none"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-700 bg-[rgba(215,233,255,0.55)] hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loadingData || anyRowError}
              className="px-5 py-2.5 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2 clay-purple clay-pressable"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Simpan Sesi Produksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
