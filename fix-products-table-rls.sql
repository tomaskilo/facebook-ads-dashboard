-- Ensure products table RLS is properly disabled
-- This affects the sidebar navigation showing all products

-- Disable RLS on products table (if not already done)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Verify all products are visible
SELECT 
  id,
  name,
  initials,
  category,
  table_name,
  created_at
FROM products
ORDER BY initials;

-- Check the count
SELECT 
  COUNT(*) as total_products,
  string_agg(initials, ', ') as product_initials
FROM products;

-- Success message
SELECT 'Products table RLS disabled. API should return all products including RH!' as message; 