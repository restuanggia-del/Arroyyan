-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

ALTER TABLE distribution_details ENABLE ROW LEVEL SECURITY;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICY
-- =====================================================
CREATE POLICY "Users can view own profile" ON users FOR
SELECT
    USING (auth.uid () = auth_user_id);

-- =====================================================
-- PRODUCTS POLICY
-- =====================================================
CREATE POLICY "Everyone can view products" ON products FOR
SELECT
    USING (true);

-- =====================================================
-- PRODUCT PRICE POLICY
-- =====================================================
CREATE POLICY "Everyone can view product prices" ON product_prices FOR
SELECT
    USING (true);

-- =====================================================
-- STOCKS POLICY
-- =====================================================
CREATE POLICY "Distributor can view own stocks" ON stocks FOR
SELECT
    USING (
        distributor_id IN (
            SELECT
                id
            FROM
                distributors
            WHERE
                user_id IN (
                    SELECT
                        id
                    FROM
                        users
                    WHERE
                        auth_user_id = auth.uid ()
                )
        )
    );

-- =====================================================
-- TRANSACTIONS POLICY
-- =====================================================
CREATE POLICY "Distributor can view own transactions" ON transactions FOR
SELECT
    USING (
        distributor_id IN (
            SELECT
                id
            FROM
                distributors
            WHERE
                user_id IN (
                    SELECT
                        id
                    FROM
                        users
                    WHERE
                        auth_user_id = auth.uid ()
                )
        )
    );

CREATE POLICY "Distributor can insert own transactions" ON transactions FOR INSERT
WITH
    CHECK (
        distributor_id IN (
            SELECT
                id
            FROM
                distributors
            WHERE
                user_id IN (
                    SELECT
                        id
                    FROM
                        users
                    WHERE
                        auth_user_id = auth.uid ()
                )
        )
    );

-- =====================================================
-- CUSTOMERS POLICY
-- =====================================================
CREATE POLICY "Authenticated users can view customers" ON customers FOR
SELECT
    USING (auth.role () = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT
WITH
    CHECK (auth.role () = 'authenticated');

-- =====================================================
-- DISTRIBUTIONS POLICY
-- =====================================================
CREATE POLICY "Distributor can view own distributions" ON distributions FOR
SELECT
    USING (
        distributor_id IN (
            SELECT
                id
            FROM
                distributors
            WHERE
                user_id IN (
                    SELECT
                        id
                    FROM
                        users
                    WHERE
                        auth_user_id = auth.uid ()
                )
        )
    );

-- =====================================================
-- SYSTEM SETTINGS POLICY
-- =====================================================
CREATE POLICY "Authenticated users can view settings" ON system_settings FOR
SELECT
    USING (auth.role () = 'authenticated');
    