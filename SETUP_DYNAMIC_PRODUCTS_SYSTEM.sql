-- COMPLETE SETUP FOR DYNAMIC PRODUCTS SYSTEM
-- Run this SQL in Supabase SQL Editor to enable dynamic product pages

-- Step 1: Fix Row Level Security (RLS) on products table
-- This allows the sidebar to show all products
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Step 2: Add Colonbroom to products table
-- This makes Colonbroom appear in the sidebar alongside new products like Bioma
INSERT INTO products (name, initials, category, table_name)
VALUES ('Colonbroom', 'CB', 'Ecommerce', 'cb_ads_data')
ON CONFLICT (initials) DO NOTHING;

-- Step 3: Verify both products exist
SELECT 
  id,
  name,
  initials,
  category,
  table_name,
  created_at
FROM products 
ORDER BY created_at;

-- Success message
SELECT 'Dynamic Products System Setup Complete! 🎉' as message,
       'Both Colonbroom and Bioma should now appear in sidebar' as status,
       'All product pages will have identical structure but pull from their own tables' as info; 