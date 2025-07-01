-- Add Colonbroom as a product to the products table
-- Run this in Supabase SQL Editor after running the one-time setup

INSERT INTO products (name, initials, category, table_name)
VALUES ('Colonbroom', 'CB', 'Ecommerce', 'cb_ads_data')
ON CONFLICT (initials) DO NOTHING;

-- Verify the insert
SELECT * FROM products WHERE initials = 'CB';

-- Success message
SELECT 'Colonbroom added to products successfully!' as message; 