import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceSupabaseClient } from '@/lib/supabase-client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest, { params }: { params: { week: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()
    const { week } = params

    // Get ads data for the specific week (only 2025 ads)
    const { data: weekAdsData, error: weekAdsError } = await supabase
      .from('cb_ads_data')
      .select('*')
      .eq('week_number', week)
      .eq('year_created', 2025)
      .order('spend_usd', { ascending: false })

    if (weekAdsError) {
      throw new Error(`Failed to fetch week ads data: ${weekAdsError.message}`)
    }

    // Group by ad_name and calculate total spend for this week
    const adGroups = weekAdsData?.reduce((acc, ad) => {
      if (!acc[ad.ad_name]) {
        acc[ad.ad_name] = {
          ad_name: ad.ad_name,
          total_spend: 0,
          impressions: 0,
          days_running: ad.days_running,
          last_ad_spend_date: ad.last_ad_spend_date,
          first_ad_spend_date: ad.first_ad_spend_date,
          creative_type: ad.creative_type,
          creative_hub: ad.is_creative_hub === 1,
          aspect_ratio: ad.aspect_ratio,
          week_number: ad.week_number
        }
      }
      
      acc[ad.ad_name].total_spend += ad.spend_usd || 0
      acc[ad.ad_name].impressions += ad.impressions || 0
      
      // Keep the latest data for other fields
      if (new Date(ad.last_ad_spend_date) > new Date(acc[ad.ad_name].last_ad_spend_date)) {
        acc[ad.ad_name].days_running = ad.days_running
        acc[ad.ad_name].last_ad_spend_date = ad.last_ad_spend_date
        acc[ad.ad_name].creative_type = ad.creative_type
        acc[ad.ad_name].creative_hub = ad.is_creative_hub === 1
        acc[ad.ad_name].aspect_ratio = ad.aspect_ratio
      }
      
      return acc
    }, {} as Record<string, any>) || {}

    // Filter scaled ads (>$1000 spend for this week) and add calculated metrics
    const scaledAds = Object.values(adGroups)
      .filter((ad: any) => ad.total_spend > 1000)
      .map((ad: any) => {
        // Calculate mock ROAS based on spend
        const mockRoas = ad.total_spend > 2000 ? 
          (4.5 + Math.random() * 1.5) : // 4.5-6.0x for high spend
          (3.0 + Math.random() * 1.5) // 3.0-4.5x for medium spend

        // Determine status based on last spend date
        const lastSpendDate = new Date(ad.last_ad_spend_date)
        const daysSinceLastSpend = Math.floor((Date.now() - lastSpendDate.getTime()) / (1000 * 60 * 60 * 24))
        const isActive = daysSinceLastSpend <= 7 && ad.days_running > 0

        return {
          ad_name: ad.ad_name,
          total_spend: ad.total_spend,
          impressions: ad.impressions,
          days_running: ad.days_running,
          creative_type: ad.creative_type,
          creative_hub: ad.creative_hub,
          aspect_ratio: ad.aspect_ratio,
          roas: parseFloat(mockRoas.toFixed(1)),
          status: isActive ? 'Active' : 'Paused',
          week_number: ad.week_number,
          first_ad_spend_date: ad.first_ad_spend_date,
          last_ad_spend_date: ad.last_ad_spend_date
        }
      })
      .sort((a, b) => b.total_spend - a.total_spend) // Sort by spend descending

    return NextResponse.json({ 
      scaledAds, 
      week,
      totalCount: scaledAds.length 
    })

  } catch (error) {
    console.error('Colonbroom week scaled ads API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 