import { NextRequest, NextResponse } from 'next/server'
import { adsCalculator } from '@/lib/ads-calculations'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params
    console.log(`📊 Calculating active ads for product: ${product} using centralized calculator`)

    // Get product info and calculate active ads using centralized utility
    const productInfo = await adsCalculator.getProductInfo(product)
    const activeAdsResult = await adsCalculator.calculateActiveAds(productInfo.table_name, productInfo.name)

    return NextResponse.json({
      activeAdsCount: activeAdsResult.count,
      totalActiveSpend: activeAdsResult.totalSpend,
      videoAdsCount: activeAdsResult.videoCount,
      imageAdsCount: activeAdsResult.imageCount,
      activeAds: activeAdsResult.ads.slice(0, 10), // Return top 10 for debugging
      criteria: {
        minDaysRunning: 3,
        minSpend: 1,
        logic: 'Recent weeks (W24/W25) + Quality (days_running > 3) + Meaningful (spend > $1)',
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error in active ads calculation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 