import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    const supabase = createServiceSupabaseClient();

    // First, get the product info from products table (case-insensitive)
    const { data: productInfo, error: productError } = await supabase
      .from('products')
      .select('table_name, name')
      .ilike('name', `%${product}%`)
      .single();

    if (productError || !productInfo) {
      return NextResponse.json(
        { error: `Product "${product}" not found` },
        { status: 404 }
      );
    }

    const tableName = productInfo.table_name;
    console.log(`📊 Fetching top ads for ${product} from table: ${tableName}`);

    // Fetch top ads by spend
    const { data: topAdsData, error: topAdsError } = await supabase
      .from(tableName)
      .select('*')
      .order('spend_usd', { ascending: false })
      .limit(20); // Get top 20 ads

    if (topAdsError) {
      console.error('Error fetching top ads:', topAdsError);
      return NextResponse.json(
        { error: 'Failed to fetch top ads' },
        { status: 500 }
      );
    }

    console.log(`📊 Fetched ${topAdsData?.length || 0} top ads for ${product}`);

    // Transform the data to match expected format
    const topAds = topAdsData?.map(ad => ({
      name: ad.ad_name || 'Unknown Ad',
      spend: ad.spend_usd || 0,
      roas: 0, // This would need to be calculated if you have revenue data
      status: ad.spend_usd > 0 ? 'Active' : 'Inactive',
      creative_hub: ad.is_creative_hub === 1,
      impressions: ad.impressions || 0,
      days_running: ad.days_running || 0,
      creative_type: ad.creative_type || 'Unknown',
      week_number: ad.week_number || 'Unknown'
    })) || [];

    console.log(`✅ ${product} top ads processed:`, topAds.slice(0, 3));

    return NextResponse.json({ topAds });

  } catch (error) {
    console.error(`Error in ${params.product} top ads API:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 