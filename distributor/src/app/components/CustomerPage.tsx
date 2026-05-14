import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Fab,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  History,
  Phone,
  LocationOn,
  Close,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';

interface CustomerPageProps {
  user: any;
}

export default function CustomerPage({ user }: CustomerPageProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/customers');
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (customer?: any) => {
    if (customer) {
      setEditMode(true);
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } else {
      setEditMode(false);
      setSelectedCustomer(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setFormDialog(true);
  };

  const handleCloseForm = () => {
    setFormDialog(false);
    setEditMode(false);
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      notes: '',
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editMode && selectedCustomer) {
        // Update customer
        await apiCall(`/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Data pelanggan berhasil diupdate');
      } else {
        // Create new customer
        await apiCall('/customers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Pelanggan berhasil ditambahkan');
      }

      handleCloseForm();
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Gagal menyimpan data pelanggan');
    }
  };

  const handleViewHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setHistoryDialog(true);

    try {
      const data = await apiCall(`/customers/${customer.id}/history`);
      setCustomerHistory(data.transactions);
    } catch (error) {
      console.error('Error fetching customer history:', error);
      toast.error('Gagal memuat riwayat pembelian');
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
    }).format(date);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <Box className="flex items-center justify-center" sx={{ p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Pelanggan
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Cari nama atau nomor telepon..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Pelanggan tidak ditemukan' : 'Belum ada data pelanggan'}
        </Alert>
      ) : (
        <List>
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} sx={{ mb: 1 }}>
              <CardContent>
                <Box className="flex items-start justify-between mb-2">
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {customer.name}
                    </Typography>
                    <Box className="flex items-center gap-1 mt-1">
                      <Phone sx={{ fontSize: 14 }} color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    </Box>
                    {customer.address && (
                      <Box className="flex items-center gap-1 mt-0.5">
                        <LocationOn sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {customer.address}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenForm(customer)}
                  >
                    <Edit />
                  </IconButton>
                </Box>

                {customer.notes && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Catatan: {customer.notes}
                    </Typography>
                  </>
                )}

                <Button
                  size="small"
                  startIcon={<History />}
                  onClick={() => handleViewHistory(customer)}
                  sx={{ mt: 1 }}
                >
                  Lihat Riwayat
                </Button>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Add Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => handleOpenForm()}
      >
        <Add />
      </Fab>

      {/* Form Dialog */}
      <Dialog
        open={formDialog}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmitForm}>
          <DialogTitle>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">
                {editMode ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
              </Typography>
              <IconButton onClick={handleCloseForm}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Nama"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              sx={{ mb: 2, mt: 1 }}
            />

            <TextField
              fullWidth
              label="Nomor Telepon"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Alamat"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Catatan"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={2}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseForm}>Batal</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'Update' : 'Simpan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialog}
        onClose={() => setHistoryDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h6">Riwayat Pembelian</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCustomer?.name}
              </Typography>
            </Box>
            <IconButton onClick={() => setHistoryDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {customerHistory.length === 0 ? (
            <Alert severity="info">Belum ada transaksi</Alert>
          ) : (
            <List>
              {customerHistory.map((transaction, index) => (
                <div key={transaction.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box className="flex items-center justify-between">
                          <Typography variant="body2">
                            {transaction.id}
                          </Typography>
                          <Chip
                            label={formatCurrency(transaction.total)}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          {formatDate(transaction.date)}
                          <br />
                          {transaction.items.length} item
                        </>
                      }
                    />
                  </ListItem>
                </div>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)} variant="contained">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
