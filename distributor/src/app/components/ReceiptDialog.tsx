import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Receipt, Share } from '@mui/icons-material';
import { toast } from 'sonner';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: any;
}

export default function ReceiptDialog({
  open,
  onClose,
  transaction,
}: ReceiptDialogProps) {
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
      timeStyle: 'short',
    }).format(date);
  };

  const handleShare = () => {
    const receiptText = generateReceiptText();

    if (navigator.share) {
      navigator
        .share({
          title: 'Struk Transaksi',
          text: receiptText,
        })
        .then(() => {
          toast.success('Struk berhasil dibagikan');
        })
        .catch((error) => {
          console.error('Error sharing:', error);
        });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(receiptText).then(() => {
        toast.success('Struk disalin ke clipboard');
      });
    }
  };

  const generateReceiptText = () => {
    let text = '========================================\n';
    text += '        ARROYYAN99 AMDK\n';
    text += '     Bogatama, Tulang Bawang\n';
    text += '========================================\n\n';
    text += `No. Transaksi: ${transaction.id}\n`;
    text += `Tanggal: ${formatDate(transaction.date)}\n`;
    text += `Pembayaran: ${transaction.paymentMethod.toUpperCase()}\n\n`;
    text += '----------------------------------------\n';

    transaction.items.forEach((item: any) => {
      text += `${item.productName}\n`;
      text += `  ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}\n`;
    });

    text += '----------------------------------------\n';
    text += `TOTAL: ${formatCurrency(transaction.total)}\n`;
    text += '========================================\n';
    text += '\n      Terima Kasih!\n';

    return text;
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Receipt color="primary" />
          <Typography variant="h6">Struk Transaksi</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            ARROYYAN99 AMDK
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bogatama, Tulang Bawang, Lampung
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No. Transaksi
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {transaction.id}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tanggal
          </Typography>
          <Typography variant="body1">
            {formatDate(transaction.date)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Metode Pembayaran
          </Typography>
          <Typography variant="body1" textTransform="uppercase">
            {transaction.paymentMethod}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Detail Pembelian
        </Typography>

        <List dense>
          {transaction.items.map((item: any, index: number) => (
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
            {formatCurrency(transaction.total)}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Terima kasih atas pembelian Anda!
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleShare} startIcon={<Share />}>
          Bagikan
        </Button>
        <Button onClick={onClose} variant="contained">
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
