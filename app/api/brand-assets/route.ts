import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Fetching brand assets...')

    const { data: brandAssets, error } = await supabase
      .from('brand_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brand assets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${brandAssets?.length || 0} brand assets`)
    return NextResponse.json(brandAssets || [])

  } catch (error) {
    console.error('Error fetching brand assets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      website_url,
      description,
      audience,
      benefits,
      product_category,
      market_segment,
      scrape_website = false
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    // Create the basic product entry
    const productData = {
      name,
      website_url,
      description,
      audience,
      benefits: benefits || [],
      product_category,
      market_segment
    }

    const { data: newAsset, error: insertError } = await supabase
      .from('brand_assets')
      .insert([productData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating brand asset:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // If website scraping is requested, trigger the scraping process
    if (scrape_website && website_url) {
      console.log(`Triggering website scraping for ${website_url}`)
      try {
        const scrapeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/brand-assets/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assetId: newAsset.id, 
            websiteUrl: website_url 
          })
        })

        if (!scrapeResponse.ok) {
          console.error('Website scraping failed, but product was created')
        }
      } catch (scrapeError) {
        console.error('Error triggering website scrape:', scrapeError)
        // Don't fail the whole request if scraping fails
      }
    }

    return NextResponse.json(newAsset)

  } catch (error) {
    console.error('Error creating brand asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      website_url,
      description,
      audience,
      benefits,
      competitors,
      product_category,
      market_segment,
      target_demographics,
      pricing_info,
      key_features,
      brand_positioning,
      unique_selling_points
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    const updateData = {
      name,
      website_url,
      description,
      audience,
      benefits,
      competitors,
      product_category,
      market_segment,
      target_demographics,
      pricing_info,
      key_features,
      brand_positioning,
      unique_selling_points,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const { data: updatedAsset, error: updateError } = await supabase
      .from('brand_assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating brand asset:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedAsset)

  } catch (error) {
    console.error('Error updating brand asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    console.log(`Deleting brand asset with ID: ${id}`)

    const { error } = await supabase
      .from('brand_assets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting brand asset:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Successfully deleted brand asset ${id}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting brand asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 