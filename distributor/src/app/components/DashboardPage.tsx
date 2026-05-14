import { useState, useEffect } from 'react';
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
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  Inventory,
  Warning,
  Star,
} from '@mui/icons-material';
import { apiCall } from '../../utils/supabaseClient';

interface DashboardPageProps {
  user: any;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiCall('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center" sx={{ p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Halo, {user?.name || user?.email}!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Penjualan Hari Ini */}
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-2">
                <TrendingUp color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Hari Ini
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrency(stats?.totalSalesToday || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Penjualan
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Jumlah Transaksi */}
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-2">
                <Receipt color="secondary" />
                <Typography variant="caption" color="text.secondary">
                  Hari Ini
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {stats?.totalTransactionsToday || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Transaksi
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Stok */}
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-2">
                <Inventory color="success" />
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {stats?.totalStock || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unit Tersedia
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Stok Menipis */}
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-2">
                <Warning color="warning" />
                <Typography variant="caption" color="text.secondary">
                  Alert
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {stats?.lowStockCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stok Menipis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Produk Terlaris */}
      {stats?.topProduct && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box className="flex items-center gap-2 mb-2">
              <Star color="warning" />
              <Typography variant="subtitle1" fontWeight="bold">
                Produk Terlaris
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box className="flex items-center justify-between">
              <Typography variant="body1">
                {stats.topProduct.name}
              </Typography>
              <Chip
                label={`${stats.topProduct.totalSold} terjual`}
                color="primary"
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Notifikasi Stok Menipis */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <Card>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {stats.lowStockProducts.length} produk dengan stok menipis
            </Alert>
            <List dense>
              {stats.lowStockProducts.map((product: any, index: number) => (
                <div key={product.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={product.name}
                      secondary={`Stok: ${product.stock} ${product.unit} (Min: ${product.minStock})`}
                    />
                    <Chip
                      label="Low"
                      color="warning"
                      size="small"
                    />
                  </ListItem>
                </div>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {!stats?.lowStockProducts || stats.lowStockProducts.length === 0 && (
        <Alert severity="success">
          Semua produk memiliki stok yang cukup!
        </Alert>
      )}
    </Box>
  );
}
