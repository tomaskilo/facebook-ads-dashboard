import { NextRequest, NextResponse } from 'next/server'
// Temporarily disabled for deployment
// import { analyzeProductWebsite, findCompetitors } from '@/lib/openai'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { productId, website } = await request.json()

    if (!productId || !website) {
      return NextResponse.json(
        { error: 'Product ID and website are required' },
        { status: 400 }
      )
    }

    // Create Supabase client only when needed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Temporary mock analysis for deployment
    const analysis = {
      websiteAnalysis: {
        category: 'E-commerce',
        targetAudience: 'Health & Wellness enthusiasts',
        valuePropositions: [
          'Science-backed formulation',
          'Premium quality ingredients',
          'Trusted by customers worldwide'
        ],
        creativeThemes: ['Health', 'Wellness', 'Science', 'Premium']
      },
      competitorAnalysis: {
        directCompetitors: [
          'Competitor A - Similar product line',
          'Competitor B - Market leader',
          'Competitor C - Budget alternative'
        ],
        marketPositioning: 'Premium positioning in health & wellness market',
        marketingApproaches: [
          'Social media influencer partnerships',
          'Educational content marketing',
          'Customer testimonials and reviews'
        ]
      },
      analyzedAt: new Date().toISOString()
    }

    // Update product with analysis
    const { error: updateError } = await supabase
      .from('products')
      .update({ ai_analysis: analysis })
      .eq('id', productId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 