-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================
INSERT INTO
    system_settings (company_name, company_address, receipt_footer)
VALUES
    (
        'AMDK Arroyyan99',
        'Bogatama, Tulang Bawang, Lampung',
        'Terima kasih telah membeli'
    );

-- =====================================================
-- PRODUCTS
-- =====================================================
INSERT INTO
    products (product_name, category, size, price, unit)
VALUES
    (
        'Arroyyan99 Cup Kecil',
        'cup',
        '220ml',
        1500,
        'pcs'
    ),
    (
        'Arroyyan99 Cup Sedang',
        'cup',
        '330ml',
        2500,
        'pcs'
    ),
    (
        'Arroyyan99 Botol Kecil',
        'botol',
        '600ml',
        4000,
        'pcs'
    ),
    (
        'Arroyyan99 Botol Sedang',
        'botol',
        '1500ml',
        7000,
        'pcs'
    );
    