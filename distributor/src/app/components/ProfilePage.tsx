import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Person,
  Logout,
  Assessment,
  Email,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [reportTab, setReportTab] = useState(0);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (reportTab === 1) {
      fetchReports();
    }
  }, [reportTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const [daily, monthly, top] = await Promise.all([
        apiCall('/reports/daily'),
        apiCall('/reports/monthly'),
        apiCall('/reports/top-products'),
      ]);

      setDailyReport(daily);
      setMonthlyReport(monthly);
      setTopProducts(top.topProducts);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleLogout = () => {
    setLogoutDialog(false);
    onLogout();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
    }).format(date);
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Profil & Laporan
      </Typography>

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={reportTab}
          onChange={(e, newValue) => setReportTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Person />} label="Profil" />
          <Tab icon={<Assessment />} label="Laporan" />
        </Tabs>
      </Card>

      {/* Profile Tab */}
      {reportTab === 0 && (
        <Box>
          {/* User Info Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box className="flex flex-col items-center">
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: 32,
                    mb: 2,
                  }}
                >
                  {getInitials(user?.name || user?.email)}
                </Avatar>

                <Typography variant="h6" fontWeight="bold">
                  {user?.name || 'Distributor'}
                </Typography>

                <Box className="flex items-center gap-1 mt-1">
                  <Email sx={{ fontSize: 16 }} color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>

                <Chip
                  label="Distributor"
                  color="primary"
                  size="small"
                  sx={{ mt: 2 }}
                />

                {user?.approved && (
                  <Chip
                    label="Approved"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Informasi Sistem
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Perusahaan"
                    secondary="AMDK Arroyyan99"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Lokasi"
                    secondary="Bogatama, Tulang Bawang, Lampung"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Role"
                    secondary="Distributor"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button
            variant="outlined"
            fullWidth
            size="large"
            color="error"
            startIcon={<Logout />}
            onClick={() => setLogoutDialog(true)}
          >
            Logout
          </Button>
        </Box>
      )}

      {/* Reports Tab */}
      {reportTab === 1 && (
        <Box>
          {loadingReports ? (
            <Box className="flex justify-center p-4">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Daily Report */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Laporan Harian
                  </Typography>

                  {dailyReport && (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(dailyReport.date)}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Box className="flex items-center justify-between mb-2">
                          <Typography variant="body2" color="text.secondary">
                            Total Penjualan
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {formatCurrency(dailyReport.totalSales)}
                          </Typography>
                        </Box>

                        <Box className="flex items-center justify-between">
                          <Typography variant="body2" color="text.secondary">
                            Jumlah Transaksi
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {dailyReport.totalTransactions}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}

                  {!dailyReport?.totalTransactions && (
                    <Alert severity="info">Belum ada transaksi hari ini</Alert>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Report */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Laporan Bulanan
                  </Typography>

                  {monthlyReport && (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(monthlyReport.month + '-01').toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Box className="flex items-center justify-between mb-2">
                          <Typography variant="body2" color="text.secondary">
                            Total Penjualan
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {formatCurrency(monthlyReport.totalSales)}
                          </Typography>
                        </Box>

                        <Box className="flex items-center justify-between">
                          <Typography variant="body2" color="text.secondary">
                            Jumlah Transaksi
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {monthlyReport.totalTransactions}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}

                  {!monthlyReport?.totalTransactions && (
                    <Alert severity="info">Belum ada transaksi bulan ini</Alert>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardContent>
                  <Box className="flex items-center gap-2 mb-2">
                    <Star color="warning" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Produk Terlaris
                    </Typography>
                  </Box>

                  {topProducts.length === 0 ? (
                    <Alert severity="info">Belum ada data penjualan</Alert>
                  ) : (
                    <List dense>
                      {topProducts.map((product, index) => (
                        <div key={product.productId}>
                          {index > 0 && <Divider />}
                          <ListItem sx={{ px: 0 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: index < 3 ? 'primary.main' : 'grey.300',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                mr: 2,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <ListItemText
                              primary={product.productName}
                              secondary={`${product.totalQuantity} terjual • ${formatCurrency(
                                product.totalRevenue
                              )}`}
                            />
                          </ListItem>
                        </div>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialog} onClose={() => setLogoutDialog(false)}>
        <DialogTitle>Konfirmasi Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Apakah Anda yakin ingin keluar dari aplikasi?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialog(false)}>Batal</Button>
          <Button onClick={handleLogout} variant="contained" color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
