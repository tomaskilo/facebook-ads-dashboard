import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch the crawled product with full details
    const { data, error } = await supabase
      .from('crawled_products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    // Parse JSON fields back to arrays/objects
    const parsedData = {
      ...data,
      uniqueSellingPoints: JSON.parse(data.unique_selling_points || '[]'),
      benefits: JSON.parse(data.benefits || '[]'),
      painPoints: JSON.parse(data.pain_points || '[]'),
      targetAudience: JSON.parse(data.target_audience || '[]'),
      keyFeatures: JSON.parse(data.key_features || '[]'),
      ctaOffers: JSON.parse(data.cta_offers || '[]'),
      pricing: JSON.parse(data.pricing || '[]'),
      competitors: JSON.parse(data.competitors || '[]'),
      images: JSON.parse(data.images || '[]'),
      logos: JSON.parse(data.logos || '[]')
    }
    
    // Increment view count
    await supabase.rpc('increment_crawled_product_views', { 
      product_id: parseInt(id) 
    })
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      message: 'Product loaded successfully'
    })
    
  } catch (error) {
    console.error('❌ Single product fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 