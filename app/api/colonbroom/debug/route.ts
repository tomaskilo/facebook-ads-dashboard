import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceSupabaseClient } from '@/lib/supabase-client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Test 1: Get raw data for Week 4 specifically
    const { data: week4Data, error: week4Error } = await supabase
      .from('cb_ads_data')
      .select('*')
      .eq('week_number', 'W04')
      .limit(5)

    // Test 2: Get all unique week numbers
    const { data: allWeeksData, error: allWeeksError } = await supabase
      .from('cb_ads_data')
      .select('week_number')
      .range(0, 49999) // Use range to get all records

    // Test 3: Get ALL records to see if there's a discrepancy
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('cb_ads_data')
      .select('week_number, ad_name, spend_usd')
      .range(0, 49999) // Use range to get all records

    // Test 4: Direct query for each week
    const { data: w01Data } = await supabase.from('cb_ads_data').select('week_number').eq('week_number', 'W01')
    const { data: w02Data } = await supabase.from('cb_ads_data').select('week_number').eq('week_number', 'W02')
    const { data: w03Data } = await supabase.from('cb_ads_data').select('week_number').eq('week_number', 'W03')
    const { data: w04DataDirect } = await supabase.from('cb_ads_data').select('week_number').eq('week_number', 'W04')

    if (week4Error || allWeeksError || allRecordsError) {
      throw new Error(`Debug query failed: ${week4Error?.message || allWeeksError?.message || allRecordsError?.message}`)
    }

    // Get unique weeks from all records
    const uniqueWeeksFromAll = Array.from(new Set(allRecords?.map(row => row.week_number) || [])).sort()
    const uniqueWeeksFromSelect = Array.from(new Set(allWeeksData?.map(row => row.week_number) || [])).sort()

    // Get counts
    const weekCountsFromAll = allRecords?.reduce((acc, row) => {
      acc[row.week_number] = (acc[row.week_number] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const weekCountsFromSelect = allWeeksData?.reduce((acc, row) => {
      acc[row.week_number] = (acc[row.week_number] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      // Original data
      week4_sample_records: week4Data?.length || 0,
      week4_sample_data: week4Data?.slice(0, 2),
      
      // Comparison data
      total_records_all_query: allRecords?.length || 0,
      total_records_select_query: allWeeksData?.length || 0,
      
      unique_weeks_from_all: uniqueWeeksFromAll,
      unique_weeks_from_select: uniqueWeeksFromSelect,
      
      counts_from_all_query: weekCountsFromAll,
      counts_from_select_query: weekCountsFromSelect,
      
      // Direct week queries
      direct_queries: {
        W01_count: w01Data?.length || 0,
        W02_count: w02Data?.length || 0, 
        W03_count: w03Data?.length || 0,
        W04_count: w04DataDirect?.length || 0
      },
      
      // Sample W04 record details
      w04_sample: week4Data?.[0] ? {
        week_number: week4Data[0].week_number,
        ad_name: week4Data[0].ad_name,
        spend_usd: week4Data[0].spend_usd,
        created_at: week4Data[0].created_at
      } : null
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 