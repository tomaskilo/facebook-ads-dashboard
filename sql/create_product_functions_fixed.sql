-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_table_exists(text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create improved function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name_param
    );
END;
$$;

-- Create improved function to execute SQL queries (for table creation)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
        RETURN 'ERROR';
END;
$$;

-- Create the products metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    initials TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    table_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for the products table
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;

CREATE POLICY "Allow authenticated users to read products" ON products
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert products" ON products
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update products" ON products
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete products" ON products
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Test the functions
SELECT check_table_exists('products') AS products_table_exists;
SELECT execute_sql('SELECT 1') AS test_execute_sql; 