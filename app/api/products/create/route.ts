import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { name, initials, category } = await request.json();

    // Validate input
    if (!name || !initials || !category) {
      return NextResponse.json(
        { error: 'Name, initials, and category are required' },
        { status: 400 }
      );
    }

    // Sanitize initials for table name (lowercase, alphanumeric only)
    const tablePrefix = initials.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tableName = `${tablePrefix}_ads_data`;

    const supabase = createServiceSupabaseClient();

    // Check if table already exists
    const { data: existingTables, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name: tableName }
    );

    if (tableCheckError) {
      console.error('Error checking table existence:', tableCheckError);
      // Continue anyway - the CREATE TABLE IF NOT EXISTS will handle duplicates
    }

    if (existingTables && existingTables.length > 0) {
      return NextResponse.json(
        { error: `Product with initials "${initials}" already exists` },
        { status: 409 }
      );
    }

    // Create the new table with the same structure as cb_ads_data
    const createTableSQL = `
      -- Create the ${name} (${initials}) ads data table
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id BIGSERIAL PRIMARY KEY,
        ad_name TEXT NOT NULL,
        adset_name TEXT NOT NULL,
        creative_type TEXT CHECK (creative_type IN ('IMAGE', 'VIDEO')) NOT NULL,
        spend_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
        impressions INTEGER NOT NULL DEFAULT 0,
        first_ad_spend_date TEXT,
        last_ad_spend_date TEXT,
        days_running INTEGER NOT NULL DEFAULT 0,
        is_creative_hub INTEGER CHECK (is_creative_hub IN (0, 1)) NOT NULL DEFAULT 0,
        year_created INTEGER,
        month_created TEXT,
        aspect_ratio TEXT,
        week_number TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_ads_data_week_number ON ${tableName}(week_number);
      CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_ads_data_ad_name ON ${tableName}(ad_name);
      CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_ads_data_creative_type ON ${tableName}(creative_type);
      CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_ads_data_spend_usd ON ${tableName}(spend_usd);
      CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_ads_data_week_spend ON ${tableName}(week_number, spend_usd DESC);

      -- Create trigger to automatically update updated_at
      CREATE TRIGGER IF NOT EXISTS update_${tablePrefix}_ads_data_updated_at 
          BEFORE UPDATE ON ${tableName} 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Add Row Level Security (RLS) 
      ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

      -- Create policies for authenticated users
      DROP POLICY IF EXISTS "Allow authenticated users to read ${tableName}" ON ${tableName};
      DROP POLICY IF EXISTS "Allow authenticated users to insert ${tableName}" ON ${tableName};
      DROP POLICY IF EXISTS "Allow authenticated users to update ${tableName}" ON ${tableName};
      DROP POLICY IF EXISTS "Allow authenticated users to delete ${tableName}" ON ${tableName};

      CREATE POLICY "Allow authenticated users to read ${tableName}" ON ${tableName}
          FOR SELECT USING (auth.uid() IS NOT NULL);

      CREATE POLICY "Allow authenticated users to insert ${tableName}" ON ${tableName}
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      CREATE POLICY "Allow authenticated users to update ${tableName}" ON ${tableName}
          FOR UPDATE USING (auth.uid() IS NOT NULL);

      CREATE POLICY "Allow authenticated users to delete ${tableName}" ON ${tableName}
          FOR DELETE USING (auth.uid() IS NOT NULL);

      -- Create weekly summary view
      CREATE OR REPLACE VIEW ${tablePrefix}_weekly_summary AS
      SELECT 
          week_number,
          COUNT(*) as total_ads,
          SUM(spend_usd) as total_spend,
          AVG(spend_usd) as avg_spend_per_ad,
          SUM(impressions) as total_impressions,
          AVG(days_running) as avg_days_running,
          COUNT(CASE WHEN creative_type = 'VIDEO' THEN 1 END) as video_ads,
          COUNT(CASE WHEN creative_type = 'IMAGE' THEN 1 END) as image_ads,
          COUNT(CASE WHEN is_creative_hub = 1 THEN 1 END) as creative_hub_ads,
          COUNT(DISTINCT adset_name) as unique_adsets,
          MAX(spend_usd) as highest_spend_ad,
          MIN(spend_usd) as lowest_spend_ad
      FROM ${tableName} 
      GROUP BY week_number 
      ORDER BY week_number;

      -- Create creative performance view
      CREATE OR REPLACE VIEW ${tablePrefix}_creative_performance AS
      SELECT 
          creative_type,
          aspect_ratio,
          COUNT(*) as ad_count,
          SUM(spend_usd) as total_spend,
          AVG(spend_usd) as avg_spend,
          SUM(impressions) as total_impressions,
          AVG(impressions) as avg_impressions,
          AVG(days_running) as avg_days_running,
          ROUND(SUM(impressions)::decimal / NULLIF(SUM(spend_usd), 0), 2) as impressions_per_dollar
      FROM ${tableName} 
      WHERE spend_usd > 0
      GROUP BY creative_type, aspect_ratio
      ORDER BY total_spend DESC;

      -- Create Creative Hub analysis view
      CREATE OR REPLACE VIEW ${tablePrefix}_creative_hub_analysis AS
      SELECT 
          CASE WHEN is_creative_hub = 1 THEN 'Creative Hub' ELSE 'Regular' END as ad_source,
          COUNT(*) as ad_count,
          SUM(spend_usd) as total_spend,
          AVG(spend_usd) as avg_spend,
          SUM(impressions) as total_impressions,
          AVG(impressions) as avg_impressions,
          AVG(days_running) as avg_days_running
      FROM ${tableName} 
      GROUP BY is_creative_hub
      ORDER BY total_spend DESC;
    `;

    // Execute the SQL to create the table and related objects
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_query: createTableSQL
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return NextResponse.json(
        { error: 'Failed to create product table: ' + createError.message },
        { status: 500 }
      );
    }

    // Also store the product metadata in a products table (create if doesn't exist)
    const { error: metadataError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Create products metadata table if it doesn't exist
        CREATE TABLE IF NOT EXISTS products (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          initials TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          table_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Insert the new product
        INSERT INTO products (name, initials, category, table_name)
        VALUES ('${name}', '${initials}', '${category}', '${tableName}')
        ON CONFLICT (initials) DO NOTHING;
      `
    });

    if (metadataError) {
      console.error('Error storing product metadata:', metadataError);
      // Don't fail the request since the table was created successfully
    }

    console.log(`✅ Successfully created product table: ${tableName}`);

    return NextResponse.json({
      success: true,
      message: `Product "${name}" created successfully`,
      tableName,
      initials: initials.toUpperCase()
    });

  } catch (error) {
    console.error('Error in create product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 