import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'crawled_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Get user session for filtering
    const session = await getServerSession()
    const userEmail = session?.user?.email || null
    
    // Build query
    let query = supabase
      .from('crawled_products')
      .select(`
        id,
        url,
        product_name,
        description,
        industry,
        brand_color,
        category,
        crawled_at,
        updated_at,
        view_count,
        last_viewed_at,
        created_by,
        crawl_status,
        meta_title,
        meta_description,
        images,
        logos
      `)
    
    // Apply filters
    if (search) {
      query = query.or(`
        product_name.ilike.%${search}%,
        description.ilike.%${search}%,
        url.ilike.%${search}%,
        industry.ilike.%${search}%,
        category.ilike.%${search}%
      `)
    }
    
    if (industry) {
      query = query.eq('industry', industry)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    // Only show successful crawls
    query = query.eq('crawl_status', 'success')
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Get total count for pagination
    const { count } = await supabase
      .from('crawled_products')
      .select('*', { count: 'exact', head: true })
      .eq('crawl_status', 'success')
    
    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Library fetch error:', error)
      throw error
    }
    
    // Parse JSON fields for each product
    const parsedData = data?.map(product => ({
      ...product,
      images: JSON.parse(product.images || '[]'),
      logos: JSON.parse(product.logos || '[]')
    })) || []
    
    // Get unique industries and categories for filters
    const { data: filterData } = await supabase
      .from('crawled_products')
      .select('industry, category')
      .eq('crawl_status', 'success')
    
    const industries = [...new Set(filterData?.map(item => item.industry).filter(Boolean))]
    const categories = [...new Set(filterData?.map(item => item.category).filter(Boolean))]
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        industries: industries.sort(),
        categories: categories.sort()
      },
      message: `Found ${data?.length || 0} crawled products`
    })
    
  } catch (error) {
    console.error('❌ Library API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch crawled products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Get user session for authorization
    const session = await getServerSession()
    const userEmail = session?.user?.email || null
    
    // Check if user owns this crawled product (optional security)
    const { data: product, error: fetchError } = await supabase
      .from('crawled_products')
      .select('created_by')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Allow deletion if user is the creator or if no creator is set
    if (product.created_by && product.created_by !== userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this product' },
        { status: 403 }
      )
    }
    
    const { error } = await supabase
      .from('crawled_products')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Delete error:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Delete API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 