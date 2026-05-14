import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
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
} from '@mui/material';
import {
  Inventory,
  History,
  LocalShipping,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';

interface StockPageProps {
  user: any;
}

export default function StockPage({ user }: StockPageProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [stock, setStock] = useState<any[]>([]);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistribution, setSelectedDistribution] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockData, historyData, distData] = await Promise.all([
        apiCall('/stock'),
        apiCall('/stock/history'),
        apiCall('/distributions'),
      ]);

      setStock(stockData.stock);
      setStockHistory(historyData.history);
      setDistributions(distData.distributions);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Gagal memuat data stok');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDistribution = async () => {
    if (!selectedDistribution) return;

    setConfirming(true);
    try {
      await apiCall(`/distributions/${selectedDistribution.id}/confirm`, {
        method: 'POST',
      });

      toast.success('Penerimaan barang berhasil dikonfirmasi');
      setConfirmDialog(false);
      setSelectedDistribution(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error confirming distribution:', error);
      toast.error(error.message || 'Gagal konfirmasi penerimaan');
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
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
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Manajemen Stok
      </Typography>

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Inventory />} label="Stok" />
          <Tab icon={<History />} label="Riwayat" />
          <Tab icon={<LocalShipping />} label="Distribusi" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box>
          {/* Current Stock */}
          {stock.length === 0 ? (
            <Alert severity="info">Tidak ada data stok</Alert>
          ) : (
            <List>
              {stock.map((product, index) => (
                <Card key={product.id} sx={{ mb: 1 }}>
                  <CardContent>
                    <Box className="flex items-start justify-between">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {product.sku}
                        </Typography>
                      </Box>
                      {product.stock <= product.minStock && (
                        <Chip label="Low Stock" color="warning" size="small" />
                      )}
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Stok Tersedia
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {product.stock} {product.unit}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          Minimum
                        </Typography>
                        <Typography variant="body2">
                          {product.minStock} {product.unit}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {currentTab === 1 && (
        <Box>
          {/* Stock History */}
          {stockHistory.length === 0 ? (
            <Alert severity="info">Belum ada riwayat stok</Alert>
          ) : (
            <List>
              {stockHistory.map((history) => (
                <Card key={history.id} sx={{ mb: 1 }}>
                  <CardContent>
                    <Box className="flex items-start gap-2">
                      {history.type === 'in' ? (
                        <ArrowUpward color="success" />
                      ) : (
                        <ArrowDownward color="error" />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {history.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(history.date)}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {history.note}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${history.type === 'in' ? '+' : '-'}${history.quantity}`}
                        color={history.type === 'in' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {currentTab === 2 && (
        <Box>
          {/* Distribution List */}
          {distributions.length === 0 ? (
            <Alert severity="info">Tidak ada kiriman dari pabrik</Alert>
          ) : (
            <List>
              {distributions.map((dist) => (
                <Card key={dist.id} sx={{ mb: 1 }}>
                  <CardContent>
                    <Box className="flex items-start justify-between mb-2">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {dist.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(dist.date)}
                        </Typography>
                      </Box>
                      <Chip
                        label={dist.status === 'diterima' ? 'Diterima' : 'Pending'}
                        color={dist.status === 'diterima' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="caption" color="text.secondary">
                      Barang yang dikirim:
                    </Typography>
                    <List dense>
                      {dist.items.map((item: any, index: number) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={item.productName}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {item.quantity} unit
                          </Typography>
                        </ListItem>
                      ))}
                    </List>

                    {dist.status === 'pending' && (
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          setSelectedDistribution(dist);
                          setConfirmDialog(true);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Konfirmasi Penerimaan
                      </Button>
                    )}

                    {dist.status === 'diterima' && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Diterima pada {formatDate(dist.confirmedAt)}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => !confirming && setConfirmDialog(false)}
      >
        <DialogTitle>Konfirmasi Penerimaan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Apakah Anda yakin telah menerima semua barang dari distribusi{' '}
            <strong>{selectedDistribution?.id}</strong>?
          </Typography>

          {selectedDistribution && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Item yang diterima:
              </Typography>
              <List dense>
                {selectedDistribution.items.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={item.productName}
                      secondary={`${item.quantity} unit`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            Stok akan otomatis bertambah setelah konfirmasi
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={confirming}>
            Batal
          </Button>
          <Button
            onClick={handleConfirmDistribution}
            variant="contained"
            disabled={confirming}
          >
            {confirming ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
