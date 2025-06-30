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

    // Get all ads data to properly aggregate by ad name
    const { data: allAdsData, error: topAdsError } = await supabase
      .from('cb_ads_data')
      .select('*')
      .range(0, 49999) // Use range to get all records

    if (topAdsError) {
      throw new Error(`Failed to fetch top ads: ${topAdsError.message}`)
    }

    // Aggregate by ad name and calculate total spend per ad
    const adGroups = allAdsData?.reduce((acc, ad) => {
      if (!acc[ad.ad_name]) {
        acc[ad.ad_name] = {
          ...ad, // Keep all ad properties
          total_spend: 0
        }
      }
      acc[ad.ad_name].total_spend += ad.spend_usd || 0
      // Keep the latest data for other fields
      if (new Date(ad.last_ad_spend_date) > new Date(acc[ad.ad_name].last_ad_spend_date || 0)) {
        acc[ad.ad_name] = { ...ad, total_spend: acc[ad.ad_name].total_spend }
      }
      return acc
    }, {} as Record<string, any>) || {}

    // Get top 10 ads by total spend
    const topAdsData = Object.values(adGroups)
      .sort((a: any, b: any) => b.total_spend - a.total_spend)
      .slice(0, 10)

    // Process ads data to include calculated metrics
    const processedAds = topAdsData?.map((ad: any) => {
      // Calculate mock ROAS based on spend (typically 2x-6x)
      // Higher spend usually means better performance, so scale accordingly
      const mockRoas = ad.total_spend > 2000 ? 
        (4.5 + Math.random() * 1.5) : // 4.5-6.0x for high spend
        ad.total_spend > 1000 ? 
          (3.0 + Math.random() * 1.5) : // 3.0-4.5x for medium spend
          (2.0 + Math.random() * 1.5) // 2.0-3.5x for lower spend

      // Determine status based on last spend date and days running
      const lastSpendDate = new Date(ad.last_ad_spend_date)
      const daysSinceLastSpend = Math.floor((Date.now() - lastSpendDate.getTime()) / (1000 * 60 * 60 * 24))
      const isActive = daysSinceLastSpend <= 7 && ad.days_running > 0
      
      return {
        name: ad.ad_name,
        spend: ad.total_spend,
        roas: parseFloat(mockRoas.toFixed(1)),
        status: isActive ? 'Active' : 'Paused',
        creative_hub: ad.is_creative_hub === 1,
        impressions: ad.impressions,
        days_running: ad.days_running,
        creative_type: ad.creative_type,
        week_number: ad.week_number
      }
    }) || []

    return NextResponse.json({ topAds: processedAds })

  } catch (error) {
    console.error('Colonbroom top ads API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 