import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-client'

export async function GET() {
  try {
    console.log('Fetching creative hub weekly data...')

    const supabase = createServiceSupabaseClient()

    // Get all creative hub ads (is_creative_hub = 1 OR ad_name contains '_CHUB_')
    const { data: allAds, error: adsError } = await supabase
      .from('cb_ads_data')
      .select('*')
      .or('is_creative_hub.eq.1,ad_name.ilike.%_CHUB_%')
      .order('week_number', { ascending: true })

    if (adsError) {
      console.error('Error fetching creative hub ads:', adsError)
      return NextResponse.json({ error: adsError.message }, { status: 500 })
    }

    if (!allAds || allAds.length === 0) {
      console.log('No creative hub ads found')
      return NextResponse.json([])
    }

    console.log(`Found ${allAds.length} creative hub ad records`)

    // Group by week and calculate metrics
    const weeklyData = new Map()

    allAds.forEach(ad => {
      const week = ad.week_number
      if (!week) return

      if (!weeklyData.has(week)) {
        weeklyData.set(week, {
          week,
          totalAds: new Set(),
          videoAds: new Set(),
          imageAds: new Set(),
          scaledAds: new Set(),
          totalSpend: 0
        })
      }

      const weekData = weeklyData.get(week)
      
      // Add unique ads
      weekData.totalAds.add(ad.ad_name)
      
      // Add by creative type
      if (ad.creative_type === 'VIDEO') {
        weekData.videoAds.add(ad.ad_name)
      } else if (ad.creative_type === 'IMAGE') {
        weekData.imageAds.add(ad.ad_name)
      }

      // Add scaled ads (>$1000 spend from 2025)
      if ((ad.spend_usd || 0) > 1000 && ad.year_created === 2025) {
        weekData.scaledAds.add(ad.ad_name)
      }

      // Add spend
      weekData.totalSpend += (ad.spend_usd || 0)
    })

    // Convert to array and format
    const result = Array.from(weeklyData.values()).map(weekData => ({
      week: weekData.week,
      totalAds: weekData.totalAds.size,
      videoAds: weekData.videoAds.size,
      imageAds: weekData.imageAds.size,
      scaledAds: weekData.scaledAds.size,
      totalSpend: Math.round(weekData.totalSpend * 100) / 100
    }))

    // Sort by week
    result.sort((a, b) => {
      const weekA = parseInt(a.week.replace('W', ''))
      const weekB = parseInt(b.week.replace('W', ''))
      return weekA - weekB
    })

    console.log(`Processed ${result.length} weeks of creative hub data`)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching creative hub weekly data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 