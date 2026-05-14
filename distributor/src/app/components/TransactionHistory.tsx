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
  Chip,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Receipt, Visibility } from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';

interface TransactionHistoryProps {
  user: any;
  onBack: () => void;
}

export default function TransactionHistory({ user, onBack }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filterDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const url = filterDate
        ? `/transactions?date=${filterDate}`
        : '/transactions';
      const data = await apiCall(url);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat riwayat transaksi');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleViewDetail = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDetailDialog(true);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box className="flex items-center gap-2 mb-3">
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Riwayat Transaksi
        </Typography>
      </Box>

      {/* Filter */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box className="flex gap-2">
            <Button
              variant={filterDate === getTodayDate() ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterDate(getTodayDate())}
            >
              Hari Ini
            </Button>
            <Button
              variant={filterDate === '' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilterDate('')}
            >
              Semua
            </Button>
          </Box>
          <TextField
            type="date"
            size="small"
            fullWidth
            label="Filter Tanggal"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        </CardContent>
      </Card>

      {/* Transaction List */}
      {loading ? (
        <Box className="flex justify-center p-4">
          <CircularProgress />
        </Box>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Tidak ada transaksi
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {transactions.map((transaction, index) => (
            <Card key={transaction.id} sx={{ mb: 1 }}>
              <CardContent>
                <Box className="flex items-start justify-between mb-2">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {transaction.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.date)}
                    </Typography>
                  </Box>
                  <Chip
                    label={transaction.paymentMethod.toUpperCase()}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(transaction.total)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetail(transaction)}
                  >
                    Detail
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        {selectedTransaction && (
          <>
            <DialogTitle>
              <Box className="flex items-center gap-2">
                <Receipt color="primary" />
                <Typography variant="h6">Detail Transaksi</Typography>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No. Transaksi
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedTransaction.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tanggal
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedTransaction.date)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Metode Pembayaran
                </Typography>
                <Typography variant="body1" textTransform="uppercase">
                  {selectedTransaction.paymentMethod}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Item
              </Typography>

              <List dense>
                {selectedTransaction.items.map((item: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.productName}
                      secondary={`${item.quantity} x ${formatCurrency(item.price)}`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.subtotal)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box className="flex items-center justify-between">
                <Typography variant="h6" fontWeight="bold">
                  TOTAL
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatCurrency(selectedTransaction.total)}
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setDetailDialog(false)} variant="contained">
                Tutup
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
