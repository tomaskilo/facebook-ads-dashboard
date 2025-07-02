import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-client'

export async function GET() {
  try {
    console.log('Fetching creative hub designers...')

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
      return NextResponse.json([])
    }

    console.log(`Found ${allAds.length} creative hub ad records`)

    // ONLY Creative Hub designers - these are the fixed team members
    const creativeHubDesigners = [
      { initials: 'AS', name: 'Arnas Smatas' },
      { initials: 'KZ', name: 'Kristijonas Zapalskis' },
      { initials: 'AA', name: 'Agne Alesiute' }
    ]

    // Check if we have Creative Hub data but no individual designer attribution
    let hasDesignerAttribution = false
    if (allAds.length > 0) {
      hasDesignerAttribution = allAds.some(ad => 
        ad.ad_name && (
          ad.ad_name.includes('_AS_') || 
          ad.ad_name.includes('_KZ_') || 
          ad.ad_name.includes('_AA_')
        )
      )

      if (!hasDesignerAttribution) {
        console.log(`⚠️  Found ${allAds.length} Creative Hub ads but no individual designer attribution in ad names`)
        console.log('Creative Hub ads use different naming convention - will return zeros with attribution note')
      } else {
        console.log(`✅ Found ${allAds.length} Creative Hub ads with designer attribution`)
      }
    }

    // Create designer objects with performance data - ONLY for Creative Hub designers
    const designers = creativeHubDesigners.map(designerInfo => {
      const { initials, name } = designerInfo

      // Calculate performance for this Creative Hub designer using the correct naming pattern
      // Look for _AS_, _KZ_, _AA_ within Creative Hub ads
      const designerAds = allAds.filter(ad => 
        ad.ad_name && ad.ad_name.includes(`_${initials}_`)
      )

      const totalAds = new Set(designerAds.map((ad: any) => ad.ad_name)).size
      const totalSpend = designerAds.reduce((sum: any, ad: any) => sum + (ad.spend_usd || 0), 0)

      // Count weeks this designer has been active
      const activeWeeks = new Set(designerAds.map((ad: any) => ad.week_number)).size

      // Count video vs image ads
      const videoAds = new Set(
        designerAds
          .filter((ad: any) => ad.creative_type === 'VIDEO')
          .map((ad: any) => ad.ad_name)
      ).size

      const imageAds = new Set(
        designerAds
          .filter((ad: any) => ad.creative_type === 'IMAGE')
          .map((ad: any) => ad.ad_name)
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

      const designerData: any = {
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

      // Add attribution note if no designer attribution is available
      if (!hasDesignerAttribution && allAds.length > 0) {
        designerData.note = 'Attribution unavailable - Creative Hub uses different naming convention'
      }

      return designerData
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