import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { adsCalculator } from '@/lib/ads-calculations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Fetching Colonbroom stats using centralized calculator')

    // Use centralized calculator for consistent results
    const stats = await adsCalculator.getProductStats('cb_ads_data', 'Colonbroom')

    console.log('✅ Colonbroom stats calculated with centralized calculator:', stats)

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Colonbroom stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 