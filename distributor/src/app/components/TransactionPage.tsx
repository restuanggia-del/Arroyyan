import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add,
  Remove,
  ShoppingCart,
  Delete,
  Receipt,
  Close,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { apiCall } from '../../utils/supabaseClient';
import ReceiptDialog from './ReceiptDialog';
import TransactionHistory from './TransactionHistory';

interface TransactionPageProps {
  user: any;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export default function TransactionPage({ user }: TransactionPageProps) {
  const [view, setView] = useState<'new' | 'history'>('new');
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiCall('/products');
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Gagal memuat produk');
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiCall('/customers');
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }
    setOpenProductDialog(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        items: cart,
        total: calculateTotal(),
        paymentMethod,
        customerId: selectedCustomer || null,
      };

      const response = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      setCompletedTransaction(response.transaction);
      setReceiptDialog(true);
      setCart([]);
      setSelectedCustomer('');
      setPaymentMethod('cash');
      toast.success('Transaksi berhasil!');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast.error(error.message || 'Gagal membuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'history') {
    return <TransactionHistory user={user} onBack={() => setView('new')} />;
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box className="flex items-center justify-between mb-3">
        <Typography variant="h5" fontWeight="bold">
          Transaksi Baru
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setView('history')}
        >
          Riwayat
        </Button>
      </Box>

      {/* Customer Selection */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <FormControl fullWidth size="small">
            <InputLabel>Pelanggan (Opsional)</InputLabel>
            <Select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              label="Pelanggan (Opsional)"
            >
              <MenuItem value="">
                <em>Tanpa Pelanggan</em>
              </MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Cart Items */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="subtitle1" fontWeight="bold">
              Keranjang Belanja
            </Typography>
            <Chip
              icon={<ShoppingCart />}
              label={cart.length}
              color="primary"
              size="small"
            />
          </Box>

          {cart.length === 0 ? (
            <Alert severity="info">Keranjang masih kosong</Alert>
          ) : (
            <List dense>
              {cart.map((item, index) => (
                <div key={item.productId}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => removeFromCart(item.productId)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={item.productName}
                      secondary={formatCurrency(item.price)}
                    />
                    <Box className="flex items-center gap-2 mr-2">
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        color="primary"
                      >
                        <Remove />
                      </IconButton>
                      <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 30, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        color="primary"
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary" align="right">
                      Subtotal: {formatCurrency(item.subtotal)}
                    </Typography>
                  </Box>
                </div>
              ))}
            </List>
          )}

          <Button
            variant="outlined"
            fullWidth
            startIcon={<Add />}
            onClick={() => setOpenProductDialog(true)}
            sx={{ mt: 2 }}
          >
            Tambah Produk
          </Button>
        </CardContent>
      </Card>

      {/* Payment Method */}
      {cart.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Metode Pembayaran
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={() => setPaymentMethod('cash')}
                >
                  Cash
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant={paymentMethod === 'transfer' ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={() => setPaymentMethod('transfer')}
                >
                  Transfer
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Total & Submit */}
      {cart.length > 0 && (
        <Card>
          <CardContent>
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="h6" fontWeight="bold">
                Total
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {formatCurrency(calculateTotal())}
              </Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Receipt />}
              onClick={handleSubmitTransaction}
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Selesaikan Transaksi'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Selection Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={() => setOpenProductDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">Pilih Produk</Typography>
            <IconButton onClick={() => setOpenProductDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {products.map((product, index) => (
              <div key={product.id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  onClick={() => addToCart(product)}
                >
                  <ListItemText
                    primary={product.name}
                    secondary={
                      <>
                        {formatCurrency(product.price)} • Stok: {product.stock} {product.unit}
                      </>
                    }
                  />
                  {product.stock <= product.minStock && (
                    <Chip label="Low" color="warning" size="small" />
                  )}
                </ListItem>
              </div>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {completedTransaction && (
        <ReceiptDialog
          open={receiptDialog}
          onClose={() => setReceiptDialog(false)}
          transaction={completedTransaction}
        />
      )}
    </Box>
  );
}
