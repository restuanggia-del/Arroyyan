import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  LinearProgress,
  IconButton,
} from "@mui/material";
import {
  Inventory,
  History,
  LocalShipping,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  WarningAmber,
} from "@mui/icons-material";
import { toast } from "sonner";
import {
  getDistributorStock,
  getStockMovements,
  getDistributions,
  confirmDistributionReceived,
} from "../../utils/supabaseClient";

// ─── PROPS — konsisten dengan MainApp ─────────────────────────────────────────
interface StockPageProps {
  distributorId: string;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

// Map movement_type dari Supabase → arah (in/out) + label
const getMovementMeta = (type: string) => {
  const map: Record<string, { label: string; isIn: boolean }> = {
    stock_in: { label: "Stok Masuk", isIn: true },
    distribution_in: { label: "Terima Distribusi", isIn: true },
    sale_out: { label: "Penjualan", isIn: false },
    adjustment_out: { label: "Penyesuaian Keluar", isIn: false },
    adjustment_in: { label: "Penyesuaian Masuk", isIn: true },
  };
  return map[type] ?? { label: type, isIn: true };
};

// Map distribution status dari Supabase → tampilan
const getStatusMeta = (status: string) => {
  const map: Record<
    string,
    { label: string; color: "success" | "warning" | "info" | "error" }
  > = {
    delivered: { label: "Dikirim", color: "info" },
    received: { label: "Diterima", color: "success" },
    shipped: { label: "Dalam Pengiriman", color: "info" },
    pending: { label: "Pending", color: "warning" },
    cancelled: { label: "Dibatalkan", color: "error" },
  };
  return map[status] ?? { label: status, color: "info" };
};

// ─── TAB: STOK SAAT INI ───────────────────────────────────────────────────────
function StockTab({ distributorId }: { distributorId: string }) {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDistributorStock(distributorId);
      setStock(data);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat stok");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading)
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={100}
            sx={{ mb: 1.5, borderRadius: 3 }}
          />
        ))}
      </Box>
    );

  if (error)
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={fetch}>
            Coba Lagi
          </Button>
        }
      >
        {error}
      </Alert>
    );

  if (stock.length === 0)
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Inventory sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">Tidak ada data stok</Typography>
      </Box>
    );

  const lowStockCount = stock.filter((s) => s.stock <= s.minStock).length;

  return (
    <Box>
      {/* Summary banner */}
      {lowStockCount > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmber />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <strong>{lowStockCount} produk</strong> stoknya di bawah minimum
        </Alert>
      )}

      {stock.map((item) => {
        const pct = Math.min(
          100,
          Math.round((item.stock / Math.max(item.minStock * 2, 1)) * 100),
        );
        const isLow = item.stock <= item.minStock;
        const isCritical = item.stock < item.minStock * 0.5;

        return (
          <Card
            key={item.id}
            elevation={0}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: isCritical
                ? "error.light"
                : isLow
                  ? "warning.light"
                  : "divider",
              bgcolor: isCritical ? "#fff5f5" : isLow ? "#fffbeb" : "white",
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.name}
                    </Typography>
                    {item.size && (
                      <Chip
                        label={item.size}
                        size="small"
                        sx={{ height: 18, fontSize: "0.6rem" }}
                      />
                    )}
                  </Box>
                  <Chip
                    label={item.category === "cup" ? "Cup" : "Botol"}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: 18,
                      fontSize: "0.6rem",
                      bgcolor: item.category === "cup" ? "#dbeafe" : "#ede9fe",
                      color: item.category === "cup" ? "#1e40af" : "#6d28d9",
                    }}
                  />
                </Box>
                {isCritical ? (
                  <Chip
                    label="KRITIS"
                    color="error"
                    size="small"
                    sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                  />
                ) : isLow ? (
                  <Chip
                    label="LOW"
                    color="warning"
                    size="small"
                    sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                  />
                ) : (
                  <Chip
                    label="AMAN"
                    color="success"
                    size="small"
                    sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Stok angka */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  mb: 1,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Stok Tersedia
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={
                      isCritical
                        ? "error.main"
                        : isLow
                          ? "warning.dark"
                          : "text.primary"
                    }
                  >
                    {item.stock.toLocaleString("id-ID")}
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {item.unit}
                    </Typography>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Minimum
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {item.minStock} {item.unit}
                  </Typography>
                </Box>
              </Box>

              {/* Progress bar */}
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "grey.100",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor: isCritical
                      ? "error.main"
                      : isLow
                        ? "warning.main"
                        : "success.main",
                  },
                }}
              />
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

// ─── TAB: RIWAYAT STOK ────────────────────────────────────────────────────────
function HistoryTab({ distributorId }: { distributorId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // getStockMovements sudah ada di supabaseClient
      const data = await getStockMovements(distributorId);
      setHistory(data);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading)
    return (
      <Box>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={80}
            sx={{ mb: 1.5, borderRadius: 3 }}
          />
        ))}
      </Box>
    );

  if (error)
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={fetch}>
            Coba Lagi
          </Button>
        }
      >
        {error}
      </Alert>
    );

  if (history.length === 0)
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <History sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          Belum ada riwayat pergerakan stok
        </Typography>
      </Box>
    );

  return (
    <Box>
      {history.map((item: any) => {
        // movement_type dari Supabase: 'sale_out', 'distribution_in', dll
        const { label, isIn } = getMovementMeta(item.movement_type);
        return (
          <Card
            key={item.id}
            elevation={0}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
              transition: "box-shadow 0.2s",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                {/* Icon arah */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isIn ? "#dcfce7" : "#fee2e2",
                    flexShrink: 0,
                  }}
                >
                  {isIn ? (
                    <ArrowUpward sx={{ fontSize: 18, color: "#16a34a" }} />
                  ) : (
                    <ArrowDownward sx={{ fontSize: 18, color: "#dc2626" }} />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      {/* Nama produk dari join */}
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {(item as any).products?.product_name ?? "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {label} · {formatDate(item.created_at)}
                      </Typography>
                    </Box>
                    {/* Qty dengan tanda +/- */}
                    <Chip
                      label={`${isIn ? "+" : "−"}${item.quantity}`}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "0.7rem",
                        bgcolor: isIn ? "#dcfce7" : "#fee2e2",
                        color: isIn ? "#166534" : "#991b1b",
                        flexShrink: 0,
                        ml: 1,
                      }}
                    />
                  </Box>
                  {item.note && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ mt: 0.25, display: "block" }}
                      noWrap
                    >
                      {item.note}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

// ─── TAB: DISTRIBUSI ──────────────────────────────────────────────────────────
function DistributionTab({ distributorId }: { distributorId: string }) {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDistributions(distributorId);
      setDistributions(data);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat distribusi");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await confirmDistributionReceived(selected.id);
      toast.success("Penerimaan barang dikonfirmasi! Stok sudah diperbarui.");
      setSelected(null);
      fetch();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal konfirmasi");
    } finally {
      setConfirming(false);
    }
  };

  if (loading)
    return (
      <Box>
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={150}
            sx={{ mb: 1.5, borderRadius: 3 }}
          />
        ))}
      </Box>
    );

  if (error)
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={fetch}>
            Coba Lagi
          </Button>
        }
      >
        {error}
      </Alert>
    );

  if (distributions.length === 0)
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <LocalShipping sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary">
          Tidak ada kiriman dari pabrik
        </Typography>
      </Box>
    );

  const pendingCount = distributions.filter(
    (d) =>
      d.status === "pending" ||
      d.status === "delivered" ||
      d.status === "shipped",
  ).length;

  return (
    <Box>
      {pendingCount > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          <strong>{pendingCount} kiriman</strong> menunggu konfirmasi penerimaan
        </Alert>
      )}

      {distributions.map((dist) => {
        const { label: statusLabel, color: statusColor } = getStatusMeta(
          dist.status,
        );
        // Bisa dikonfirmasi jika belum received
        const canConfirm =
          dist.status !== "received" && dist.status !== "cancelled";

        return (
          <Card
            key={dist.id}
            elevation={0}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: canConfirm ? "warning.light" : "divider",
              bgcolor: canConfirm ? "#fffbeb" : "white",
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    fontFamily="monospace"
                    color="primary.main"
                  >
                    #{dist.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dist.date
                      ? new Date(dist.date).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })
                      : formatDate(dist.created_at)}
                  </Typography>
                </Box>
                <Chip
                  label={statusLabel}
                  color={statusColor}
                  size="small"
                  sx={{ fontWeight: "bold", fontSize: "0.65rem" }}
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Item detail */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Barang yang dikirim:
              </Typography>
              <List dense disablePadding>
                {dist.items.map((item: any, i: number) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {item.productName}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`${item.quantity} ${item.unit}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        bgcolor: "grey.100",
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Konfirmasi button */}
              {canConfirm && (
                <Button
                  variant="contained"
                  fullWidth
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => setSelected(dist)}
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
                  }}
                >
                  Konfirmasi Penerimaan
                </Button>
              )}

              {dist.status === "received" && (
                <Alert
                  severity="success"
                  sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }}
                >
                  <Typography variant="caption">Sudah diterima ✓</Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* ── Confirm Dialog ── */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => !confirming && setSelected(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" />
            <Typography fontWeight="bold">Konfirmasi Penerimaan</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apakah Anda yakin sudah menerima semua barang dari kiriman{" "}
            <strong>#{selected?.id?.slice(0, 8).toUpperCase()}</strong>?
          </Typography>

          {selected && (
            <Card
              elevation={0}
              sx={{ bgcolor: "grey.50", borderRadius: 2, p: 1.5 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Item yang akan diterima:
              </Typography>
              {selected.items.map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.25,
                  }}
                >
                  <Typography variant="body2">{item.productName}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +{item.quantity} {item.unit}
                  </Typography>
                </Box>
              ))}
            </Card>
          )}

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Stok akan <strong>otomatis bertambah</strong> setelah konfirmasi
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setSelected(null)}
            disabled={confirming}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={confirming}
            fullWidth
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
            }}
          >
            {confirming ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Memproses...</span>
              </Box>
            ) : (
              "Ya, Konfirmasi"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function StockPage({ distributorId }: StockPageProps) {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Manajemen Stok
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Stok · Riwayat · Distribusi dari pabrik
        </Typography>
      </Box>

      {/* ── Tabs ── */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": { fontSize: "0.75rem", minHeight: 48 },
            "& .Mui-selected": { color: "#0891b2", fontWeight: "bold" },
            "& .MuiTabs-indicator": { bgcolor: "#0891b2", height: 3 },
          }}
        >
          <Tab
            icon={<Inventory sx={{ fontSize: 18 }} />}
            label="Stok"
            iconPosition="start"
          />
          <Tab
            icon={<History sx={{ fontSize: 18 }} />}
            label="Riwayat"
            iconPosition="start"
          />
          <Tab
            icon={<LocalShipping sx={{ fontSize: 18 }} />}
            label="Distribusi"
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* ── Content ── */}
      {currentTab === 0 && <StockTab distributorId={distributorId} />}
      {currentTab === 1 && <HistoryTab distributorId={distributorId} />}
      {currentTab === 2 && <DistributionTab distributorId={distributorId} />}
    </Box>
  );
}
