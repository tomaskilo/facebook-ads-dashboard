# Dynamic Product Creation Setup

## Overview
The system now supports dynamically creating new products with their own database tables. When you add a new product (e.g., Bioma with initials BI), the system will:

1. Store product metadata in the `products` table
2. Generate SQL for you to manually run in Supabase
3. Create a new table `bi_ads_data` with the same structure as `cb_ads_data`
4. Add the product to the navigation sidebar

## Required Supabase Setup (Run Once)

**IMPORTANT**: Before using the Add Product feature, you need to run this SQL in your Supabase SQL Editor **ONCE**:

```sql
-- Create the products metadata table (if it doesn't exist)
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

-- Create policies for the products table (with IF NOT EXISTS handling)
DO $$
BEGIN
    -- Drop existing policies if they exist (to handle re-runs)
    DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
    DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
    DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
    DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;
    
    -- Create new policies
    CREATE POLICY "Allow authenticated users to read products" ON products
        FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow authenticated users to insert products" ON products
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow authenticated users to update products" ON products
        FOR UPDATE USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow authenticated users to delete products" ON products
        FOR DELETE USING (auth.uid() IS NOT NULL);
EXCEPTION
    -- Handle case where policies already exist
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policies already exist, skipping creation.';
END $$;

-- Success message
SELECT 'Setup completed successfully!' as message;
```

## How to Use

1. **Run the one-time setup SQL** in Supabase (above) - only needed once
2. **Click "Add Product"** in the sidebar navigation
3. **Fill in the form**:
   - Product Name: e.g., "Bioma"
   - Product Initials: e.g., "BI" (will be used for table name)
   - Category: Select from dropdown (Ecommerce, Ecom Accelerator, Go Health, WMA, Beyond Wellness)
4. **Click "Create Product"**
5. **Copy and run the generated SQL** in Supabase SQL Editor to create the actual table

## Two-Step Process

### Step 1: Product Metadata (Automatic)
✅ **Product Info**: Stored in `products` table  
✅ **Navigation**: Product appears in sidebar immediately  
✅ **SQL Generation**: Clean SQL generated for table creation  

### Step 2: Table Creation (Manual)
📋 **Copy SQL**: Generated SQL provided in modal  
🗄 **Run in Supabase**: Paste and execute in SQL Editor  
✅ **Table Created**: `{initials}_ads_data` table with full structure  

## What the Generated SQL Creates

✅ **Database Table**: Creates `{initials}_ads_data` (e.g., `bi_ads_data`)  
✅ **Same Structure**: Identical to Colonbroom table (`cb_ads_data`)  
✅ **Indexes**: All performance indexes created  
✅ **Security**: Row Level Security policies  
✅ **Permissions**: Full CRUD access for authenticated users  

## Example: Adding Bioma

- **Name**: Bioma
- **Initials**: BI
- **Category**: Ecommerce

**Result**: 
- Metadata: Stored in `products` table
- Table: `bi_ads_data` (after running generated SQL)
- Navigation: "💊 Bioma" appears in sidebar
- URL: `/dashboard/products/bioma`

## Error Handling

- ❌ **Duplicate initials**: System prevents creating products with same initials
- ❌ **Invalid characters**: Initials are sanitized (alphanumeric only)
- ❌ **Missing fields**: All fields are required
- ✅ **Safe setup**: One-time setup handles "already exists" errors gracefully

## Why Two Steps?

This approach ensures:
- ✅ **Reliability**: No complex SQL functions that can fail
- ✅ **Safety**: You control exactly what SQL runs in your database
- ✅ **Transparency**: You can see and verify the SQL before running it
- ✅ **Flexibility**: Easy to modify the generated SQL if needed

## Future Features

Once you create a new product table, you can:
- Upload CSV data to the new table
- Create dedicated analytics pages
- Add product-specific features
- Implement Creative Hub tracking for the new product

The system is designed to be fully scalable - each product gets its own complete database structure and can be managed independently. 