import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceSupabaseClient } from '@/lib/supabase-client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Get total spend across all weeks
    const { data: totalSpendData, error: totalSpendError } = await supabase
      .from('cb_ads_data')
      .select('spend_usd')
      .range(0, 49999) // Use range to get all records

    if (totalSpendError) {
      throw new Error(`Failed to fetch total spend: ${totalSpendError.message}`)
    }

    const totalSpend = totalSpendData?.reduce((sum, row) => sum + (row.spend_usd || 0), 0) || 0

    // Get all ads for calculations - need to group by ad_name for deduplication
    const { data: allAdsData, error: allAdsError } = await supabase
      .from('cb_ads_data')
      .select('ad_name, days_running, last_ad_spend_date, spend_usd, week_number, first_ad_spend_date, year_created')
      .range(0, 49999) // Use range to get all records

    if (allAdsError) {
      throw new Error(`Failed to fetch ads data: ${allAdsError.message}`)
    }

    // Group by ad_name and sum spend for each unique ad (for total count)
    const adGroups = allAdsData?.reduce((acc, ad) => {
      if (!acc[ad.ad_name]) {
        acc[ad.ad_name] = {
          ad_name: ad.ad_name,
          total_spend: 0,
          days_running: ad.days_running,
          last_ad_spend_date: ad.last_ad_spend_date,
          first_ad_spend_date: ad.first_ad_spend_date,
          week_number: ad.week_number
        }
      }
      acc[ad.ad_name].total_spend += ad.spend_usd || 0
      // Keep the latest data for other fields
      if (new Date(ad.last_ad_spend_date) > new Date(acc[ad.ad_name].last_ad_spend_date)) {
        acc[ad.ad_name].days_running = ad.days_running
        acc[ad.ad_name].last_ad_spend_date = ad.last_ad_spend_date
        acc[ad.ad_name].week_number = ad.week_number
      }
      return acc
    }, {} as Record<string, any>) || {}

    const uniqueAds = Object.values(adGroups)

    // Calculate active ads (deduplicated)
    // Active if: stopped on Sunday OR (>7 days running AND last spend on Sunday)
    const activeAds = uniqueAds.filter(ad => {
      const lastSpendDate = new Date(ad.last_ad_spend_date)
      const isSunday = lastSpendDate.getDay() === 0 // Sunday = 0
      const moreThan7Days = ad.days_running > 7
      
      return isSunday || (moreThan7Days && isSunday)
    }).length

    // Calculate scaled and working ads using the same logic as weekly data (only 2025 ads)
    // Group by week first, then check spend per week
    const weeklyAdSpend = allAdsData?.reduce((acc, ad) => {
      // Only include ads from year 2025 for scaled/working calculations
      if (ad.year_created !== 2025) {
        return acc
      }
      
      const weekKey = ad.week_number
      if (!acc[weekKey]) {
        acc[weekKey] = new Map()
      }
      const currentSpend = acc[weekKey].get(ad.ad_name) || 0
      acc[weekKey].set(ad.ad_name, currentSpend + (ad.spend_usd || 0))
      return acc
    }, {} as Record<string, Map<string, number>>) || {}

    // Find unique ads that are scaled or working in ANY week
    const scaledAdNames = new Set<string>()
    const workingAdNames = new Set<string>()

    Object.values(weeklyAdSpend).forEach(weekMap => {
      Array.from(weekMap.entries()).forEach(([adName, weeklySpend]) => {
        if (weeklySpend > 1000) {
          scaledAdNames.add(adName)
        } else if (weeklySpend >= 100 && weeklySpend <= 1000) {
          workingAdNames.add(adName)
        }
      })
    })

    // Remove working ads that are also scaled (scaled takes precedence)
    Array.from(scaledAdNames).forEach(adName => workingAdNames.delete(adName))

    const scaledAds = scaledAdNames.size
    const workingAds = workingAdNames.size

    // Get latest week data for trend calculation
    const { data: latestWeekData, error: latestWeekError } = await supabase
      .from('cb_ads_data')
      .select('week_number, spend_usd')
      .order('week_number', { ascending: false })
      .range(0, 49999) // Use range to get all records

    if (latestWeekError) {
      throw new Error(`Failed to fetch latest week data: ${latestWeekError.message}`)
    }

    // Calculate spend change (comparing latest week vs previous)
    let totalSpendChange = 0
    if (latestWeekData && latestWeekData.length > 0) {
      const weekGroups = latestWeekData.reduce((acc, row) => {
        acc[row.week_number] = (acc[row.week_number] || 0) + row.spend_usd
        return acc
      }, {} as Record<string, number>)
      
      const weeks = Object.keys(weekGroups).sort()
      if (weeks.length >= 2) {
        const latestWeekSpend = weekGroups[weeks[weeks.length - 1]]
        const previousWeekSpend = weekGroups[weeks[weeks.length - 2]]
        totalSpendChange = previousWeekSpend > 0 
          ? ((latestWeekSpend - previousWeekSpend) / previousWeekSpend) * 100 
          : 0
      }
    }

    const stats = {
      totalSpend,
      totalSpendChange,
      activeAds,
      scaledAds,
      workingAds,
      newAds: uniqueAds.length, // Total unique ads
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Colonbroom stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 