import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    
    // First, get the product info from products table (case-insensitive)
    const { data: productInfo, error: productError } = await supabase
      .from('products')
      .select('initials, name')
      .ilike('name', `%${product}%`)
      .single();

    if (productError || !productInfo) {
      return NextResponse.json(
        { error: `Product "${product}" not found` },
        { status: 404 }
      );
    }

    const productInitials = productInfo.initials;
    console.log(`📊 Fetching designers for ${product} (${productInitials})`);

    const { data: designers, error } = await supabase
      .from('designers')
      .select('*')
      .eq('product', productInitials)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching designers:', error)
      return NextResponse.json({ error: 'Failed to fetch designers' }, { status: 500 })
    }

    console.log(`✅ Found ${designers?.length || 0} designers for ${product}`);
    return NextResponse.json({ designers: designers || [] })
  } catch (error) {
    console.error('Error in designers GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { product: string } }
) {
  try {
    const { product } = params;
    const { name, surname, initials } = await request.json()

    // Validate input
    if (!name || !surname || !initials) {
      return NextResponse.json({ error: 'Name, surname, and initials are required' }, { status: 400 })
    }

    // First, get the product info from products table (case-insensitive)
    const { data: productInfo, error: productError } = await supabase
      .from('products')
      .select('initials, name')
      .ilike('name', `%${product}%`)
      .single();

    if (productError || !productInfo) {
      return NextResponse.json(
        { error: `Product "${product}" not found` },
        { status: 404 }
      );
    }

    const productInitials = productInfo.initials;
    console.log(`📊 Creating designer for ${product} (${productInitials})`);

    // Check if designer with same initials already exists for this product
    const { data: existingDesigner } = await supabase
      .from('designers')
      .select('*')
      .eq('product', productInitials)
      .eq('initials', initials.toUpperCase())
      .single()

    if (existingDesigner) {
      return NextResponse.json({ error: 'Designer with these initials already exists for this product' }, { status: 400 })
    }

    // Insert new designer
    const { data: newDesigner, error } = await supabase
      .from('designers')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        initials: initials.toUpperCase().trim(),
        product: productInitials,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating designer:', error)
      return NextResponse.json({ error: 'Failed to create designer' }, { status: 500 })
    }

    console.log(`✅ Created designer ${initials} for ${product} (${productInitials})`);
    return NextResponse.json({ designer: newDesigner })
  } catch (error) {
    console.error('Error in designers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 