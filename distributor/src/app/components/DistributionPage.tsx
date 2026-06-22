import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Skeleton,
  TextField,
  Checkbox,
} from "@mui/material";
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  Refresh,
  ExpandMore,
  ExpandLess,
  Inventory,
  CalendarToday,
  AssignmentReturn,
  Cancel,
  HourglassEmpty,
} from "@mui/icons-material";
import {
  getDistributions,
  confirmDistributionReceived,
} from "../../utils/supabaseClient";
import {
  getReturns,
  createReturn,
  ReturnRow,
  ReturnItem,
} from "../../utils/supabaseClient";

interface DistributionItem {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
  productId?: string;
}

interface Distribution {
  id: string;
  date: string;
  status: "pending" | "sent" | "received";
  created_at: string;
  items: DistributionItem[];
}

interface DistributionPageProps {
  distributorId: string;
}

type TabKey = "all" | "pending" | "sent" | "received" | "return";

const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "warning" as const,
    icon: <Schedule sx={{ fontSize: 16 }} />,
    bgColor: "#fffbeb",
    borderColor: "#fbbf24",
  },
  sent: {
    label: "Dikirim",
    color: "info" as const,
    icon: <LocalShipping sx={{ fontSize: 16 }} />,
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  received: {
    label: "Diterima",
    color: "success" as const,
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    bgColor: "#f0fdf4",
    borderColor: "#86efac",
  },
};

const returnStatusConfig = {
  pending: {
    label: "Menunggu Persetujuan",
    color: "warning" as const,
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
    bgColor: "#fffbeb",
    borderColor: "#fbbf24",
  },
  approved: {
    label: "Disetujui",
    color: "success" as const,
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    bgColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  rejected: {
    label: "Ditolak",
    color: "error" as const,
    icon: <Cancel sx={{ fontSize: 16 }} />,
    bgColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
};

function DistributionCard({
  distribution,
  onConfirm,
  onReturn,
}: {
  distribution: Distribution;
  onConfirm: (id: string) => void;
  onReturn: (dist: Distribution) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[distribution.status];
  const totalQty = distribution.items.reduce((s, i) => s + i.quantity, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: cfg.borderColor,
        bgcolor: cfg.bgColor,
        mb: 2,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid",
                borderColor: cfg.borderColor,
              }}
            >
              <LocalShipping sx={{ fontSize: 20, color: "#0891b2" }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.disabled"
                fontFamily="monospace"
              >
                #{distribution.id.slice(0, 8).toUpperCase()}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 11, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(distribution.date)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Chip
            icon={cfg.icon}
            label={cfg.label}
            color={cfg.color}
            size="small"
            sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "rgba(255,255,255,0.7)",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Inventory sx={{ fontSize: 16, color: "#0891b2" }} />
            <Typography variant="body2" fontWeight={600}>
              {distribution.items.length} jenis produk
            </Typography>
          </Box>
          <Typography variant="body2" color="#0891b2" fontWeight="bold">
            {totalQty.toLocaleString("id-ID")} unit total
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="caption" color="#0891b2" fontWeight={600}>
            {expanded ? "Sembunyikan" : "Lihat detail produk"}
          </Typography>
          <IconButton size="small" sx={{ color: "#0891b2", p: 0 }}>
            {expanded ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </IconButton>
        </Box>

        {expanded && (
          <Box sx={{ mt: 1.5 }}>
            <Divider sx={{ mb: 1 }} />
            <List dense disablePadding>
              {distribution.items.map((item) => (
                <ListItem key={item.id} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {item.productName}
                      </Typography>
                    }
                  />
                  <Chip
                    label={`${item.quantity} ${item.unit}`}
                    size="small"
                    sx={{
                      bgcolor: "#e0f2fe",
                      color: "#0369a1",
                      fontWeight: "bold",
                      fontSize: "0.7rem",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {distribution.status === "sent" && (
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<CheckCircle />}
            onClick={() => onConfirm(distribution.id)}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #059669, #10b981)",
              boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #047857, #059669)",
              },
            }}
          >
            Konfirmasi Diterima
          </Button>
        )}

        {distribution.status === "received" && (
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<AssignmentReturn />}
            onClick={() => onReturn(distribution)}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: "bold",
              borderColor: "#dc2626",
              color: "#dc2626",
              "&:hover": { bgcolor: "#fef2f2", borderColor: "#dc2626" },
            }}
          >
            Ajukan Return
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ReturnCard({ ret }: { ret: ReturnRow }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = returnStatusConfig[ret.status];
  const totalQty = ret.items.reduce((s, i) => s + i.quantity, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: cfg.borderColor,
        bgcolor: cfg.bgColor,
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid",
                borderColor: cfg.borderColor,
              }}
            >
              <AssignmentReturn sx={{ fontSize: 20, color: "#dc2626" }} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.disabled"
                fontFamily="monospace"
              >
                #{ret.id.slice(0, 8).toUpperCase()}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 11, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(ret.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Chip
            icon={cfg.icon}
            label={cfg.label}
            color={cfg.color}
            size="small"
            sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
          />
        </Box>

        {ret.reason && (
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.7)",
              borderRadius: 2,
              p: 1.5,
              mb: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Alasan:{" "}
            </Typography>
            <Typography variant="body2" fontWeight={500} component="span">
              {ret.reason}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="caption" color="#dc2626" fontWeight={600}>
            {ret.items.length} jenis produk · {totalQty} unit —{" "}
            {expanded ? "Sembunyikan" : "Lihat detail"}
          </Typography>
          <IconButton size="small" sx={{ color: "#dc2626", p: 0 }}>
            {expanded ? (
              <ExpandLess fontSize="small" />
            ) : (
              <ExpandMore fontSize="small" />
            )}
          </IconButton>
        </Box>

        {expanded && (
          <Box sx={{ mt: 1.5 }}>
            <Divider sx={{ mb: 1 }} />
            <List dense disablePadding>
              {ret.items.map((item) => (
                <ListItem key={item.id} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={500}>
                        {item.productName}
                      </Typography>
                    }
                  />
                  <Chip
                    label={`${item.quantity} ${item.unit}`}
                    size="small"
                    sx={{
                      bgcolor: "#fee2e2",
                      color: "#991b1b",
                      fontWeight: "bold",
                      fontSize: "0.7rem",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dialog form ajukan return ────────────────────────────────────────────────
function ReturnFormDialog({
  open,
  distribution,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  distribution: Distribution | null;
  onClose: () => void;
  onSubmit: (items: ReturnItem[], reason: string) => void;
  submitting: boolean;
}) {
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (distribution) {
      setSelectedQty({});
      setReason("");
    }
  }, [distribution]);

  if (!distribution) return null;

  const toggleItem = (itemId: string) => {
    setSelectedQty((prev) => {
      const next = { ...prev };
      if (next[itemId] !== undefined) delete next[itemId];
      else next[itemId] = 0; // ← mulai dari 0, bukan maxQty
      return next;
    });
  };

  const updateQty = (itemId: string, rawValue: string, maxQty: number) => {
    const cleaned = rawValue.replace(/\D/g, "");
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    setSelectedQty((prev) => ({ ...prev, [itemId]: Math.min(num, maxQty) }));
  };

  const handleSubmit = () => {
    const items: ReturnItem[] = distribution.items
      .filter(
        (item) =>
          selectedQty[item.id] !== undefined && selectedQty[item.id] > 0,
      )
      .map((item) => ({
        productId: item.productId ?? item.id,
        productName: item.productName,
        quantity: selectedQty[item.id],
      }));
    onSubmit(items, reason);
  };

  const hasSelection = Object.keys(selectedQty).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentReturn sx={{ color: "#dc2626" }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Ajukan Return Barang
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Distribusi #{distribution.id.slice(0, 8).toUpperCase()}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pilih produk yang rusak/cacat dan tentukan jumlahnya. Pengajuan akan
          ditinjau oleh admin.
        </Typography>

        <List dense disablePadding sx={{ mb: 2 }}>
          {distribution.items.map((item) => {
            const checked = selectedQty[item.id] !== undefined;
            return (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: checked ? "#fca5a5" : "divider",
                  bgcolor: checked ? "#fef2f2" : "white",
                }}
              >
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tersedia: {item.quantity} {item.unit}
                      </Typography>
                    </Box>
                    {checked && (
                      <TextField
                        type="text"
                        size="small"
                        value={
                          selectedQty[item.id] === 0 ? "" : selectedQty[item.id]
                        }
                        placeholder="0"
                        onChange={(e) =>
                          updateQty(item.id, e.target.value, item.quantity)
                        }
                        inputProps={{
                          inputMode: "numeric",
                          style: { textAlign: "center", width: 50 },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </List>

        <TextField
          fullWidth
          label="Alasan Return (opsional)"
          placeholder="Contoh: kemasan bocor, segel rusak, dll"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={2}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{ borderRadius: 2 }}
          disabled={submitting}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          disabled={!hasSelection || submitting}
          sx={{
            borderRadius: 2,
            fontWeight: "bold",
            bgcolor: "#dc2626",
            "&:hover": { bgcolor: "#b91c1c" },
          }}
        >
          {submitting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            "Ajukan Return"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DistributionPage({
  distributorId,
}: DistributionPageProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [successMsg, setSuccessMsg] = useState("");

  const [returnDialogDist, setReturnDialogDist] = useState<Distribution | null>(
    null,
  );
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!distributorId) return;
    setLoading(true);
    setError("");
    try {
      const [distData, returnData] = await Promise.all([
        getDistributions(distributorId),
        getReturns(distributorId),
      ]);
      setDistributions(distData as Distribution[]);
      setReturns(returnData);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleConfirm = async (id: string) => {
    setConfirmDialog(null);
    setConfirmingId(id);
    try {
      await confirmDistributionReceived(id);
      setDistributions((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "received" as const } : d,
        ),
      );
    } catch (err: any) {
      setError(err.message ?? "Gagal konfirmasi penerimaan.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSubmitReturn = async (items: ReturnItem[], reason: string) => {
    if (!returnDialogDist) return;
    setSubmittingReturn(true);
    setError("");
    try {
      await createReturn(distributorId, returnDialogDist.id, items, reason);
      setReturnDialogDist(null);
      setTab("return");
      setSuccessMsg(
        "Pengajuan return berhasil dikirim! Menunggu persetujuan admin.",
      ); // ← tambah ini
      fetchAll();
    } catch (err: any) {
      setError(err.message ?? "Gagal mengajukan return.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const filteredDist =
    tab === "all" || tab === "return"
      ? distributions
      : distributions.filter((d) => d.status === tab);

  const countByStatus = (s: string) =>
    distributions.filter((d) => d.status === s).length;
  const countByReturnStatus = (s: string) =>
    returns.filter((r) => r.status === s).length;

  const tabBtns: { key: TabKey; label: string }[] = [
    { key: "all", label: `Semua (${distributions.length})` },
    { key: "sent", label: `Dikirim (${countByStatus("sent")})` },
    { key: "pending", label: `Pending (${countByStatus("pending")})` },
    { key: "received", label: `Diterima (${countByStatus("received")})` },
    { key: "return", label: `Return (${returns.length})` },
  ];

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
          borderRadius: 3,
          p: 2.5,
          mb: 2.5,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Distribusi
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.75)" }}
          >
            Kiriman dari pabrik Arroyyan99
          </Typography>
        </Box>
        <IconButton
          onClick={fetchAll}
          disabled={loading}
          size="small"
          sx={{
            color: "rgba(255,255,255,0.8)",
            bgcolor: "rgba(255,255,255,0.15)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <Refresh
            fontSize="small"
            sx={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
        </IconButton>
      </Box>

      {!loading && tab !== "return" && countByStatus("sent") > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<LocalShipping />}
        >
          <Typography variant="body2" fontWeight={600}>
            {countByStatus("sent")} pengiriman menunggu konfirmasi
          </Typography>
          <Typography variant="caption">
            Tekan "Konfirmasi Diterima" setelah barang tiba
          </Typography>
        </Alert>
      )}

      {!loading && tab === "return" && countByReturnStatus("pending") > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<HourglassEmpty />}
        >
          <Typography variant="body2" fontWeight={600}>
            {countByReturnStatus("pending")} pengajuan return menunggu
            persetujuan admin
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      
      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSuccessMsg("")}
        >
          {successMsg}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: 2, overflowX: "auto", pb: 0.5 }}>
        {tabBtns.map((btn) => (
          <Chip
            key={btn.key}
            label={btn.label}
            onClick={() => setTab(btn.key)}
            variant={tab === btn.key ? "filled" : "outlined"}
            color={
              tab === btn.key
                ? btn.key === "return"
                  ? "error"
                  : "primary"
                : "default"
            }
            size="small"
            sx={{
              fontWeight: tab === btn.key ? "bold" : "normal",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          />
        ))}
      </Box>

      {loading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ borderRadius: 3, mb: 2 }}
            />
          ))}
        </Box>
      ) : tab === "return" ? (
        returns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <AssignmentReturn sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              Belum ada pengajuan return
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Ajukan return dari distribusi yang sudah diterima
            </Typography>
          </Box>
        ) : (
          returns.map((ret) => <ReturnCard key={ret.id} ret={ret} />)
        )
      ) : filteredDist.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LocalShipping sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            {tab === "all"
              ? "Belum ada kiriman distribusi"
              : `Tidak ada distribusi berstatus "${statusConfig[tab as keyof typeof statusConfig]?.label}"`}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Distribusi dari pabrik akan muncul di sini
          </Typography>
        </Box>
      ) : (
        filteredDist.map((dist) => (
          <Box key={dist.id} sx={{ position: "relative" }}>
            {confirmingId === dist.id && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.7)",
                  borderRadius: 3,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            <DistributionCard
              distribution={dist}
              onConfirm={(id) => setConfirmDialog(id)}
              onReturn={(d) => setReturnDialogDist(d)}
            />
          </Box>
        ))
      )}

      <Dialog
        open={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="subtitle1" fontWeight="bold">
              Konfirmasi Penerimaan
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Pastikan semua barang sudah diterima dengan lengkap dan sesuai.
            Setelah dikonfirmasi, status tidak dapat diubah kembali. Jika ada
            barang rusak, gunakan fitur <strong>Ajukan Return</strong> setelah
            konfirmasi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog(null)}
            variant="outlined"
            sx={{ borderRadius: 2, flex: 1 }}
          >
            Batal
          </Button>
          <Button
            onClick={() => confirmDialog && handleConfirm(confirmDialog)}
            variant="contained"
            color="success"
            sx={{ borderRadius: 2, flex: 1, fontWeight: "bold" }}
          >
            Ya, Sudah Diterima
          </Button>
        </DialogActions>
      </Dialog>

      <ReturnFormDialog
        open={Boolean(returnDialogDist)}
        distribution={returnDialogDist}
        onClose={() => setReturnDialogDist(null)}
        onSubmit={handleSubmitReturn}
        submitting={submittingReturn}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
