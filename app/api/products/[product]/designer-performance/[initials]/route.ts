import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string; initials: string } }
) {
  try {
    const { product, initials } = params;

    console.log(`🎨 Fetching designer performance for ${initials} in ${product}`)

    // First, get the product info from products table (case-insensitive)
    const { data: productInfo, error: productError } = await supabase
      .from('products')
      .select('table_name, name, initials')
      .ilike('name', `%${product}%`)
      .single();

    if (productError || !productInfo) {
      return NextResponse.json(
        { error: `Product "${product}" not found` },
        { status: 404 }
      );
    }

    const tableName = productInfo.table_name;
    console.log(`📊 Querying ${tableName} for designer ${initials}`);

    // Get all ads for this designer (ads containing _INITIALS_ in the name)
    const { data: designerAds, error } = await supabase
      .from(tableName)
      .select('*')
      .ilike('ad_name', `%_${initials}_%`)
      .order('week_number', { ascending: true })

    if (error) {
      console.error('Error fetching designer ads:', error)
      return NextResponse.json({ error: 'Failed to fetch designer ads' }, { status: 500 })
    }

    console.log(`📊 Found ${designerAds?.length || 0} ads for designer ${initials} in ${product}`)

    if (!designerAds || designerAds.length === 0) {
      return NextResponse.json({ 
        designerPerformance: [],
        totalAds: 0,
        totalSpend: 0
      })
    }

    // Group by week and calculate statistics
    const weeklyStats: { [key: string]: any } = {}

    designerAds.forEach(ad => {
      const week = ad.week_number
      
      if (!weeklyStats[week]) {
        weeklyStats[week] = {
          week,
          totalAds: new Set(),
          videoAds: new Set(),
          imageAds: new Set(),
          scaledAds: new Map(), // Map to track ad spend for scaling calculation
          totalSpend: 0
        }
      }

      // Add unique ads (based on ad_name)
      weeklyStats[week].totalAds.add(ad.ad_name)
      weeklyStats[week].totalSpend += ad.spend_usd || 0

      // Categorize by creative type
      if (ad.creative_type === 'VIDEO') {
        weeklyStats[week].videoAds.add(ad.ad_name)
      } else {
        weeklyStats[week].imageAds.add(ad.ad_name)
      }

      // Track spend per ad for scaling calculation
      const currentSpend = weeklyStats[week].scaledAds.get(ad.ad_name) || 0
      weeklyStats[week].scaledAds.set(ad.ad_name, currentSpend + (ad.spend_usd || 0))
    })

    // Convert to final format
    const designerPerformance = Object.values(weeklyStats).map((week: any) => {
      // Count scaled ads (>$1000 spend in that week)
      let scaledAdsCount = 0
      for (const [adName, spend] of week.scaledAds) {
        if (spend > 1000) {
          scaledAdsCount += 1
        }
      }

      return {
        week: week.week,
        totalAds: week.totalAds.size,
        videoAds: week.videoAds.size,
        imageAds: week.imageAds.size,
        scaledAds: scaledAdsCount,
        totalSpend: week.totalSpend
      }
    })

    // Sort by week number
    designerPerformance.sort((a, b) => {
      const getWeekNumber = (week: string) => parseInt(week.replace('W', ''))
      return getWeekNumber(a.week) - getWeekNumber(b.week)
    })

    // Calculate totals
    const totalAds = new Set(designerAds.map(ad => ad.ad_name)).size
    const totalSpend = designerAds.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0)

    console.log(`✅ Designer ${initials} performance in ${product}:`, {
      totalWeeks: designerPerformance.length,
      totalAds,
      totalSpend
    })

    return NextResponse.json({
      designerPerformance,
      totalAds,
      totalSpend
    })

  } catch (error) {
    console.error('Error in designer performance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 