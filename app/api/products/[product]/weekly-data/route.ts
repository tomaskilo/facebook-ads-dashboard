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
    console.log(`📊 Fetching weekly data for ${product} from table: ${tableName}`);

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

    const totalRecords = adsData?.length || 0;
    console.log(`📊 Fetched data for ${product}, total records: ${totalRecords}`);

    // Get unique weeks
    const uniqueWeeks = [...new Set(adsData?.map(ad => ad.week_number).filter(Boolean))];
    console.log('Unique weeks in data:', uniqueWeeks);

    // Group data by week
    const weeklyData = uniqueWeeks.map(week => {
      const weekAds = adsData?.filter(ad => ad.week_number === week) || [];
      
      const spend = weekAds.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0);
      const adsCount = weekAds.length;
      
      // Count scaled ads ($1000+/week)
      const scaledAds = weekAds.filter(ad => (ad.spend_usd || 0) >= 1000).length;
      
      // Count working ads ($100-$1000/week)
      const workingAds = weekAds.filter(ad => {
        const adSpend = ad.spend_usd || 0;
        return adSpend >= 100 && adSpend < 1000;
      }).length;
      
      // Count by creative type
      const videoAds = weekAds.filter(ad => 
        ad.creative_type?.toLowerCase() === 'video'
      ).length;
      
      const imageAds = weekAds.filter(ad => 
        ad.creative_type?.toLowerCase() === 'image' || 
        ad.creative_type?.toLowerCase() === 'share'
      ).length;

      return {
        week,
        spend: Math.round(spend),
        adsCount,
        scaledAds,
        workingAds,
        videoAds,
        imageAds
      };
    });

    // Sort by week number
    const sortedWeeklyData = weeklyData.sort((a, b) => {
      const getWeekNumber = (week: string) => parseInt(week.replace('W', ''));
      return getWeekNumber(a.week) - getWeekNumber(b.week);
    });

    console.log('Processed weekly data keys:', sortedWeeklyData.map(w => w.week));
    console.log('Final weekly array:', sortedWeeklyData);

    return NextResponse.json({ weeklyData: sortedWeeklyData });

  } catch (error) {
    console.error(`Error in ${params.product} weekly data API:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 