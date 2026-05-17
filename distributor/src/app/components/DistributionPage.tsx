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
} from "@mui/icons-material";
import {
  getDistributions,
  confirmDistributionReceived,
} from "../../utils/supabaseClient";

interface DistributionItem {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
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

function DistributionCard({
  distribution,
  onConfirm,
}: {
  distribution: Distribution;
  onConfirm: (id: string) => void;
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
              {distribution.items.map((item, i) => (
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
      </CardContent>
    </Card>
  );
}

export default function DistributionPage({
  distributorId,
}: DistributionPageProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "sent" | "received"
  >("all");

  const fetchDistributions = useCallback(async () => {
    if (!distributorId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getDistributions(distributorId);
      setDistributions(data as Distribution[]);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data distribusi.");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

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

  const filtered =
    filterStatus === "all"
      ? distributions
      : distributions.filter((d) => d.status === filterStatus);

  const countByStatus = (s: string) =>
    distributions.filter((d) => d.status === s).length;

  const filterBtns: { key: typeof filterStatus; label: string }[] = [
    { key: "all", label: `Semua (${distributions.length})` },
    { key: "sent", label: `Dikirim (${countByStatus("sent")})` },
    { key: "pending", label: `Pending (${countByStatus("pending")})` },
    { key: "received", label: `Diterima (${countByStatus("received")})` },
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
          onClick={fetchDistributions}
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

      {!loading && countByStatus("sent") > 0 && (
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

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: 2, overflowX: "auto", pb: 0.5 }}>
        {filterBtns.map((btn) => (
          <Chip
            key={btn.key}
            label={btn.label}
            onClick={() => setFilterStatus(btn.key)}
            variant={filterStatus === btn.key ? "filled" : "outlined"}
            color={filterStatus === btn.key ? "primary" : "default"}
            size="small"
            sx={{
              fontWeight: filterStatus === btn.key ? "bold" : "normal",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ space: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ borderRadius: 3, mb: 2 }}
            />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LocalShipping sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            {filterStatus === "all"
              ? "Belum ada kiriman distribusi"
              : `Tidak ada distribusi berstatus "${statusConfig[filterStatus as keyof typeof statusConfig]?.label}"`}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Distribusi dari pabrik akan muncul di sini
          </Typography>
        </Box>
      ) : (
        filtered.map((dist) => (
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
            Setelah dikonfirmasi, status tidak dapat diubah kembali.
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
