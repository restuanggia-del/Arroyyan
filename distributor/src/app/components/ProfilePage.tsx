import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Person,
  Logout,
  Assessment,
  Email,
  Phone,
  LocationOn,
  Star,
  TrendingUp,
  Receipt,
  Edit,
  Save,
  Close,
  CheckCircle,
} from "@mui/icons-material";
import {
  getTransactionHistory,
  getProductsWithDistributorStock,
  DistributorUser,
  supabaseAdmin,
  updateDistributorProfile,
} from "../../utils/supabaseClient";

interface ProfilePageProps {
  user: DistributorUser;
  onLogout: () => void;
  onProfileUpdated?: (updated: Partial<DistributorUser>) => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const getInitials = (name: string) =>
  (name ?? "D")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ProfilePage({
  user,
  onLogout,
  onProfileUpdated,
}: ProfilePageProps) {
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    distributor_name: user.distributor_name ?? "",
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [loadingReport, setLoadingReport] = useState(false);
  const [dailySales, setDailySales] = useState(0);
  const [dailyTrx, setDailyTrx] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyTrx, setMonthlyTrx] = useState(0);
  const [topProducts, setTopProducts] = useState<
    { name: string; totalSold: number; revenue: number }[]
  >([]);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (activeTab === 2) fetchReports();
  }, [activeTab]);

  useEffect(() => {
    setEditForm({
      distributor_name: user.distributor_name ?? "",
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
  }, [user]);

  const fetchReports = async () => {
    setLoadingReport(true);
    setReportError("");
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const [todayRes, monthRes, detailRes] = await Promise.all([
        supabaseAdmin
          .from("transactions")
          .select("total_price")
          .eq("distributor_id", user.distributor_id)
          .gte("created_at", `${todayStr}T00:00:00`)
          .lte("created_at", `${todayStr}T23:59:59`),
        supabaseAdmin
          .from("transactions")
          .select("total_price")
          .eq("distributor_id", user.distributor_id)
          .gte("created_at", `${monthStart}T00:00:00`),
        supabaseAdmin
          .from("transaction_details")
          .select(
            "product_id, quantity, subtotal, products(product_name), transactions!inner(distributor_id)",
          )
          .eq("transactions.distributor_id", user.distributor_id),
      ]);

      const todayData = todayRes.data ?? [];
      setDailySales(
        todayData.reduce((s, t: any) => s + (t.total_price ?? 0), 0),
      );
      setDailyTrx(todayData.length);

      const monthData = monthRes.data ?? [];
      setMonthlySales(
        monthData.reduce((s, t: any) => s + (t.total_price ?? 0), 0),
      );
      setMonthlyTrx(monthData.length);

      const map: Record<
        string,
        { name: string; totalSold: number; revenue: number }
      > = {};
      for (const row of (detailRes.data ?? []) as any[]) {
        const pid = row.product_id;
        if (!map[pid])
          map[pid] = {
            name: row.products?.product_name ?? "—",
            totalSold: 0,
            revenue: 0,
          };
        map[pid].totalSold += row.quantity ?? 0;
        map[pid].revenue += row.subtotal ?? 0;
      }
      setTopProducts(
        Object.values(map)
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 5),
      );
    } catch (err: any) {
      setReportError(err.message ?? "Gagal memuat laporan.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const trimmed = {
      distributor_name: editForm.distributor_name.trim(),
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
    };

    if (!trimmed.distributor_name) {
      setSaveError("Nama distributor tidak boleh kosong.");
      setSaving(false);
      return;
    }

    try {
      await updateDistributorProfile(
        user.distributor_id,
        user.id,
        trimmed,
        user.distributor_name,
      );
      setSaveSuccess(true);
      onProfileUpdated?.({
        distributor_name: trimmed.distributor_name,
        name: trimmed.name,
        email: trimmed.email,
        phone: trimmed.phone,
        address: trimmed.address,
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = { mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } };

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ "& .MuiTab-root": { fontWeight: 600, fontSize: "0.75rem" } }}
        >
          <Tab
            icon={<Person fontSize="small" />}
            label="Profil"
            iconPosition="start"
          />
          <Tab
            icon={<Edit fontSize="small" />}
            label="Edit Profil"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment fontSize="small" />}
            label="Laporan"
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <Box>
          <Card
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#0891b2",
                  fontSize: "1.6rem",
                  fontWeight: "bold",
                  mx: "auto",
                  mb: 1.5,
                  boxShadow: "0 4px 16px rgba(8,145,178,0.35)",
                }}
              >
                {getInitials(user.distributor_name)}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {user.distributor_name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <Email sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                  mt: 1.5,
                }}
              >
                <Chip
                  label="Distributor"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
                {user.is_approved && (
                  <Chip
                    label="✓ Approved"
                    color="success"
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                }}
              >
                Informasi Distributor
              </Typography>
              <List dense disablePadding>
                {user.phone && (
                  <>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <Phone sx={{ fontSize: 18, color: "#0891b2", mr: 1.5 }} />
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {user.phone}
                          </Typography>
                        }
                        secondary="Nomor Telepon"
                      />
                    </ListItem>
                    <Divider />
                  </>
                )}
                {user.address && (
                  <>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <LocationOn
                        sx={{ fontSize: 18, color: "#0891b2", mr: 1.5 }}
                      />
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {user.address}
                          </Typography>
                        }
                        secondary="Alamat"
                      />
                    </ListItem>
                    <Divider />
                  </>
                )}
                <ListItem disableGutters sx={{ py: 1 }}>
                  <Person sx={{ fontSize: 18, color: "#0891b2", mr: 1.5 }} />
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        AMDK Arroyyan99
                      </Typography>
                    }
                    secondary="Perusahaan"
                  />
                </ListItem>
                <Divider />
                <ListItem disableGutters sx={{ py: 1 }}>
                  <LocationOn
                    sx={{ fontSize: 18, color: "#0891b2", mr: 1.5 }}
                  />
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        Bogatama, Tulang Bawang, Lampung
                      </Typography>
                    }
                    secondary="Lokasi Pabrik"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            color="error"
            startIcon={<Logout />}
            onClick={() => setLogoutDialog(true)}
            sx={{ borderRadius: 2.5, fontWeight: "bold", py: 1.4 }}
          >
            Keluar
          </Button>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Card
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
              >
                <Edit sx={{ color: "#0891b2" }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Edit Profil
                </Typography>
              </Box>

              {saveError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, borderRadius: 2 }}
                  onClose={() => setSaveError("")}
                >
                  {saveError}
                </Alert>
              )}
              {saveSuccess && (
                <Alert
                  severity="success"
                  icon={<CheckCircle />}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  Profil berhasil diperbarui! Perubahan sudah masuk ke sistem
                  admin.
                </Alert>
              )}

              <TextField
                fullWidth
                label="Nama Distributor"
                value={editForm.distributor_name}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    distributor_name: e.target.value,
                  }))
                }
                sx={fieldSx}
                size="small"
                required
              />

              <TextField
                fullWidth
                label="Nama Lengkap (Pemilik)"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                sx={fieldSx}
                size="small"
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                sx={fieldSx}
                size="small"
                helperText="Perubahan email hanya memperbarui data profil, bukan akun login"
              />

              <TextField
                fullWidth
                label="Nomor Telepon"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                sx={fieldSx}
                size="small"
                placeholder="08xxxxxxxxxx"
              />

              <TextField
                fullWidth
                label="Alamat"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, address: e.target.value }))
                }
                sx={{ ...fieldSx, mb: 0 }}
                size="small"
                multiline
                rows={2}
              />
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="caption">
              <strong>Catatan:</strong> Nama perusahaan dan lokasi pabrik tidak
              dapat diubah. Hubungi admin jika diperlukan.
            </Typography>
          </Alert>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : <Save />
            }
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: 2.5,
              fontWeight: "bold",
              py: 1.4,
              background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
            }}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {loadingReport ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : reportError ? (
            <Alert
              severity="error"
              sx={{ borderRadius: 2 }}
              onClose={() => setReportError("")}
            >
              {reportError}
            </Alert>
          ) : (
            <>
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Receipt sx={{ color: "#0891b2" }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Laporan Hari Ini
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ ml: "auto" }}
                    >
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>
                  {dailyTrx === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Belum ada transaksi hari ini
                    </Alert>
                  ) : (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#eff6ff",
                          borderRadius: 2,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#0891b2"
                        >
                          {formatRp(dailySales)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Penjualan
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f5f3ff",
                          borderRadius: 2,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#7c3aed"
                        >
                          {dailyTrx}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Transaksi
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <TrendingUp sx={{ color: "#059669" }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Laporan Bulan Ini
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ ml: "auto" }}
                    >
                      {new Date().toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>
                  {monthlyTrx === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Belum ada transaksi bulan ini
                    </Alert>
                  ) : (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f0fdf4",
                          borderRadius: 2,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#059669"
                        >
                          {formatRp(monthlySales)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Penjualan
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#fef9c3",
                          borderRadius: 2,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#d97706"
                        >
                          {monthlyTrx}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Transaksi
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Star sx={{ color: "#d97706" }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Produk Terlaris
                    </Typography>
                  </Box>
                  {topProducts.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Belum ada data penjualan
                    </Alert>
                  ) : (
                    <List dense disablePadding>
                      {topProducts.map((p, i) => (
                        <Box key={i}>
                          {i > 0 && <Divider sx={{ my: 0.5 }} />}
                          <ListItem disableGutters sx={{ py: 0.75 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                bgcolor: i < 3 ? "#0891b2" : "#e2e8f0",
                                color: i < 3 ? "white" : "#64748b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: "bold",
                                mr: 1.5,
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}
                            </Box>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={600}>
                                  {p.name}
                                </Typography>
                              }
                              secondary={`${p.totalSold} terjual · ${formatRp(p.revenue)}`}
                            />
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      )}

      <Dialog
        open={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Logout color="error" />
            <Typography variant="subtitle1" fontWeight="bold">
              Keluar?
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Apakah Anda yakin ingin keluar dari aplikasi?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setLogoutDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2, flex: 1 }}
          >
            Batal
          </Button>
          <Button
            onClick={() => {
              setLogoutDialog(false);
              onLogout();
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, flex: 1, fontWeight: "bold" }}
          >
            Ya, Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
