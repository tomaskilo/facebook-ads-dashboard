import { NextResponse } from 'next/server'
import { adsCalculator } from '@/lib/ads-calculations'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🧹 API: Clearing all caches...')
    
    // Clear all application caches
    adsCalculator.clearAllCaches()
    
    return NextResponse.json({ 
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error clearing caches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear caches' },
      { status: 500 }
    )
  }
} 