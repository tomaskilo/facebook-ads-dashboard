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
    const { data: tableExists, error: tableCheckError } = await supabase.rpc(
      'check_table_exists',
      { table_name_param: tableName }
    );

    if (tableCheckError) {
      console.error('Error checking table existence:', tableCheckError);
      // Continue anyway - the CREATE TABLE IF NOT EXISTS will handle duplicates
    }

    if (tableExists) {
      return NextResponse.json(
        { error: `Product with initials "${initials}" already exists` },
        { status: 409 }
      );
    }

    // Create the new table step by step to avoid syntax errors
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (
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
      )`;

    // Execute the table creation
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

    // Store the product metadata using direct Supabase insert
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