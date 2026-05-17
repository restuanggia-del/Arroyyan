import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  Add,
  Remove,
  ShoppingCart,
  Delete,
  Receipt,
  Close,
  History as HistoryIcon,
  WaterDrop,
  AttachMoney,
  AccountBalance,
  ArrowBack,
  CheckCircle,
} from "@mui/icons-material";
import { toast } from "sonner";
import {
  getProductsWithDistributorStock,
  getCustomers,
  createTransaction,
  getTransactionHistory,
} from "../../utils/supabaseClient";

// ─── PROPS — konsisten dengan MainApp ─────────────────────────────────────────
interface TransactionPageProps {
  distributorId: string; // bukan "user"
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  maxStock: number;
  unit: string;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));

// ─── STRUK DIALOG ─────────────────────────────────────────────────────────────
interface ReceiptDialogProps {
  open: boolean;
  transaction: any;
  // Terima snapshot cart saat transaksi selesai — bukan live cart
  cartSnapshot: CartItem[];
  paymentMethod: "cash" | "transfer";
  customerName: string;
  onNewTransaction: () => void;
}

function ReceiptDialog({
  open,
  transaction,
  cartSnapshot,
  paymentMethod,
  customerName,
  onNewTransaction,
}: ReceiptDialogProps) {
  const total = cartSnapshot.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Dialog open={open} fullWidth maxWidth="xs">
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" />
            <Typography fontWeight="bold">Transaksi Berhasil!</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ fontFamily: "monospace", fontSize: 12 }}>
          {/* Header struk */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <WaterDrop sx={{ fontSize: 14, color: "primary.main" }} />
              <Typography fontSize={16} fontWeight="bold" color="primary.main">
                ARROYYAN99
              </Typography>
            </Box>
            <Typography fontSize={11} color="text.secondary">
              Air Minum Dalam Kemasan
            </Typography>
            <Typography fontSize={11} color="text.secondary">
              Bogatama, Tulang Bawang, Lampung
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

          {/* Info transaksi */}
          {[
            {
              label: "No",
              value: `#${transaction?.id?.slice(0, 8).toUpperCase() ?? "—"}`,
            },
            { label: "Tanggal", value: new Date().toLocaleString("id-ID") },
            { label: "Sumber", value: "Penjualan Distributor" },
            { label: "Pelanggan", value: customerName || "Umum" },
          ].map(({ label, value }) => (
            <Box
              key={label}
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography fontSize={11} color="text.secondary">
                {label}
              </Typography>
              <Typography fontSize={11} fontWeight={500}>
                {value}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

          {/* Item */}
          {cartSnapshot.map((item) => (
            <Box key={item.productId} sx={{ mb: 1 }}>
              <Typography fontSize={11} fontWeight={600}>
                {item.productName}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography fontSize={11} color="text.secondary">
                  {item.quantity} {item.unit} × {formatRp(item.price)}
                </Typography>
                <Typography fontSize={11} fontWeight="bold">
                  {formatRp(item.price * item.quantity)}
                </Typography>
              </Box>
            </Box>
          ))}

          <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />

          {/* Total */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography fontSize={14} fontWeight="bold">
              TOTAL
            </Typography>
            <Typography fontSize={14} fontWeight="bold" color="primary.main">
              {formatRp(total)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography fontSize={11} color="text.secondary">
              Pembayaran
            </Typography>
            <Typography fontSize={11} fontWeight="bold">
              {paymentMethod === "cash" ? "TUNAI" : "TRANSFER"}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1.5 }} />
          <Typography fontSize={11} textAlign="center" color="text.secondary">
            Terima kasih atas pembelian Anda! 💧
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1, p: 2 }}>
        <Button
          onClick={() => window.print()}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Cetak Struk
        </Button>
        <Button
          onClick={onNewTransaction}
          variant="contained"
          size="small"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Transaksi Baru
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── RIWAYAT TRANSAKSI ────────────────────────────────────────────────────────
function TransactionHistory({
  distributorId,
  onBack,
}: {
  distributorId: string;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactionHistory(distributorId)
      .then(setHistory)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [distributorId]);

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton onClick={onBack} size="small" sx={{ bgcolor: "grey.100" }}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          Riwayat Transaksi
        </Typography>
      </Box>

      {loading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ mb: 1.5, borderRadius: 3 }}
            />
          ))}
        </Box>
      ) : history.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <HistoryIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            Belum ada riwayat transaksi
          </Typography>
        </Box>
      ) : (
        history.map((trx: any) => (
          <Card
            key={trx.id}
            elevation={0}
            sx={{
              mb: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
              transition: "box-shadow 0.2s",
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              {/* Header baris */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    fontFamily="monospace"
                    color="primary.main"
                  >
                    #{trx.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {formatDate(trx.created_at)}
                  </Typography>
                  {trx.customers && (
                    <Typography variant="caption" color="text.secondary">
                      👤 {trx.customers.customer_name}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {formatRp(trx.total_price)}
                  </Typography>
                  <Chip
                    label={trx.payment_method === "cash" ? "Cash" : "Transfer"}
                    size="small"
                    icon={
                      trx.payment_method === "cash" ? (
                        <AttachMoney sx={{ fontSize: "14px !important" }} />
                      ) : (
                        <AccountBalance sx={{ fontSize: "14px !important" }} />
                      )
                    }
                    sx={{
                      mt: 0.5,
                      fontSize: "0.65rem",
                      height: 22,
                      bgcolor:
                        trx.payment_method === "cash" ? "#dcfce7" : "#dbeafe",
                      color:
                        trx.payment_method === "cash" ? "#166534" : "#1e40af",
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Detail item */}
              {(trx.transaction_details ?? []).map((d: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 0.25,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {d.products?.product_name} × {d.quantity}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {formatRp(d.subtotal)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}

// ─── PRODUCT PICKER DIALOG ────────────────────────────────────────────────────
function ProductPickerDialog({
  open,
  products,
  cart,
  onAdd,
  onClose,
}: {
  open: boolean;
  products: any[];
  cart: CartItem[];
  onAdd: (product: any) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Pilih Produk
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {products.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Belum ada produk tersedia
          </Alert>
        ) : (
          <List disablePadding>
            {products.map((product, idx) => {
              const inCart = cart.find((i) => i.productId === product.id);
              const isOutOfStock = product.stock <= 0;
              return (
                <Box key={product.id}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    onClick={() => !isOutOfStock && onAdd(product)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                      opacity: isOutOfStock ? 0.5 : 1,
                      "&:hover": !isOutOfStock ? { bgcolor: "primary.50" } : {},
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Ikon produk */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor:
                          product.category === "cup" ? "#dbeafe" : "#ede9fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 1.5,
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {product.category === "cup" ? "🥤" : "🍶"}
                    </Box>

                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {product.name}
                          {product.size ? ` (${product.size})` : ""}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.25,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="primary.main"
                            fontWeight={600}
                          >
                            {formatRp(product.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            · Stok: {product.stock} {product.unit}
                          </Typography>
                        </Box>
                      }
                    />

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      {inCart && (
                        <Chip
                          label={`× ${inCart.quantity}`}
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                      {isOutOfStock ? (
                        <Chip
                          label="Habis"
                          color="error"
                          size="small"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      ) : product.stock <= 50 ? (
                        <Chip
                          label="Low"
                          color="warning"
                          size="small"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      ) : null}
                    </Box>
                  </ListItem>
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TransactionPage({
  distributorId,
}: TransactionPageProps) {
  const [view, setView] = useState<"new" | "history">("new");
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]); // Snapshot untuk struk
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedTrx, setCompletedTrx] = useState<any>(null);
  const [completedCustomerName, setCompletedCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prods, custs] = await Promise.all([
        getProductsWithDistributorStock(distributorId),
        getCustomers(),
      ]);
      setProducts(prods);
      setCustomers(custs);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat data");
    } finally {
      setLoadingData(false);
    }
  }, [distributorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error("Stok habis");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Maksimal ${product.stock} ${product.unit}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName:
            product.name + (product.size ? ` (${product.size})` : ""),
          price: product.price,
          quantity: 1,
          maxStock: product.stock,
          unit: product.unit,
        },
      ];
    });
    setOpenProductDialog(false);
  };

  const updateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(newQty, i.maxStock) }
          : i,
      ),
    );
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Submit transaksi ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    setSubmitting(true);
    try {
      // Simpan snapshot cart SEBELUM dikosongkan
      const snapshot = [...cart];
      const custName =
        customers.find((c) => c.id === selectedCustomerId)?.customer_name ?? "";

      const trx = await createTransaction(
        distributorId,
        cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          price: i.price,
          quantity: i.quantity,
        })),
        paymentMethod,
        selectedCustomerId || null,
      );

      // Simpan untuk struk
      setCartSnapshot(snapshot);
      setCompletedTrx(trx);
      setCompletedCustomerName(custName);

      // Kosongkan form
      setCart([]);
      setSelectedCustomerId("");
      setPaymentMethod("cash");
      setReceiptOpen(true);
      toast.success("Transaksi berhasil!");

      // Refresh stok produk di background
      loadData();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal membuat transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewTransaction = () => {
    setReceiptOpen(false);
    setCompletedTrx(null);
    setCartSnapshot([]);
    setCompletedCustomerName("");
  };

  // ── Views ──────────────────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <TransactionHistory
        distributorId={distributorId}
        onBack={() => setView("new")}
      />
    );
  }

  if (loadingData) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={90}
            sx={{ mb: 1.5, borderRadius: 3 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Transaksi Baru
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Point of Sales · Distributor
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<HistoryIcon />}
          onClick={() => setView("history")}
          sx={{ borderRadius: 2 }}
        >
          Riwayat
        </Button>
      </Box>

      {/* ── Pilih Pelanggan ── */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            PELANGGAN
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <Typography variant="body2" color="text.secondary">
                  👤 Pelanggan Umum
                </Typography>
              </MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {c.customer_name} {c.is_subscribed ? "⭐" : ""}
                    </Typography>
                    {c.phone && (
                      <Typography variant="caption" color="text.secondary">
                        {c.phone}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* ── Keranjang ── */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Keranjang
            </Typography>
            {cart.length > 0 && (
              <Chip
                icon={<ShoppingCart sx={{ fontSize: "14px !important" }} />}
                label={`${totalItems} item`}
                color="primary"
                size="small"
                sx={{ height: 22, fontSize: "0.7rem" }}
              />
            )}
          </Box>

          {cart.length === 0 ? (
            <Box
              onClick={() => setOpenProductDialog(true)}
              sx={{
                border: "2px dashed",
                borderColor: "primary.light",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: "primary.50",
                  borderColor: "primary.main",
                },
                transition: "all 0.15s",
              }}
            >
              <ShoppingCart sx={{ color: "primary.light", mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Ketuk untuk menambah produk
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {cart.map((item, idx) => (
                <Box key={item.productId}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    disableGutters
                    sx={{ py: 1 }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((i) => i.productId !== item.productId),
                          )
                        }
                        size="small"
                        sx={{ color: "error.light" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          sx={{ maxWidth: 140 }}
                        >
                          {item.productName}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="primary.main"
                          fontWeight={500}
                        >
                          {formatRp(item.price * item.quantity)}
                        </Typography>
                      }
                    />

                    {/* Qty controls */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mr: 3,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateQty(item.productId, item.quantity - 1)
                        }
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: "grey.100",
                          "&:hover": { bgcolor: "grey.200" },
                        }}
                      >
                        <Remove sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ minWidth: 24, textAlign: "center" }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateQty(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxStock}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor:
                            item.quantity >= item.maxStock
                              ? "grey.50"
                              : "primary.50",
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.100" },
                        }}
                      >
                        <Add sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ pl: 0, pb: 0.5, display: "block" }}
                  >
                    Maks. {item.maxStock} {item.unit}
                  </Typography>
                </Box>
              ))}
            </List>
          )}

          {/* Tambah produk */}
          {cart.length > 0 && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Add />}
              onClick={() => setOpenProductDialog(true)}
              sx={{ mt: 1.5, borderRadius: 2, borderStyle: "dashed" }}
              size="small"
            >
              Tambah Produk Lain
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Metode Pembayaran & Total ── */}
      {cart.length > 0 && (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ mb: 1.5, display: "block" }}
            >
              METODE PEMBAYARAN
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {(["cash", "transfer"] as const).map((method) => (
                <Grid item xs={6} key={method}>
                  <Button
                    variant={
                      paymentMethod === method ? "contained" : "outlined"
                    }
                    fullWidth
                    onClick={() => setPaymentMethod(method)}
                    startIcon={
                      method === "cash" ? <AttachMoney /> : <AccountBalance />
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      fontWeight: paymentMethod === method ? "bold" : "normal",
                    }}
                  >
                    {method === "cash" ? "Tunai" : "Transfer"}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Total
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatRp(total)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={submitting ? undefined : <Receipt />}
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              sx={{
                borderRadius: 2.5,
                py: 1.6,
                fontWeight: "bold",
                background: "linear-gradient(135deg, #1e3a8a, #0891b2)",
                boxShadow: "0 4px 16px rgba(8,145,178,0.3)",
                "&:hover": { boxShadow: "0 6px 20px rgba(8,145,178,0.4)" },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} color="inherit" />
                  <span>Memproses...</span>
                </Box>
              ) : (
                "Selesaikan Transaksi"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Product Picker Dialog ── */}
      <ProductPickerDialog
        open={openProductDialog}
        products={products}
        cart={cart}
        onAdd={addToCart}
        onClose={() => setOpenProductDialog(false)}
      />

      {/* ── Struk Dialog ── */}
      <ReceiptDialog
        open={receiptOpen}
        transaction={completedTrx}
        cartSnapshot={cartSnapshot} // Snapshot, bukan live cart
        paymentMethod={paymentMethod}
        customerName={completedCustomerName}
        onNewTransaction={handleNewTransaction}
      />
    </Box>
  );
}
