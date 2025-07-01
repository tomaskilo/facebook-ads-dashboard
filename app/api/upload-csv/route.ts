import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceSupabaseClient } from '@/lib/supabase-client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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
      // If table doesn't exist, provide helpful error message
      if (checkError.code === '42P01') {
        return NextResponse.json({ 
          error: `Table "${tableName}" does not exist. Please create the product table first by running the SQL provided when you created the product.` 
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