import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductWebsite, findCompetitors } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { productId, website } = await request.json()

    if (!productId || !website) {
      return NextResponse.json(
        { error: 'Product ID and website are required' },
        { status: 400 }
      )
    }

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

    // Analyze website
    const websiteAnalysis = await analyzeProductWebsite(website)
    
    // Find competitors
    const competitorAnalysis = await findCompetitors(product.name, websiteAnalysis.category || 'Unknown')

    // Combine analysis
    const analysis = {
      websiteAnalysis,
      competitorAnalysis,
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