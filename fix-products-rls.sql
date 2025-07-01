-- Fix RLS issue preventing products from showing in API
-- Run this in your Supabase SQL Editor

-- First, check current RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  (SELECT string_agg(policyname, ', ') FROM pg_policies WHERE tablename = 'products') as policies
FROM pg_tables 
WHERE tablename = 'products';

-- Disable RLS on products table (recommended for metadata tables)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Verify all products are now visible
SELECT 
  id,
  name,
  initials,
  category,
  table_name,
  created_at
FROM products
ORDER BY initials;

-- Success message
SELECT 'RLS disabled on products table. All products should now be visible in the API and sidebar.' as message; 