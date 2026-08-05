-- =====================================================
-- EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS PROFILE
-- =====================================================
CREATE TABLE
    users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        auth_user_id UUID UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'distributor')),
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- DISTRIBUTORS
-- =====================================================
CREATE TABLE
    distributors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        user_id UUID REFERENCES users (id) ON DELETE CASCADE,
        distributor_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE
    products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        product_name VARCHAR(100) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('cup', 'botol')),
        size VARCHAR(50),
        price NUMERIC(12, 2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        photo_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- PRODUCT PRICE VARIANTS
-- =====================================================
CREATE TABLE
    product_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        price NUMERIC(12, 2) NOT NULL,
        label VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- STOCKS
-- =====================================================
CREATE TABLE
    stocks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        product_id UUID REFERENCES products (id) ON DELETE CASCADE,
        distributor_id UUID REFERENCES distributors (id) ON DELETE CASCADE,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- STOCK MOVEMENTS
-- =====================================================
CREATE TABLE
    stock_movements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        product_id UUID REFERENCES products (id) ON DELETE CASCADE,
        distributor_id UUID REFERENCES distributors (id) ON DELETE CASCADE,
        movement_type VARCHAR(30) NOT NULL CHECK (
            movement_type IN (
                'stock_in',
                'distribution_out',
                'distribution_in',
                'sale_out'
            )
        ),
        quantity INTEGER NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- DISTRIBUTIONS
-- =====================================================
CREATE TABLE
    distributions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        distributor_id UUID REFERENCES distributors (id) ON DELETE CASCADE,
        created_by UUID REFERENCES users (id) ON DELETE SET NULL,
        distribution_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'received')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- DISTRIBUTION DETAILS
-- =====================================================
CREATE TABLE
    distribution_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        distribution_id UUID REFERENCES distributions (id) ON DELETE CASCADE,
        product_id UUID REFERENCES products (id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL
    );

-- =====================================================
-- CUSTOMERS
-- =====================================================
CREATE TABLE
    customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        customer_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        is_subscribed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- TRANSACTIONS
-- =====================================================
CREATE TABLE
    transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        distributor_id UUID REFERENCES distributors (id) ON DELETE CASCADE,
        customer_id UUID REFERENCES customers (id) ON DELETE SET NULL,
        total_price NUMERIC(12, 2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- TRANSACTION DETAILS
-- =====================================================
CREATE TABLE
    transaction_details (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        transaction_id UUID REFERENCES transactions (id) ON DELETE CASCADE,
        product_id UUID REFERENCES products (id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        subtotal NUMERIC(12, 2) NOT NULL
    );

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================
CREATE TABLE
    activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        user_id UUID REFERENCES users (id) ON DELETE SET NULL,
        activity_type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================
CREATE TABLE
    system_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        company_name VARCHAR(100),
        company_address TEXT,
        receipt_footer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    