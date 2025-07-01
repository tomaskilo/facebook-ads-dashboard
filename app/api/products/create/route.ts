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

    // Check if product already exists in metadata
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('initials', initials)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing product:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing products' },
        { status: 500 }
      );
    }

    if (existingProduct) {
      return NextResponse.json(
        { error: `Product with initials "${initials}" already exists` },
        { status: 409 }
      );
    }

    // Store the product metadata
    const { error: metadataError } = await supabase
      .from('products')
      .insert({
        name,
        initials,
        category,
        table_name: tableName
      });

    if (metadataError) {
      console.error('Error storing product metadata:', metadataError);
      return NextResponse.json(
        { error: 'Failed to store product metadata: ' + metadataError.message },
        { status: 500 }
      );
    }

    // Generate SQL for manual table creation
    const createTableSQL = `
-- Create table for ${name} (${initials})
CREATE TABLE ${tableName} (
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
CREATE INDEX idx_${tablePrefix}_ads_data_week_number ON ${tableName}(week_number);
CREATE INDEX idx_${tablePrefix}_ads_data_ad_name ON ${tableName}(ad_name);
CREATE INDEX idx_${tablePrefix}_ads_data_creative_type ON ${tableName}(creative_type);
CREATE INDEX idx_${tablePrefix}_ads_data_spend_usd ON ${tableName}(spend_usd);

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read ${tableName}" ON ${tableName}
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert ${tableName}" ON ${tableName}
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update ${tableName}" ON ${tableName}
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete ${tableName}" ON ${tableName}
    FOR DELETE USING (auth.uid() IS NOT NULL);
`;

    console.log(`✅ Successfully created product metadata for: ${tableName}`);

    return NextResponse.json({
      success: true,
      message: `Product "${name}" metadata created successfully`,
      tableName,
      initials: initials.toUpperCase(),
      sqlToRun: createTableSQL.trim(),
      instructions: `Product metadata saved! Now run the provided SQL in your Supabase SQL Editor to create the table.`
    });

  } catch (error) {
    console.error('Error in create product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 