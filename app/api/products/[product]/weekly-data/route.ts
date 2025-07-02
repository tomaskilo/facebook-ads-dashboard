import { NextRequest, NextResponse } from 'next/server';
import { adsCalculator } from '@/lib/ads-calculations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    console.log(`📊 Fetching weekly data for ${product} using centralized calculator`);

    // Get product info and calculate weekly data using centralized utility
    const productInfo = await adsCalculator.getProductInfo(product);
    const weeklyData = await adsCalculator.getProductWeeklyData(productInfo.table_name, productInfo.name);

    return NextResponse.json({ weeklyData });

  } catch (error) {
    console.error(`Error in ${params.product} weekly data API:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 