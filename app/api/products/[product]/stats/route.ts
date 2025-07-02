import { NextRequest, NextResponse } from 'next/server';
import { adsCalculator } from '@/lib/ads-calculations';

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    console.log(`📊 Fetching stats for ${product} using centralized calculator`);

    // Get product info and calculate all stats using centralized utility
    const productInfo = await adsCalculator.getProductInfo(product);
    const stats = await adsCalculator.getProductStats(productInfo.table_name, productInfo.name);

    return NextResponse.json({ stats });

  } catch (error) {
    console.error(`Error in ${params.product} stats API:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 