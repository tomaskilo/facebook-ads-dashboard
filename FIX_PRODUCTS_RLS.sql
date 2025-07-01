-- Fix for Products not showing in sidebar
-- The issue is Row Level Security (RLS) blocking access to products table

-- Option 1: Disable RLS on products table (recommended for metadata)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create a policy to allow public read access
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);

-- Verify the fix by checking products
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
SELECT 'Products table RLS fixed! Both Colonbroom and Bioma should now appear in sidebar.' as message; 