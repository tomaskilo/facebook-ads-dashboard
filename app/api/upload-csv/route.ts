import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceSupabaseClient } from '@/lib/supabase-client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { csvData, weekNumber, tableName } = body

    if (!csvData || !Array.isArray(csvData) || !weekNumber || !tableName) {
      return NextResponse.json({ error: 'Invalid data format. csvData, weekNumber, and tableName are required.' }, { status: 400 })
    }

    // Validate table name to prevent SQL injection
    if (!/^[a-z0-9_]+_ads_data$/.test(tableName)) {
      return NextResponse.json({ error: 'Invalid table name format' }, { status: 400 })
    }

    // Create service role client to bypass RLS
    const supabase = createServiceSupabaseClient()

    // Check for duplicate week data in the specific table
    const { data: existingData, error: checkError } = await supabase
      .from(tableName)
      .select('week_number')
      .eq('week_number', weekNumber)
      .limit(1)

    if (checkError) {
      console.error('Error checking duplicates:', checkError)
      
      // If table doesn't exist, provide helpful error message with SQL
      if (checkError.code === '42P01') {
        // Extract product initials from table name
        const productInitials = tableName.replace('_ads_data', '').toUpperCase()
        
        // Generate table creation SQL
        const createTableSQL = `
-- Create table for ${productInitials} product data
CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    ad_name TEXT NOT NULL,
    adset_name TEXT,
    creative_type TEXT CHECK (creative_type IN ('IMAGE', 'VIDEO')),
    spend_usd DECIMAL(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    first_ad_spend_date DATE,
    last_ad_spend_date DATE,
    days_running INTEGER DEFAULT 0,
    is_creative_hub INTEGER DEFAULT 0 CHECK (is_creative_hub IN (0, 1)),
    year_created INTEGER,
    month_created TEXT,
    aspect_ratio TEXT,
    week_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_${tableName}_week_number ON ${tableName}(week_number);
CREATE INDEX IF NOT EXISTS idx_${tableName}_spend ON ${tableName}(spend_usd DESC);
CREATE INDEX IF NOT EXISTS idx_${tableName}_creative_hub ON ${tableName}(is_creative_hub);
CREATE INDEX IF NOT EXISTS idx_${tableName}_ad_name ON ${tableName}(ad_name);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_${tableName}_updated_at ON ${tableName};
CREATE TRIGGER trigger_update_${tableName}_updated_at
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION update_${tableName}_updated_at();`.trim()
        
        return NextResponse.json({ 
          error: `Table "${tableName}" does not exist`,
          tableNotFound: true,
          productInitials: productInitials,
          sqlToCreate: createTableSQL,
          message: `The table for product "${productInitials}" hasn't been created yet. Run the provided SQL in Supabase to create it, then try uploading again.`,
          instructions: 'Copy the SQL below, paste it into your Supabase SQL Editor, and run it. Then retry the upload.'
        }, { status: 404 })
      }
      return NextResponse.json({ error: 'Database error while checking duplicates' }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ 
        error: `Week ${weekNumber} data already exists in ${tableName}. Please choose a different week or delete existing data first.` 
      }, { status: 409 })
    }

    // Insert the data into the specified table
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(csvData)

    if (insertError) {
      console.error('Error inserting data:', insertError)
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded ${csvData.length} ads for week ${weekNumber} to ${tableName}!`,
      count: csvData.length,
      tableName: tableName
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 