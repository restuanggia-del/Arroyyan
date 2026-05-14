import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import "./setup_demo.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to create Supabase client
const getSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

// Middleware to verify auth and get user
const authMiddleware = async (c, next) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  // Get user role from metadata
  const userRole = user.user_metadata?.role;
  if (userRole !== 'distributor') {
    return c.json({ error: 'Forbidden - Distributor access only' }, 403);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email);
  c.set('userMetadata', user.user_metadata);
  await next();
};

// Initialize demo data if needed
const initDemoData = async () => {
  const existingProducts = await kv.get('products');
  if (!existingProducts) {
    const demoProducts = [
      {
        id: '1',
        name: 'Air Minum Arroyyan99 500ml',
        sku: 'ARR-500',
        price: 2500,
        stock: 500,
        minStock: 50,
        category: 'Botol Kecil',
        unit: 'botol'
      },
      {
        id: '2',
        name: 'Air Minum Arroyyan99 1500ml',
        sku: 'ARR-1500',
        price: 5000,
        stock: 300,
        minStock: 30,
        category: 'Botol Besar',
        unit: 'botol'
      },
      {
        id: '3',
        name: 'Air Minum Arroyyan99 Galon 19L',
        sku: 'ARR-GAL',
        price: 15000,
        stock: 150,
        minStock: 20,
        category: 'Galon',
        unit: 'galon'
      }
    ];
    await kv.set('products', demoProducts);
    console.log('Demo products initialized');
  }
};

// Initialize on startup
initDemoData();

// Health check endpoint
app.get("/make-server-1e3b0871/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTH ENDPOINTS =====

// Login endpoint
app.post("/make-server-1e3b0871/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Login error:', error.message);
      return c.json({ error: 'Invalid credentials or account not approved' }, 401);
    }

    // Check if user is distributor
    const userRole = data.user?.user_metadata?.role;
    if (userRole !== 'distributor') {
      return c.json({ error: 'Access denied - Distributor only' }, 403);
    }

    // Check if approved
    const isApproved = data.user?.user_metadata?.approved || false;

    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: userRole,
        approved: isApproved
      }
    });
  } catch (error) {
    console.log('Login exception:', error.message);
    return c.json({ error: 'Login failed: ' + error.message }, 500);
  }
});

// Get current user
app.get("/make-server-1e3b0871/auth/me", authMiddleware, async (c) => {
  return c.json({
    id: c.get('userId'),
    email: c.get('userEmail'),
    ...c.get('userMetadata')
  });
});

// ===== DASHBOARD ENDPOINTS =====

app.get("/make-server-1e3b0871/dashboard/stats", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const today = new Date().toISOString().split('T')[0];

    // Get all transactions for this distributor
    const allTransactions = await kv.get(`transactions_${userId}`) || [];

    // Filter today's transactions
    const todayTransactions = allTransactions.filter(t =>
      t.date.startsWith(today)
    );

    // Calculate stats
    const totalSalesToday = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactionsToday = todayTransactions.length;

    // Get products
    const products = await kv.get('products') || [];
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    // Get top selling product
    const productSales = {};
    allTransactions.forEach(t => {
      t.items?.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    let topProduct = null;
    if (Object.keys(productSales).length > 0) {
      const topProductId = Object.keys(productSales).reduce((a, b) =>
        productSales[a] > productSales[b] ? a : b
      );
      const product = products.find(p => p.id === topProductId);
      topProduct = {
        name: product?.name,
        totalSold: productSales[topProductId]
      };
    }

    // Check low stock products
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    return c.json({
      totalSalesToday,
      totalTransactionsToday,
      totalStock,
      topProduct,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    });
  } catch (error) {
    console.log('Dashboard stats error:', error.message);
    return c.json({ error: 'Failed to fetch dashboard stats: ' + error.message }, 500);
  }
});

// ===== PRODUCT ENDPOINTS =====

app.get("/make-server-1e3b0871/products", authMiddleware, async (c) => {
  try {
    const products = await kv.get('products') || [];
    return c.json({ products });
  } catch (error) {
    console.log('Get products error:', error.message);
    return c.json({ error: 'Failed to fetch products: ' + error.message }, 500);
  }
});

// ===== TRANSACTION ENDPOINTS =====

app.post("/make-server-1e3b0871/transactions", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const transactionData = await c.req.json();

    // Generate transaction ID
    const transactionId = `TRX-${Date.now()}`;

    const transaction = {
      id: transactionId,
      distributorId: userId,
      ...transactionData,
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Save transaction
    const transactions = await kv.get(`transactions_${userId}`) || [];
    transactions.push(transaction);
    await kv.set(`transactions_${userId}`, transactions);

    // Update stock
    const products = await kv.get('products') || [];
    transaction.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
      }
    });
    await kv.set('products', products);

    // Save stock history
    const stockHistory = await kv.get(`stock_history_${userId}`) || [];
    transaction.items.forEach(item => {
      stockHistory.push({
        id: `SH-${Date.now()}-${item.productId}`,
        productId: item.productId,
        productName: item.productName,
        type: 'out',
        quantity: item.quantity,
        date: new Date().toISOString(),
        reference: transactionId,
        note: 'Penjualan'
      });
    });
    await kv.set(`stock_history_${userId}`, stockHistory);

    return c.json({ success: true, transaction });
  } catch (error) {
    console.log('Create transaction error:', error.message);
    return c.json({ error: 'Failed to create transaction: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/transactions", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const date = c.req.query('date');

    let transactions = await kv.get(`transactions_${userId}`) || [];

    if (date) {
      transactions = transactions.filter(t => t.date.startsWith(date));
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return c.json({ transactions });
  } catch (error) {
    console.log('Get transactions error:', error.message);
    return c.json({ error: 'Failed to fetch transactions: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/transactions/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const transactions = await kv.get(`transactions_${userId}`) || [];
    const transaction = transactions.find(t => t.id === id);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ transaction });
  } catch (error) {
    console.log('Get transaction error:', error.message);
    return c.json({ error: 'Failed to fetch transaction: ' + error.message }, 500);
  }
});

// ===== STOCK ENDPOINTS =====

app.get("/make-server-1e3b0871/stock", authMiddleware, async (c) => {
  try {
    const products = await kv.get('products') || [];
    return c.json({ stock: products });
  } catch (error) {
    console.log('Get stock error:', error.message);
    return c.json({ error: 'Failed to fetch stock: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/stock/history", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const stockHistory = await kv.get(`stock_history_${userId}`) || [];

    // Sort by date descending
    stockHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return c.json({ history: stockHistory });
  } catch (error) {
    console.log('Get stock history error:', error.message);
    return c.json({ error: 'Failed to fetch stock history: ' + error.message }, 500);
  }
});

// ===== DISTRIBUTION ENDPOINTS =====

app.get("/make-server-1e3b0871/distributions", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const distributions = await kv.get(`distributions_${userId}`) || [];

    // Sort by date descending
    distributions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return c.json({ distributions });
  } catch (error) {
    console.log('Get distributions error:', error.message);
    return c.json({ error: 'Failed to fetch distributions: ' + error.message }, 500);
  }
});

app.post("/make-server-1e3b0871/distributions/:id/confirm", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const distributions = await kv.get(`distributions_${userId}`) || [];
    const distribution = distributions.find(d => d.id === id);

    if (!distribution) {
      return c.json({ error: 'Distribution not found' }, 404);
    }

    if (distribution.status === 'diterima') {
      return c.json({ error: 'Distribution already confirmed' }, 400);
    }

    // Update distribution status
    distribution.status = 'diterima';
    distribution.confirmedAt = new Date().toISOString();
    await kv.set(`distributions_${userId}`, distributions);

    // Update stock
    const products = await kv.get('products') || [];
    distribution.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
      }
    });
    await kv.set('products', products);

    // Save stock history
    const stockHistory = await kv.get(`stock_history_${userId}`) || [];
    distribution.items.forEach(item => {
      stockHistory.push({
        id: `SH-${Date.now()}-${item.productId}`,
        productId: item.productId,
        productName: item.productName,
        type: 'in',
        quantity: item.quantity,
        date: new Date().toISOString(),
        reference: id,
        note: 'Penerimaan dari pabrik'
      });
    });
    await kv.set(`stock_history_${userId}`, stockHistory);

    return c.json({ success: true, distribution });
  } catch (error) {
    console.log('Confirm distribution error:', error.message);
    return c.json({ error: 'Failed to confirm distribution: ' + error.message }, 500);
  }
});

// ===== CUSTOMER ENDPOINTS =====

app.get("/make-server-1e3b0871/customers", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const customers = await kv.get(`customers_${userId}`) || [];
    return c.json({ customers });
  } catch (error) {
    console.log('Get customers error:', error.message);
    return c.json({ error: 'Failed to fetch customers: ' + error.message }, 500);
  }
});

app.post("/make-server-1e3b0871/customers", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const customerData = await c.req.json();

    const customerId = `CUST-${Date.now()}`;
    const customer = {
      id: customerId,
      distributorId: userId,
      ...customerData,
      createdAt: new Date().toISOString()
    };

    const customers = await kv.get(`customers_${userId}`) || [];
    customers.push(customer);
    await kv.set(`customers_${userId}`, customers);

    return c.json({ success: true, customer });
  } catch (error) {
    console.log('Create customer error:', error.message);
    return c.json({ error: 'Failed to create customer: ' + error.message }, 500);
  }
});

app.put("/make-server-1e3b0871/customers/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const customerData = await c.req.json();

    const customers = await kv.get(`customers_${userId}`) || [];
    const customerIndex = customers.findIndex(cust => cust.id === id);

    if (customerIndex === -1) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    customers[customerIndex] = {
      ...customers[customerIndex],
      ...customerData,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`customers_${userId}`, customers);

    return c.json({ success: true, customer: customers[customerIndex] });
  } catch (error) {
    console.log('Update customer error:', error.message);
    return c.json({ error: 'Failed to update customer: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/customers/:id/history", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const transactions = await kv.get(`transactions_${userId}`) || [];
    const customerTransactions = transactions.filter(t => t.customerId === id);

    // Sort by date descending
    customerTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return c.json({ transactions: customerTransactions });
  } catch (error) {
    console.log('Get customer history error:', error.message);
    return c.json({ error: 'Failed to fetch customer history: ' + error.message }, 500);
  }
});

// ===== REPORT ENDPOINTS =====

app.get("/make-server-1e3b0871/reports/daily", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];

    const transactions = await kv.get(`transactions_${userId}`) || [];
    const dailyTransactions = transactions.filter(t => t.date.startsWith(date));

    const totalSales = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = dailyTransactions.length;

    return c.json({
      date,
      totalSales,
      totalTransactions,
      transactions: dailyTransactions
    });
  } catch (error) {
    console.log('Get daily report error:', error.message);
    return c.json({ error: 'Failed to fetch daily report: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/reports/monthly", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month') || new Date().toISOString().slice(0, 7);

    const transactions = await kv.get(`transactions_${userId}`) || [];
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(month));

    const totalSales = monthlyTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = monthlyTransactions.length;

    return c.json({
      month,
      totalSales,
      totalTransactions,
      transactions: monthlyTransactions
    });
  } catch (error) {
    console.log('Get monthly report error:', error.message);
    return c.json({ error: 'Failed to fetch monthly report: ' + error.message }, 500);
  }
});

app.get("/make-server-1e3b0871/reports/top-products", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const transactions = await kv.get(`transactions_${userId}`) || [];

    // Calculate product sales
    const productSales = {};
    transactions.forEach(t => {
      t.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.subtotal;
      });
    });

    // Sort by total quantity
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    return c.json({ topProducts });
  } catch (error) {
    console.log('Get top products error:', error.message);
    return c.json({ error: 'Failed to fetch top products: ' + error.message }, 500);
  }
});

Deno.serve(app.fetch);