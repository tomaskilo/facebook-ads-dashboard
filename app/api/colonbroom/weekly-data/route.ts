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

    // Get all ads data by fetching each week individually (bypasses 1000 record limit)
    let allAdsData: any[] = []
    let allAdsError = null
    
    try {
      // Get list of all weeks first
      const weekNumbers = []
      for (let i = 1; i <= 25; i++) {
        weekNumbers.push(`W${i.toString().padStart(2, '0')}`)
      }
      
      // Fetch data for each week individually
      for (const weekNumber of weekNumbers) {
        const { data: weekData, error: weekError } = await supabase
          .from('cb_ads_data')
          .select('*')
          .eq('week_number', weekNumber)
          
        if (weekError) {
          console.warn(`Error fetching ${weekNumber}:`, weekError)
          continue // Continue with other weeks
        }
        
        if (weekData && weekData.length > 0) {
          allAdsData = allAdsData.concat(weekData)
        }
      }
      
      // Sort by week number after combining all data
      allAdsData.sort((a, b) => a.week_number.localeCompare(b.week_number))
      
      console.log(`📊 Fetched data for ${weekNumbers.length} weeks, total records: ${allAdsData.length}`)
    } catch (error) {
      allAdsError = error
    }

    if (allAdsError) {
      throw new Error(`Failed to fetch ads data: ${allAdsError}`)
    }

    console.log('Raw ads data count:', allAdsData?.length)
    console.log('Unique weeks in data:', Array.from(new Set(allAdsData?.map(ad => ad.week_number))).sort())

    // Group data by week and calculate metrics
    const weeklyData = allAdsData?.reduce((acc, ad) => {
      const weekKey = ad.week_number
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          spend: 0,
          adsCount: 0,
          scaledAds: 0,
          workingAds: 0,
          videoAds: 0,
          imageAds: 0,
          uniqueAdNames: new Set(),
          adsByType: new Map(), // Track unique ads by creative type
          adSpendByName: new Map() // Track total spend per ad name
        }
      }
      
      // Add spend
      acc[weekKey].spend += ad.spend_usd || 0
      
      // Add unique ad name
      acc[weekKey].uniqueAdNames.add(ad.ad_name)
      
      // Track spend per ad name for scaling calculations
      const currentSpend = acc[weekKey].adSpendByName.get(ad.ad_name) || 0
      acc[weekKey].adSpendByName.set(ad.ad_name, currentSpend + (ad.spend_usd || 0))
      
      // Track unique ads by creative type (deduplicated)
      if (!acc[weekKey].adsByType.has(ad.ad_name)) {
        acc[weekKey].adsByType.set(ad.ad_name, ad.creative_type)
        
        // Count creative types (deduplicated by ad name)
        if (ad.creative_type === 'VIDEO') {
          acc[weekKey].videoAds += 1
        } else if (ad.creative_type === 'IMAGE') {
          acc[weekKey].imageAds += 1
        }
      }
      
      return acc
    }, {} as Record<string, any>) || {}

    console.log('Processed weekly data keys:', Object.keys(weeklyData).sort())

    // Convert to array and calculate final counts
    const weeklyArray = Object.values(weeklyData).map((week: any) => {
      // Calculate scaled and working ads for this week (deduplicated, only 2025 ads)
      let scaledAds = 0
      let workingAds = 0
      
      // Filter ads to only include 2025 year when calculating scaled/working counts
      const ads2025InWeek = allAdsData?.filter(ad => 
        ad.week_number === week.week && 
        ad.year_created === 2025
      ) || []
      
      // Group 2025 ads by name and calculate spend
      const ads2025SpendByName = new Map()
      ads2025InWeek.forEach(ad => {
        const currentSpend = ads2025SpendByName.get(ad.ad_name) || 0
        ads2025SpendByName.set(ad.ad_name, currentSpend + (ad.spend_usd || 0))
      })
      
      // Count scaled and working ads only from 2025
      for (const [adName, totalSpend] of ads2025SpendByName) {
        if (totalSpend > 1000) {
          scaledAds += 1
        } else if (totalSpend >= 100 && totalSpend <= 1000) {
          workingAds += 1
        }
      }
      
      return {
        week: week.week,
        spend: week.spend,
        adsCount: week.uniqueAdNames.size, // Use unique ad names count
        scaledAds: scaledAds,
        workingAds: workingAds,
        videoAds: week.videoAds,
        imageAds: week.imageAds
      }
    })

    // Sort by week number
    weeklyArray.sort((a, b) => {
      // Extract numeric part from week strings like "W01", "W02"
      const getWeekNumber = (week: string) => parseInt(week.replace('W', ''))
      return getWeekNumber(a.week) - getWeekNumber(b.week)
    })

    console.log('Final weekly array:', weeklyArray.map(w => ({ week: w.week, adsCount: w.adsCount, spend: w.spend })))

    return NextResponse.json({ weeklyData: weeklyArray })

  } catch (error) {
    console.error('Colonbroom weekly data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 