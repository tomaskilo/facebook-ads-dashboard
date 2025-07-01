# Dynamic Product Creation Setup

## Overview
The system now supports dynamically creating new products with their own database tables. When you add a new product (e.g., Bioma with initials BI), the system will:

1. Create a new table `bi_ads_data` with the same structure as `cb_ads_data`
2. Add all necessary indexes, triggers, and views
3. Set up Row Level Security policies
4. Add the product to the navigation sidebar

## Required Supabase Setup

**IMPORTANT**: Before using the Add Product feature, you need to run this SQL in your Supabase SQL Editor:

```sql
-- Create function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$;

-- Create function to execute SQL queries (for table creation)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
        RETURN false;
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
```

## How to Use

1. **Run the SQL setup** in Supabase (above)
2. **Click "Add Product"** in the sidebar navigation
3. **Fill in the form**:
   - Product Name: e.g., "Bioma"
   - Product Initials: e.g., "BI" (will be used for table name)
   - Category: Select from dropdown (Ecommerce, Ecom Accelerator, Go Health, WMA, Beyond Wellness)
4. **Click "Create Product"**

## What Happens Automatically

✅ **Database Table**: Creates `{initials}_ads_data` (e.g., `bi_ads_data`)  
✅ **Same Structure**: Identical to Colonbroom table (`cb_ads_data`)  
✅ **Indexes**: All performance indexes created  
✅ **Triggers**: Auto-update timestamps  
✅ **Views**: Weekly summary, creative performance, Creative Hub analysis  
✅ **Security**: Row Level Security policies  
✅ **Navigation**: Product appears in sidebar immediately  

## Example: Adding Bioma

- **Name**: Bioma
- **Initials**: BI
- **Category**: Ecommerce

**Result**: 
- Table: `bi_ads_data`
- Views: `bi_weekly_summary`, `bi_creative_performance`, `bi_creative_hub_analysis`
- Navigation: "💊 Bioma" appears in sidebar
- URL: `/dashboard/products/bi`

## Error Handling

- ❌ **Duplicate initials**: System prevents creating products with same initials
- ❌ **Invalid characters**: Initials are sanitized (alphanumeric only)
- ❌ **Missing fields**: All fields are required
- ❌ **Database errors**: Detailed error messages in console

## Future Features

Once you create a new product table, you can:
- Upload CSV data to the new table
- Create dedicated analytics pages
- Add product-specific features
- Implement Creative Hub tracking for the new product

The system is designed to be fully scalable - each product gets its own complete database structure and can be managed independently. 