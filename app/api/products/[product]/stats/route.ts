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
    console.log(`📊 Fetching stats for ${product} from table: ${tableName}`);

    // Fetch all ads data
    const { data: adsData, error: adsError } = await supabase
      .from(tableName)
      .select('*');

    if (adsError) {
      console.error('Error fetching ads data:', adsError);
      return NextResponse.json(
        { error: 'Failed to fetch ads data' },
        { status: 500 }
      );
    }

    console.log(`📊 Fetched ${adsData?.length || 0} ads for ${product}`);

    // Calculate truly active ads using same logic as category page
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

    // Filter for truly active ads:
    // 1. Has spend in the last 2 weeks (current or previous week)
    // 2. Has days_running > 3
    // 3. Has meaningful spend (> $1)
    const recentAds = adsData?.filter(ad => 
      (ad.week_number === currentWeekString || ad.week_number === lastWeekString) &&
      (ad.days_running || 0) > 3 &&
      (ad.spend_usd || 0) > 1
    ) || []

    // Remove duplicates by ad_name and get unique active ads
    const uniqueActiveAds = new Map()
    recentAds.forEach(ad => {
      if (!uniqueActiveAds.has(ad.ad_name) || uniqueActiveAds.get(ad.ad_name).spend_usd < ad.spend_usd) {
        uniqueActiveAds.set(ad.ad_name, ad)
      }
    })

    const activeAds = uniqueActiveAds.size
    console.log(`🔍 Found ${activeAds} truly active ads (from ${recentAds.length} recent ads) for ${product}`)

    // Calculate stats
    const totalSpend = adsData?.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0) || 0;
    
    // Count ads by spend categories
    const scaledAds = adsData?.filter(ad => (ad.spend_usd || 0) >= 1000).length || 0;
    const workingAds = adsData?.filter(ad => {
      const spend = ad.spend_usd || 0;
      return spend >= 100 && spend < 1000;
    }).length || 0;

    // Get unique weeks and calculate spend change
    const weeks = [...new Set(adsData?.map(ad => ad.week_number).filter(Boolean))];
    const sortedWeeks = weeks.sort();
    
    let totalSpendChange = 0;
    if (sortedWeeks.length >= 2) {
      const lastWeek = sortedWeeks[sortedWeeks.length - 1];
      const previousWeek = sortedWeeks[sortedWeeks.length - 2];
      
      const lastWeekSpend = adsData
        ?.filter(ad => ad.week_number === lastWeek)
        .reduce((sum, ad) => sum + (ad.spend_usd || 0), 0) || 0;
      
      const previousWeekSpend = adsData
        ?.filter(ad => ad.week_number === previousWeek)
        .reduce((sum, ad) => sum + (ad.spend_usd || 0), 0) || 0;

      if (previousWeekSpend > 0) {
        totalSpendChange = ((lastWeekSpend - previousWeekSpend) / previousWeekSpend) * 100;
      }
    }

    const stats = {
      totalSpend,
      totalSpendChange,
      activeAds,
      scaledAds,
      workingAds,
      newAds: adsData?.length || 0 // Total ads in database
    };

    console.log(`✅ ${product} stats calculated:`, stats);
    console.log(`📊 Active ads: ${activeAds} (truly active) vs ${adsData?.length || 0} (total in DB)`);

    return NextResponse.json({ stats });

  } catch (error) {
    console.error(`Error in ${params.product} stats API:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 