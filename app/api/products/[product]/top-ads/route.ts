import { NextRequest, NextResponse } from 'next/server';
import { adsCalculator } from '@/lib/ads-calculations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    console.log(`📊 Fetching top ads for ${product} using centralized calculator`);

    // Get product info and calculate top ads using centralized utility
    const productInfo = await adsCalculator.getProductInfo(product);
    const topAds = await adsCalculator.getProductTopAds(productInfo.table_name, productInfo.name);

    console.log(`✅ ${product} top ads processed: ${topAds.slice(0, 3).map(ad => ({ name: ad.name.substring(0, 50), spend: ad.spend }))}`);

    return NextResponse.json({ topAds });

  } catch (error) {
    console.error(`Error in ${params.product} top ads API:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 