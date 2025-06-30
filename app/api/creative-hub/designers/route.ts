import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-client'

export async function GET() {
  try {
    console.log('Fetching creative hub designers...')

    const supabase = createServiceSupabaseClient()

    // Get all creative hub ads (is_creative_hub = 1 OR ad_name contains '_CHUB_')
    const { data: allAds, error: adsError } = await supabase
      .from('cb_ads_data')
      .select('*')
      .or('is_creative_hub.eq.1,ad_name.ilike.%_CHUB_%')

    if (adsError) {
      console.error('Error fetching creative hub ads:', adsError)
      return NextResponse.json({ error: adsError.message }, { status: 500 })
    }

    if (!allAds || allAds.length === 0) {
      console.log('No creative hub ads found')
      return NextResponse.json([])
    }

    console.log(`Found ${allAds.length} creative hub ad records`)

    // ONLY Creative Hub designers - these are the fixed team members
    const creativeHubDesigners = [
      { initials: 'AS', name: 'Arnas Smatas' },
      { initials: 'KZ', name: 'Kristijonas Zapalskis' },
      { initials: 'AA', name: 'Agne Alesiute' }
    ]

    // Create designer objects with performance data - ONLY for Creative Hub designers
    const designers = creativeHubDesigners.map(designerInfo => {
      const { initials, name } = designerInfo

      // Calculate performance for this Creative Hub designer using the correct naming pattern
      // Look for _AS_, _KZ_, _AA_ within Creative Hub ads
      const designerAds = allAds.filter(ad => 
        ad.ad_name && ad.ad_name.includes(`_${initials}_`)
      )

      const totalAds = new Set(designerAds.map(ad => ad.ad_name)).size
      const totalSpend = designerAds.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0)

      // Count weeks this designer has been active
      const activeWeeks = new Set(designerAds.map(ad => ad.week_number)).size

      // Count video vs image ads
      const videoAds = new Set(
        designerAds
          .filter(ad => ad.creative_type === 'VIDEO')
          .map(ad => ad.ad_name)
      ).size

      const imageAds = new Set(
        designerAds
          .filter(ad => ad.creative_type === 'IMAGE')
          .map(ad => ad.ad_name)
      ).size

      // Calculate scaled ads for this designer (only 2025 ads)
      const adGroups = designerAds.reduce((acc, ad) => {
        if (ad.year_created === 2025) {
          if (!acc[ad.ad_name]) {
            acc[ad.ad_name] = 0
          }
          acc[ad.ad_name] += ad.spend_usd || 0
        }
        return acc
      }, {} as Record<string, number>)

      const scaledAds = (Object.values(adGroups) as number[]).filter(spend => spend > 1000).length

      console.log(`Designer ${initials} (${name}): ${totalAds} ads, $${totalSpend} spend, ${activeWeeks} weeks`)

      return {
        initials,
        name,
        totalAds,
        totalSpend: Math.round(totalSpend * 100) / 100,
        activeWeeks,
        videoAds,
        imageAds,
        scaledAds,
        isPrePopulated: true
      }
    })

    // Sort by total spend descending
    designers.sort((a, b) => b.totalSpend - a.totalSpend)

    console.log(`Returning ${designers.length} Creative Hub designers (AS, KZ, AA only)`)
    return NextResponse.json(designers)

  } catch (error) {
    console.error('Error fetching creative hub designers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 