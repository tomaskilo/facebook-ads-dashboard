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
    const { csvData, weekNumber } = body

    if (!csvData || !Array.isArray(csvData) || !weekNumber) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Create service role client to bypass RLS
    const supabase = createServiceSupabaseClient()

    // Check for duplicate week data
    const { data: existingData, error: checkError } = await supabase
      .from('cb_ads_data')
      .select('week_number')
      .eq('week_number', weekNumber)
      .limit(1)

    if (checkError) {
      console.error('Error checking duplicates:', checkError)
      return NextResponse.json({ error: 'Database error while checking duplicates' }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ 
        error: `Week ${weekNumber} data already exists in the database. Please choose a different week or delete existing data first.` 
      }, { status: 409 })
    }

    // Insert the data
    const { error: insertError } = await supabase
      .from('cb_ads_data')
      .insert(csvData)

    if (insertError) {
      console.error('Error inserting data:', insertError)
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded ${csvData.length} ads for week ${weekNumber}!`,
      count: csvData.length
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 