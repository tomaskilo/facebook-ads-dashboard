import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-client'

export async function GET() {
  try {
    console.log('Fetching creative hub stats...')

    const supabase = createServiceSupabaseClient()

    // Get all creative hub ads (only properly marked ones)
    const { data: allAds, error: adsError } = await supabase
      .from('cb_ads_data')
      .select('*')
      .eq('is_creative_hub', 1)

    if (adsError) {
      console.error('Error fetching creative hub ads:', adsError)
      return NextResponse.json({ error: adsError.message }, { status: 500 })
    }

    if (!allAds || allAds.length === 0) {
      console.log('No creative hub ads found')
      return NextResponse.json({
        totalSpend: 0,
        totalAds: 0,
        scaledAds: 0,
        workingAds: 0,
        videoAds: 0,
        imageAds: 0
      })
    }

    console.log(`Found ${allAds.length} creative hub ad records`)

    // Calculate total spend
    const totalSpend = allAds.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0)

    // Group by ad_name to get unique ads and their weekly spend
    const adGroups = allAds.reduce((acc, ad) => {
      if (!acc[ad.ad_name]) {
        acc[ad.ad_name] = {
          ad_name: ad.ad_name,
          weeks: new Map(),
          creative_type: ad.creative_type,
          year_created: ad.year_created
        }
      }
      
      // Track spend per week for this ad
      const weekSpend = acc[ad.ad_name].weeks.get(ad.week_number) || 0
      acc[ad.ad_name].weeks.set(ad.week_number, weekSpend + (ad.spend_usd || 0))
      
      return acc
    }, {} as Record<string, any>)

    const uniqueAds = Object.values(adGroups)
    const totalAds = uniqueAds.length

    // Count video vs image ads (deduplicated)
    let videoAds = 0
    let imageAds = 0
    uniqueAds.forEach((ad: any) => {
      if (ad.creative_type === 'VIDEO') {
        videoAds++
      } else if (ad.creative_type === 'IMAGE') {
        imageAds++
      }
    })

    // Calculate scaled and working ads (only 2025 ads)
    const scaledAdNames = new Set()
    const workingAdNames = new Set()

    uniqueAds.forEach((ad: any) => {
      if (ad.year_created === 2025) {
        // Check if this ad was scaled or working in ANY week
        let wasScaled = false
        let wasWorking = false
        
        for (const [week, weekSpend] of ad.weeks) {
          if (weekSpend > 1000) {
            wasScaled = true
            break
          } else if (weekSpend >= 100 && weekSpend <= 1000) {
            wasWorking = true
          }
        }
        
        if (wasScaled) {
          scaledAdNames.add(ad.ad_name)
        } else if (wasWorking) {
          workingAdNames.add(ad.ad_name)
        }
      }
    })

    const scaledAds = scaledAdNames.size
    const workingAds = workingAdNames.size

    console.log('Creative Hub stats calculated:', {
      totalSpend,
      totalAds,
      scaledAds,
      workingAds,
      videoAds,
      imageAds
    })

    return NextResponse.json({
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalAds,
      scaledAds,
      workingAds,
      videoAds,
      imageAds
    })

  } catch (error) {
    console.error('Error fetching creative hub stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 