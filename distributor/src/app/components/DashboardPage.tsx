import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Skeleton,
} from "@mui/material";
import {
  TrendingUp,
  Receipt,
  Inventory,
  Warning,
  Star,
  Refresh,
  CheckCircle,
  WaterDrop,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { getDashboardStats, DistributorUser } from "../../utils/supabaseClient";

interface DashboardPageProps {
  user: DistributorUser;
  distributorId: string;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function StatCard({
  icon,
  label,
  sublabel,
  value,
  color,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: React.ReactNode;
  color: string;
  warning?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: warning ? "warning.light" : "divider",
        bgcolor: warning ? "#fffbeb" : "white",
        height: "100%",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
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
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: `${color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.disabled" fontWeight={500}>
            {sublabel}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight="bold"
          color={warning ? "warning.dark" : "text.primary"}
          lineHeight={1.2}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block" }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage({
  user,
  distributorId,
}: DashboardPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    if (!distributorId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardStats(distributorId);
      setStats(data);
    } catch (err: any) {
      setError(err.message ?? "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [distributorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 18
          ? "Selamat sore"
          : "Selamat malam";

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
          borderRadius: 3,
          p: 2.5,
          mb: 2.5,
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            top: -30,
            right: -30,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
            >
              <WaterDrop
                sx={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}
              />
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}
              >
                ARROYYAN99
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" lineHeight={1.3}>
              {greeting}, {user.distributor_name.split(" ")[0]}! 👋
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.75)",
                mt: 0.3,
                display: "block",
              }}
            >
              {today}
            </Typography>
          </Box>
          <IconButton
            onClick={fetchStats}
            disabled={loading}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.8)",
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              zIndex: 1,
            }}
          >
            <Refresh
              fontSize="small"
              sx={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6}>
          {loading ? (
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              icon={<TrendingUp fontSize="small" />}
              label="Penjualan Hari Ini"
              sublabel="Hari ini"
              value={
                <Typography variant="body1" fontWeight="bold" color="#0891b2">
                  {formatRp(stats?.totalSalesToday ?? 0)}
                </Typography>
              }
              color="#0891b2"
            />
          )}
        </Grid>

        <Grid item xs={6}>
          {loading ? (
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              icon={<Receipt fontSize="small" />}
              label="Transaksi"
              sublabel="Hari ini"
              value={stats?.totalTransactionsToday ?? 0}
              color="#7c3aed"
            />
          )}
        </Grid>

        <Grid item xs={6}>
          {loading ? (
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              icon={<Inventory fontSize="small" />}
              label="Total Unit Stok"
              sublabel="Saat ini"
              value={`${(stats?.totalStock ?? 0).toLocaleString("id-ID")} unit`}
              color="#059669"
            />
          )}
        </Grid>

        <Grid item xs={6}>
          {loading ? (
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              icon={<Warning fontSize="small" />}
              label="Stok Menipis"
              sublabel="Perlu perhatian"
              value={stats?.lowStockCount ?? 0}
              color="#d97706"
              warning={(stats?.lowStockCount ?? 0) > 0}
            />
          )}
        </Grid>
      </Grid>

      {loading ? (
        <Skeleton
          variant="rounded"
          height={80}
          sx={{ borderRadius: 3, mb: 2 }}
        />
      ) : stats?.topProduct ? (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <Star sx={{ color: "#d97706", fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.primary"
              >
                Produk Terlaris
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {stats.topProduct.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Terlaris bulan ini
                </Typography>
              </Box>
              <Chip
                label={`${stats.topProduct.totalSold} terjual`}
                size="small"
                sx={{
                  bgcolor: "#d97706",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                }}
              />
            </Box>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
      ) : (stats?.lowStockProducts?.length ?? 0) > 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #fbbf24",
            bgcolor: "#fffbeb",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <Warning sx={{ color: "#d97706", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#92400e">
                Peringatan Stok
              </Typography>
              <Chip
                label={`${stats.lowStockProducts.length} produk`}
                size="small"
                sx={{
                  bgcolor: "#d97706",
                  color: "white",
                  ml: "auto",
                  fontWeight: "bold",
                  fontSize: "0.65rem",
                }}
              />
            </Box>
            <List dense disablePadding>
              {stats.lowStockProducts.map((product: any, index: number) => (
                <Box key={index}>
                  {index > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Warning sx={{ fontSize: 14, color: "#d97706" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="#92400e"
                        >
                          {product.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="#b45309">
                          Sisa {product.stock} {product.unit} · Min.{" "}
                          {product.minStock}
                        </Typography>
                      }
                    />
                    <Chip
                      label="LOW"
                      size="small"
                      sx={{
                        bgcolor: "#fbbf24",
                        color: "#78350f",
                        fontWeight: "bold",
                        fontSize: "0.6rem",
                        height: 20,
                      }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #bbf7d0",
            bgcolor: "#f0fdf4",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CheckCircle sx={{ color: "#16a34a", fontSize: 28 }} />
              <Box>
                <Typography variant="body2" fontWeight={600} color="#15803d">
                  Stok Aman
                </Typography>
                <Typography variant="caption" color="#16a34a">
                  Semua produk memiliki stok yang cukup ✓
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
