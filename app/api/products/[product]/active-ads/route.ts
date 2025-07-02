import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { product } = params
    console.log(`📊 Calculating active ads for product: ${product}`)

    // Get product details
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', product)
      .single()

    if (productError || !productData) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const tableName = productData.table_name

    // Get current date and calculate last week date
    const currentDate = new Date()
    const lastWeekDate = new Date(currentDate)
    lastWeekDate.setDate(currentDate.getDate() - 7)

    // Get the current week number for filtering
    const getCurrentWeek = () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), 0, 1)
      const diff = now.getTime() - start.getTime()
      const oneWeek = 1000 * 60 * 60 * 24 * 7
      return Math.ceil(diff / oneWeek)
    }

    const currentWeek = getCurrentWeek()
    const currentWeekString = `W${currentWeek.toString().padStart(2, '0')}`
    const lastWeekString = `W${(currentWeek - 1).toString().padStart(2, '0')}`

    console.log(`🗓️ Current week: ${currentWeekString}, checking for active ads in ${lastWeekString} and ${currentWeekString}`)

    // Query for truly active ads:
    // 1. Has spend in the last 2 weeks (current or previous week)
    // 2. Has days_running > 3
    // 3. Has meaningful spend (> $1)
    const { data: activeAdsData, error: activeAdsError } = await supabase
      .from(tableName)
      .select('ad_name, spend, days_running, week_number, creative_type')
      .or(`week_number.eq.${currentWeekString},week_number.eq.${lastWeekString}`)
      .gt('days_running', 3)
      .gt('spend', 1)
      .order('spend', { ascending: false })

    if (activeAdsError) {
      console.error('❌ Error fetching active ads:', activeAdsError)
      return NextResponse.json({ error: 'Failed to fetch active ads data' }, { status: 500 })
    }

    // Remove duplicates by ad_name and get unique active ads
    const uniqueActiveAds = new Map()
    activeAdsData?.forEach(ad => {
      if (!uniqueActiveAds.has(ad.ad_name) || uniqueActiveAds.get(ad.ad_name).spend < ad.spend) {
        uniqueActiveAds.set(ad.ad_name, ad)
      }
    })

    const activeAds = Array.from(uniqueActiveAds.values())
    const activeAdsCount = activeAds.length
    const totalActiveSpend = activeAds.reduce((sum, ad) => sum + (ad.spend || 0), 0)
    const videoAdsCount = activeAds.filter(ad => ad.creative_type === 'VIDEO').length
    const imageAdsCount = activeAds.filter(ad => ad.creative_type === 'IMAGE').length

    console.log(`✅ Found ${activeAdsCount} truly active ads for ${product}`)
    console.log(`💰 Total active spend: $${totalActiveSpend.toLocaleString()}`)
    console.log(`📹 Video ads: ${videoAdsCount}, 📸 Image ads: ${imageAdsCount}`)

    return NextResponse.json({
      activeAdsCount,
      totalActiveSpend,
      videoAdsCount,
      imageAdsCount,
      activeAds: activeAds.slice(0, 10), // Return top 10 for debugging
      criteria: {
        minDaysRunning: 3,
        minSpend: 1,
        weeksChecked: [currentWeekString, lastWeekString],
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error in active ads calculation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 