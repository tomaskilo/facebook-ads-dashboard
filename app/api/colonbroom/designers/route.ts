import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all designers for Colonbroom
export async function GET() {
  try {
    const { data: designers, error } = await supabase
      .from('designers')
      .select('*')
      .eq('product', 'CB')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching designers:', error)
      return NextResponse.json({ error: 'Failed to fetch designers' }, { status: 500 })
    }

    return NextResponse.json({ designers: designers || [] })
  } catch (error) {
    console.error('Error in designers GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new designer
export async function POST(request: NextRequest) {
  try {
    const { name, surname, initials } = await request.json()

    // Validate input
    if (!name || !surname || !initials) {
      return NextResponse.json({ error: 'Name, surname, and initials are required' }, { status: 400 })
    }

    // Check if designer with same initials already exists for this product
    const { data: existingDesigner } = await supabase
      .from('designers')
      .select('*')
      .eq('product', 'CB')
      .eq('initials', initials.toUpperCase())
      .single()

    if (existingDesigner) {
      return NextResponse.json({ error: 'Designer with these initials already exists' }, { status: 400 })
    }

    // Insert new designer
    const { data: newDesigner, error } = await supabase
      .from('designers')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        initials: initials.toUpperCase().trim(),
        product: 'CB',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating designer:', error)
      return NextResponse.json({ error: 'Failed to create designer' }, { status: 500 })
    }

    return NextResponse.json({ designer: newDesigner })
  } catch (error) {
    console.error('Error in designers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 